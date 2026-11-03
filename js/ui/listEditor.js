// Parent tool: add or edit a sight-word list from a photo of the teacher's printed list,
// or by typing/pasting. Photo reading runs on the device (vendor/ocr); nothing is uploaded.
import { h } from './dom.js';
import { parseWordList, normalizeWord } from '../logic/sight.js';
import { newList } from '../logic/progress.js';

// ---- on-device text reading ----

let worker = null;
let nextId = 1;

function getWorker() {
  if (!worker) worker = new Worker(new URL('../../vendor/ocr/ocr-worker.js', import.meta.url));
  return worker;
}

/** Shrink and convert any photo to PNG bytes (handles big iPhone photos; keeps memory low). */
async function prepareImage(file) {
  const url = URL.createObjectURL(file);
  try {
    const img = await new Promise((res, rej) => {
      const i = new Image();
      i.onload = () => res(i);
      i.onerror = () => rej(new Error('Could not open that photo'));
      i.src = url;
    });
    const max = 2000;
    const scale = Math.min(1, max / Math.max(img.naturalWidth, img.naturalHeight));
    const c = document.createElement('canvas');
    c.width = Math.round(img.naturalWidth * scale);
    c.height = Math.round(img.naturalHeight * scale);
    const g = c.getContext('2d');
    g.fillStyle = '#fff';
    g.fillRect(0, 0, c.width, c.height);
    g.filter = 'grayscale(1) contrast(1.4)';
    g.drawImage(img, 0, 0, c.width, c.height);
    const blob = await new Promise((res) => c.toBlob(res, 'image/png'));
    return new Uint8Array(await blob.arrayBuffer());
  } finally {
    URL.revokeObjectURL(url);
  }
}

export async function readTextFromPhoto(file) {
  const bytes = await prepareImage(file);
  const w = getWorker();
  const id = nextId++;
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      cleanup();
      reject(new Error('Reading took too long'));
    }, 90000);
    const onMsg = (e) => {
      if (e.data.id !== id) return;
      cleanup();
      e.data.error ? reject(new Error(e.data.error)) : resolve(e.data.text || '');
    };
    const onErr = (e) => {
      cleanup();
      worker = null;
      reject(new Error(e.message || 'Reader failed to start'));
    };
    function cleanup() {
      clearTimeout(timer);
      w.removeEventListener('message', onMsg);
      w.removeEventListener('error', onErr);
    }
    w.addEventListener('message', onMsg);
    w.addEventListener('error', onErr);
    w.postMessage({ id, image: bytes }, [bytes.buffer]);
  });
}

// ---- editor UI ----

