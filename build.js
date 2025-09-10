/* Build script
 * - dist/face-detector.min.js: wrapper only (expects libs provided externally)
 * - dist/face-detector.standalone.min.js: includes TF.js + BlazeFace + wrapper (single file)
 */
const fs = require('fs');
const path = require('path');

async function run() {
  const inputPath = path.resolve(__dirname, 'face-detector.js');
  const outDir = path.resolve(__dirname, 'dist');
  const outPath = path.join(outDir, 'face-detector.min.js');
  const outStandalonePath = path.join(outDir, 'face-detector.standalone.min.js');

  if (!fs.existsSync(inputPath)) {
    throw new Error('Input file not found: ' + inputPath);
  }
  if (!fs.existsSync(outDir)) fs.mkdirSync(outDir);

  const source = fs.readFileSync(inputPath, 'utf8');

  // Try read local libs for standalone bundle
  const libsDir = path.resolve(__dirname, 'libs');
  let libsCode = '';
  const tfPath = path.join(libsDir, 'tf.min.js');
  const blazePath = path.join(libsDir, 'blazeface.js');
  if (fs.existsSync(tfPath)) libsCode += fs.readFileSync(tfPath, 'utf8') + '\n';
  if (fs.existsSync(blazePath)) libsCode += fs.readFileSync(blazePath, 'utf8') + '\n';

  // Optionally inline BlazeFace model (model.json + shard bin) if present
  // Expected layout: ./models/blazeface/model.json and shard files next to it
  const modelsDir = path.resolve(__dirname, 'models', 'blazeface');
  let embeddedModelSnippet = '';
  if (fs.existsSync(modelsDir)) {
    const modelJsonPath = path.join(modelsDir, 'model.json');
    if (fs.existsSync(modelJsonPath)) {
      try {
        const raw = fs.readFileSync(modelJsonPath, 'utf8');
        if (!raw.trim().startsWith('{')) {
          throw new Error('model.json is not valid JSON (got HTML or XML?)');
        }
        const modelJson = JSON.parse(raw);
        const manifests = Array.isArray(modelJson.weightsManifest) ? modelJson.weightsManifest : [];
        const weightSpecs = [];
        const shardBuffers = [];
        for (const group of manifests) {
          if (Array.isArray(group.weights)) weightSpecs.push(...group.weights);
          if (Array.isArray(group.paths)) {
            for (const p of group.paths) {
              const shardPath = path.join(modelsDir, p);
              if (!fs.existsSync(shardPath)) {
                throw new Error('Missing shard file: ' + shardPath);
              }
              const buf = fs.readFileSync(shardPath);
              if (buf.length < 4096) {
                throw new Error('Shard looks too small (' + buf.length + ' bytes): ' + shardPath);
              }
              shardBuffers.push(buf);
            }
          }
        }
        const weightData = Buffer.concat(shardBuffers);
        if (weightData.length % 4 !== 0) {
          throw new Error('Concatenated weight buffer size not multiple of 4 (' + weightData.length + ' bytes)');
        }
        const weightB64 = weightData.toString('base64');
        const topology = modelJson.modelTopology || modelJson;

        // Runtime snippet: registers a global IOHandler returning model artifacts from memory
        embeddedModelSnippet = `\n;(function(g){try{\n  var artifacts={\n    format:'graph-model',\n    generatedBy:'custom-embed',\n    convertedBy:'tfjs-converter',\n    modelTopology:${JSON.stringify(topology)},\n    weightSpecs:${JSON.stringify(weightSpecs)},\n    weightDataBase64:'${weightB64}'\n  };\n  function b64ToBuf(b64){if(typeof atob==='function'){var bin=atob(b64);var len=bin.length;var bytes=new Uint8Array(len);for(var i=0;i<len;i++){bytes[i]=bin.charCodeAt(i)};return bytes.buffer;}else{\n    return Buffer.from(b64,'base64').buffer;\n  }}\n  g.__BLAZEFACE_EMBEDDED_IO_HANDLER__={\n    load: async function(){\n      return {\n        format: artifacts.format,\n        generatedBy: artifacts.generatedBy,\n        convertedBy: artifacts.convertedBy,\n        modelTopology: artifacts.modelTopology,\n        weightSpecs: artifacts.weightSpecs,\n        weightData: b64ToBuf(artifacts.weightDataBase64)\n      };\n    }\n  };\n}catch(e){console && console.warn && console.warn('Embed BlazeFace model failed:',e);}})(typeof window!=='undefined'?window:globalThis);\n`;
        console.log('Embedded BlazeFace model -> inlined into standalone bundle');
      } catch (e) {
        console.warn('Failed to embed BlazeFace model:', e.message);
      }
    }
  }

  // Append a small runtime hardening snippet to freeze the public API
  const harden = `\n;(function(g){try{var FD=(typeof module!=='undefined'&&module.exports)?module.exports:(g&&g.FaceDetector);if(FD){Object.freeze(FD.prototype);Object.freeze(FD);}}catch(e){}})(typeof window!=='undefined'?window:globalThis);`;

  // Step 1: Minify our wrapper with terser (do not minify third-party libs again)
  const terser = require('terser');
  const minified = await terser.minify(source + harden, {
    compress: {
      passes: 2,
      dead_code: true,
      drop_console: false
    },
    mangle: {
      toplevel: true
    },
    format: {
      ascii_only: true
    }
  });

  if (!minified.code) throw new Error('Terser failed to produce output');

  // Step 2: Obfuscate our wrapper only (avoid breaking vendor libs)
  const JavaScriptObfuscator = require('javascript-obfuscator');
  const obf = JavaScriptObfuscator.obfuscate(minified.code, {
    compact: true,
    controlFlowFlattening: true,
    controlFlowFlatteningThreshold: 0.75,
    deadCodeInjection: true,
    deadCodeInjectionThreshold: 0.2,
    disableConsoleOutput: false,
    identifierNamesGenerator: 'hexadecimal',
    rotateStringArray: true,
    selfDefending: true,
    stringArray: true,
    stringArrayEncoding: ['base64'],
    stringArrayThreshold: 0.75,
    splitStrings: true,
    splitStringsChunkLength: 6,
    target: 'browser',
    // Ensure the public name FaceDetector (on window or module.exports) still works
    reservedNames: ['^FaceDetector$']
  });

  const wrapperCode = obf.getObfuscatedCode();

  // Output 1: wrapper only
  fs.writeFileSync(outPath, wrapperCode, 'utf8');
  console.log('Built ->', path.relative(process.cwd(), outPath));

  // Output 2: standalone (libs + optional embedded model + wrapper)
  if (libsCode) {
    // In case globals are not yet defined, libsCode defines tf/blazeface, optional embedded IO handler, then wrapper uses them.
    fs.writeFileSync(outStandalonePath, libsCode + embeddedModelSnippet + '\n' + wrapperCode, 'utf8');
    console.log('Built ->', path.relative(process.cwd(), outStandalonePath));
  } else {
    console.warn('Standalone bundle skipped: libs not found in ./libs');
  }
}

run().catch(err => {
  console.error(err);
  process.exit(1);
});
