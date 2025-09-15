# Changelog

All notable changes to this project will be documented in this file.

## 1.2.1
- Package metadata: add `unpkg`/`jsdelivr` fields
- Docs polish and README structure improvements
- Offline defaults retained (`offlineOnly=true`), minor fixes for build stability

## 1.2.0
- Embed BlazeFace model for offline npm usage (no network needed)
- Prefer local npm deps for `@tensorflow/tfjs` and `@tensorflow-models/blazeface`
- Add `offlineOnly` option (defaults to true) to avoid CDN fallback
- Vue 3: add `renderContainer` prop to allow fully hidden component
- Docs: npm badges, CDN usage, clearer API/FAQ
- Build: add `sideEffects: false`; generate embedded IOHandler module

## 1.1.0
- Initial npm packaging, Vue 3 wrapper, CDN loading support
- Standalone bundle generation