export function openListEditor(app, { list = null, onDone = () => {} } = {}) {
  const today = new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  let words = list ? [...list.words] : [];

  const overlay = h('div', { class: 'overlay list-editor' });
  const sheet = h('div', { class: 'sheet' });
  overlay.append(sheet);
  document.body.append(overlay);
  const close = () => overlay.remove();

  const nameInput = h('input', {
    type: 'text',
    class: 'text-input',
    value: list ? list.name : `Class list ${today}`,
    maxlength: '30',
    'aria-label': 'List name',
  });

  const status = h('p', { class: 'note status' });
  const preview = h('div', { class: 'photo-preview' });
  const chips = h('div', { class: 'chips' });
  const count = h('span', { class: 'note' });
  const fileInput = h('input', { type: 'file', accept: 'image/*', style: { display: 'none' } });
  const paste = h('textarea', {
    class: 'text-input',
    rows: '3',
    placeholder: 'Type or paste words: the, said, was …',
    'aria-label': 'Type or paste words',
  });
  const addOne = h('input', { type: 'text', class: 'text-input small', placeholder: 'Add a word', 'aria-label': 'Add a word' });

  function addWords(newOnes) {
    const have = new Set(words.map((w) => w.toLowerCase()));
    let added = 0;
    for (const w of newOnes) {
      if (have.has(w.toLowerCase())) continue;
      have.add(w.toLowerCase());
      words.push(w);
      added++;
    }
    paintChips();
    return added;
  }

  function paintChips() {
    chips.replaceChildren(
      ...words.map((w, i) =>
        h(
          'span',
          { class: 'chip' },
          h(
            'button',
            {
              class: 'chip-word',
              'aria-label': `Fix ${w}`,
              onclick: () => {
                const fixed = prompt('Fix this word:', w);
                if (fixed == null) return;
                const clean = parseWordList(fixed);
                if (!clean.length) words.splice(i, 1);
                else words.splice(i, 1, clean[0]);
                paintChips();
              },
            },
            w
          ),
          h(
            'button',
            {
              class: 'chip-x',
              'aria-label': `Remove ${w}`,
              onclick: () => {
                words.splice(i, 1);
                paintChips();
              },
            },
            '×'
          )
        )
      )
    );
    count.textContent = words.length ? `${words.length} word${words.length === 1 ? '' : 's'} · tap a word to fix it, × to remove it` : 'No words yet.';
  }

  fileInput.addEventListener('change', async () => {
    const file = fileInput.files?.[0];
    fileInput.value = '';
    if (!file) return;
    const url = URL.createObjectURL(file);
    preview.replaceChildren(h('img', { src: url, alt: 'Your photo' }));
    status.textContent = 'Reading the list… the first time can take 10–20 seconds.';
    status.classList.remove('err');
    try {
      const text = await readTextFromPhoto(file);
      const found = parseWordList(text);
      const added = addWords(found);
      status.textContent = found.length
        ? `Found ${found.length} word${found.length === 1 ? '' : 's'} (${added} new). Check them against the photo, then Save.`
        : "Couldn't find words in that photo. Try a closer, straight-on photo in good light, or type them below.";
    } catch (err) {
      status.textContent = `Couldn't read the photo (${err.message}). You can type or paste the words below.`;
      status.classList.add('err');
    }
  });

  function save() {
    words = words.map(normalizeWord).filter(Boolean);
    if (!words.length) {
      alert('Add at least one word first.');
      return;
    }
    if (list) {
      const i = app.store.lists.findIndex((l) => l.id === list.id);
      if (i >= 0) app.store.lists[i] = { ...list, name: nameInput.value.trim() || list.name, words };
    } else {
      app.store.lists.push(newList(nameInput.value, words));
    }
    app.save();
    close();
    onDone();
  }

  sheet.append(
    h(
      'div',
      { class: 'row-gap', style: { justifyContent: 'space-between', alignItems: 'center', marginTop: 0 } },
      h('h2', { style: { margin: 0 } }, list ? 'Edit list' : 'Add teacher list'),
      h('button', { class: 'btn small-btn', onclick: close }, 'Cancel')
    ),
    h('label', { class: 'field-label' }, 'List name'),
    nameInput,
    h('h3', {}, '1. Photo of the printed list'),
    h(
      'p',
      { class: 'note' },
      'Lay the sheet flat in good light and take the photo straight on. The words are read on this iPad; the photo is never uploaded or saved.'
    ),
    h('div', { class: 'row-gap' }, h('button', { class: 'btn small-btn primary-small', onclick: () => fileInput.click() }, 'Take or choose a photo')),
    fileInput,
    status,
    preview,
    h('h3', {}, '2. Or type / paste words'),
    paste,
    h(
      'div',
      { class: 'row-gap' },
      h(
        'button',
        {
          class: 'btn small-btn',
          onclick: () => {
            const added = addWords(parseWordList(paste.value));
            if (added) paste.value = '';
          },
        },
        'Add these words'
      )
    ),
    h('h3', {}, '3. Check the words'),
    count,
    chips,
    h(
      'div',
      { class: 'row-gap' },
      addOne,
      h(
        'button',
        {
          class: 'btn small-btn',
          onclick: () => {
            addWords(parseWordList(addOne.value));
            addOne.value = '';
          },
        },
        'Add'
      )
    ),
    h('div', { class: 'row-gap', style: { marginTop: '20px' } }, h('button', { class: 'btn small-btn primary-small', onclick: save }, 'Save list'))
  );
  paintChips();
}
