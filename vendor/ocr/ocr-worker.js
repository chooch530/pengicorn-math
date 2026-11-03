// Web Worker: reads text from one image using Tesseract (WebAssembly), entirely on-device.
// Message in:  { id, image: Uint8Array (PNG/JPEG bytes) }
// Message out: { id, text } or { id, error }
let ready = null;

function simdSupported() {
  try {
    // Smallest valid module using a v128 instruction.
    return WebAssembly.validate(
      new Uint8Array([0, 97, 115, 109, 1, 0, 0, 0, 1, 5, 1, 96, 0, 1, 123, 3, 2, 1, 0, 10, 10, 1, 8, 0, 65, 0, 253, 15, 253, 98, 11])
    );
  } catch {
    return false;
  }
}

function init() {
  if (ready) return ready;
  ready = (async () => {
    importScripts(simdSupported() ? 'tesseract-core-simd-lstm.wasm.js' : 'tesseract-core-lstm.wasm.js');
    const Tess = await self.TesseractCore();
    const data = new Uint8Array(await (await fetch('eng.traineddata')).arrayBuffer());
    Tess.FS.writeFile('/eng.traineddata', data);
    const api = new Tess.TessBaseAPI();
    // OEM 1 = LSTM only (matches the fast model).
    if (api.Init('/', 'eng', 1) !== 0) throw new Error('OCR init failed');
    return { Tess, api };
  })();
  return ready;
}

self.onmessage = async (e) => {
  const { id, image } = e.data;
  try {
    const { Tess, api } = await init();
    Tess.FS.writeFile('/input', image);
    api.SetVariable('tessedit_pageseg_mode', '3'); // automatic layout (handles columns)
    api.SetImageFile(1, 0);
    api.Recognize(null);
    const text = api.GetUTF8Text();
    api.Clear();
    self.postMessage({ id, text });
  } catch (err) {
    self.postMessage({ id, error: String(err && err.message ? err.message : err) });
  }
};
