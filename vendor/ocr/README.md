# Vendored OCR (photo → words)

Used only by the parent area's "Add teacher list" screen. Loaded on demand, never at game start,
and not part of the offline cache. Nothing is sent off the device.

- `tesseract-core-simd-lstm.wasm.js`, `tesseract-core-lstm.wasm.js`: Tesseract 5 compiled to
  WebAssembly, from tesseract.js-core v5.1.1 (Apache-2.0, see LICENSE-tesseract.txt).
  The SIMD build is used when the browser supports it (iPadOS 16.4+), otherwise the plain build.
- `eng.traineddata`: English LSTM model (tessdata_fast, Apache-2.0).
- `ocr-worker.js`: our own tiny Web Worker that drives the engine (no tesseract.js wrapper).
