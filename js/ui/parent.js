// Grown-ups only. Reached by holding the gear for 3 seconds, then answering a
// math question on a number pad that 5–7 year olds can't do yet.
import { h, icons } from './dom.js';
import * as speech from '../audio/speech.js';
import { accuracy, mostMissed, newKid, exportStore, importStore, unlockAll, setPictures, activeListId, setWordList } from '../logic/progress.js';
import { BUILTIN_LISTS } from '../logic/sight.js';
import { openListEditor } from './listEditor.js';
import { LEVELS } from '../logic/levels.js';

function gateQuestion() {
  const a = 6 + Math.floor(Math.random() * 4); // 6..9
  const b = 6 + Math.floor(Math.random() * 4);
  return { text: `${a} × ${b} = ?`, answer: a * b };
}

export function openParentGate(app) {
  speech.stop();
  const q = gateQuestion();
  let entry = '';
  const shown = h('div', { class: 'gate-entry' }, ' ');
  const overlay = h('div', { class: 'overlay' });
  const close = () => overlay.remove();

  const press = (k) => {
    if (k === 'del') entry = entry.slice(0, -1);
    else if (k === 'ok') {
      if (Number(entry) === q.answer) {
        close();
        openParentPanel(app);
        return;
      }
      entry = '';
      shown.animate([{ transform: 'translateX(-8px)' }, { transform: 'translateX(8px)' }, { transform: 'none' }], 300);
    } else if (entry.length < 3) entry += k;
    shown.textContent = entry || ' ';
  };

  const keys = ['1', '2', '3', '4', '5', '6', '7', '8', '9', 'del', '0', 'ok'];
  overlay.append(
    h(
      'div',
      { class: 'sheet', style: { maxWidth: '440px' } },
      h('h2', {}, 'Grown-ups only'),
      h('p', {}, 'Answer to open the parent area.'),
      h('div', { class: 'gate-q' }, q.text),
      shown,
      h(
        'div',
        { class: 'numpad' },
        keys.map((k) =>
          h(
            'button',
            { class: `btn ${k === 'ok' ? 'btn-primary' : ''}`, onclick: () => press(k) },
            k === 'del' ? '⌫' : k === 'ok' ? 'OK' : k
          )
        )
      ),
      h('div', { class: 'row-gap', style: { justifyContent: 'center' } }, h('button', { class: 'btn small-btn', onclick: close }, 'Cancel'))
    )
  );
  overlay.addEventListener('click', (e) => e.target === overlay && close());
  document.body.append(overlay);
}

function openParentPanel(app) {
  const overlay = h('div', { class: 'overlay' });
  const sheet = h('div', { class: 'sheet' });
  overlay.append(sheet);
  document.body.append(overlay);

  const close = () => {
    overlay.remove();
    app.refresh();
  };

  function kidReport(kid) {
    const acc = accuracy(kid, 'add');
    const s = kid.stats.add;
    const mp = kid.modes.add;
    const missed = mostMissed(kid, 'add', 5);
    return h(
      'div',
      { class: 'kid-report' },
      h('h3', { style: { marginTop: 0 } }, `${kid.name} (${kid.avatar})`),
      h(
        'div',
        { class: 'stats' },
        h('div', {}, h('b', {}, acc === null ? '—' : `${acc}%`), 'first-try accuracy (addition)'),
        h('div', {}, h('b', {}, String(s.problems)), 'problems answered'),
        h('div', {}, h('b', {}, mp.level === 1 ? 'Level 1' : `Levels 1–${mp.level}`), 'addition levels open'),
        h('div', {}, h('b', {}, String(kid.totalStars)), 'stars earned')
      ),
      h(
        'p',
        {},
        missed.length
          ? 'Missed most: ' + missed.map(([id, n]) => `${id.replace('+', ' + ')} (${n}×)`).join(', ')
          : 'No missed problems yet.'
      ),
      h(
        'div',
        { class: 'pref-row' },
        h('div', {}, h('b', {}, 'Counting pictures'), h('div', { class: 'note' }, 'On = fish or snowballs shown with every problem (easier). Off = numbers only; pictures still appear as a hint after a wrong answer.')),
        h(
          'button',
          {
            class: `toggle ${kid.prefs?.pictures ? 'on' : ''}`,
            role: 'switch',
            'aria-checked': kid.prefs?.pictures ? 'true' : 'false',
            'aria-label': `Counting pictures for ${kid.name}`,
            onclick: () => {
              app.updateKid(setPictures(kid, !kid.prefs?.pictures));
              paint();
            },
          },
          h('span', { class: 'knob' }),
          h('span', { class: 'toggle-label' }, kid.prefs?.pictures ? 'On' : 'Off')
        )
      ),
      wordsReport(kid),
      h(
        'div',
        { class: 'row-gap' },
        h(
          'button',
          {
            class: 'btn small-btn danger',
            onclick: () => {
              if (!confirm(`Reset all progress for ${kid.name}? Stars and stats go back to zero.`)) return;
              const fresh = newKid({ name: kid.name, avatar: kid.avatar, color: kid.color });
              fresh.id = kid.id;
              app.updateKid(fresh);
              paint();
            },
          },
          'Reset progress'
        ),
        mp.level < Math.max(...Object.keys(LEVELS.add).map(Number))
          ? h(
              'button',
              {
                class: 'btn small-btn',
                onclick: () => {
                  app.updateKid(unlockAll(kid, 'add'));
                  paint();
                },
              },
              'Unlock all levels'
            )
          : null,
        h(
          'button',
          {
            class: 'btn small-btn danger',
            onclick: () => {
              if (!confirm(`Delete ${kid.name}'s player? This can't be undone.`)) return;
              app.store.kids = app.store.kids.filter((k) => k.id !== kid.id);
              app.save();
              paint();
            },
          },
          'Delete player'
        )
      )
    );
  }

  function wordsReport(kid) {
    const acc = accuracy(kid, 'words');
    const missed = mostMissed(kid, 'words', 8);
    const current = activeListId(kid, app.store.lists);
    const options = [
      ...app.store.lists.map((l) => ({ id: l.id, label: `${l.name} (${l.words.length} words)` })),
      ...BUILTIN_LISTS.map((l) => ({ id: l.id, label: `Dolch ${l.name} (${l.words.length} words)` })),
    ];
    const sel = h(
      'select',
      {
        'aria-label': `Sight word list for ${kid.name}`,
        onchange: () => {
          app.updateKid(setWordList(kid, sel.value));
          paint();
        },
      },
      options.map((o) => h('option', { value: o.id, selected: o.id === current }, o.label))
    );
    return h(
      'div',
      { class: 'words-report' },
      h('div', { class: 'pref-row' }, h('b', {}, 'Sight word list'), sel),
      h(
        'p',
        {},
        `Words: ${acc === null ? 'not played yet' : `${acc}% first try, ${kid.stats.words.problems} words read`}. ` +
          (missed.length ? 'Missed most: ' + missed.map(([w, n]) => `${w} (${n}×)`).join(', ') : '')
      )
    );
  }

  function listsSection() {
    const lists = app.store.lists;
    return h(
      'div',
      {},
      h('h3', {}, 'Sight word lists'),
      lists.length
        ? h(
            'div',
            {},
            lists
              .slice()
              .reverse()
              .map((l) =>
                h(
                  'div',
                  { class: 'list-item' },
                  h('div', {}, h('b', {}, l.name), h('div', { class: 'note' }, `${l.words.length} words · ${l.words.slice(0, 12).join(', ')}${l.words.length > 12 ? '…' : ''}`)),
                  h(
                    'div',
                    { class: 'row-gap', style: { marginTop: 0 } },
                    h('button', { class: 'btn small-btn', onclick: () => openListEditor(app, { list: l, onDone: paint }) }, 'Edit'),
                    h(
                      'button',
                      {
                        class: 'btn small-btn danger',
                        onclick: () => {
                          if (!confirm(`Delete the list "${l.name}"?`)) return;
                          app.store.lists = app.store.lists.filter((x) => x.id !== l.id);
                          app.save();
                          paint();
                        },
                      },
                      'Delete'
                    )
                  )
                )
              )
          )
        : h('p', { class: 'note' }, 'No teacher lists yet. Kids practice the Dolch lists until you add one. A new list becomes every kid\'s list unless you picked one for them.'),
      h(
        'div',
        { class: 'row-gap' },
        h('button', { class: 'btn small-btn primary-small', onclick: () => openListEditor(app, { onDone: paint }) }, '+ Add teacher list')
      )
    );
  }

  function voicePicker() {
    const voices = speech.englishVoices();
    if (!voices.length) return h('p', { class: 'note' }, 'No English voices found on this device.');
    const best = speech.bestVoiceQuality();
    const sel = h(
      'select',
      {
        'aria-label': 'Voice',
        onchange: () => {
          speech.setVoice(sel.value, best);
          app.store.settings.voiceURI = sel.value;
          app.store.settings.voiceBestAtPick = best;
          app.save();
          speech.speak('Hi! What is 3 plus 4? Find the word: said.', { remember: false });
        },
      },
      voices.map((v) =>
        h(
          'option',
          { value: v.voiceURI, selected: v.name === speech.currentVoiceName() },
          `${v.name}${speech.qualityLabel(v) && speech.qualityLabel(v) !== 'Standard' ? ` · ${speech.qualityLabel(v)}` : ''} (${v.lang})`
        )
      )
    );
    const hasGood = best >= 2;
    return h(
      'div',
      {},
      h(
        'div',
        { class: 'row-gap', style: { marginTop: 0, alignItems: 'center' } },
        sel,
        h('button', { class: 'btn small-btn', onclick: () => speech.speak('Hi! What is 3 plus 4? Find the word: said.', { remember: false }) }, 'Test voice')
      ),
      h(
        'p',
        { class: 'note' },
        hasGood
          ? 'Voices are listed best first. "Premium" voices sound the most natural.'
          : 'This iPad only has basic (robotic) voices. To get a natural one: Settings → Accessibility → Spoken Content (or Read & Speak) → Voices → English → pick Ava, Zoe or Evan → download the "Premium" version (about 200–400 MB, needs Wi-Fi). Then close and reopen the game; it switches to the new voice automatically.'
      )
    );
  }

  function paint() {
    sheet.replaceChildren(
      h(
        'div',
        { class: 'row-gap', style: { justifyContent: 'space-between', alignItems: 'center', marginTop: 0 } },
        h('h2', { style: { margin: 0 } }, 'Parent area'),
        h('button', { class: 'btn small-btn', onclick: close }, 'Done')
      ),
      ...(app.store.kids.length ? app.store.kids.map(kidReport) : [h('p', {}, 'No players yet.')]),
      listsSection(),
      h('h3', {}, 'Voice'),
      voicePicker(),
      h('h3', {}, 'Backup'),
      h(
        'p',
        { class: 'note' },
        'Progress lives on this iPad only. Always open the game from its home-screen icon: Safari tabs can erase saved data after 7 days without a visit, and the icon and Safari keep separate progress.'
      ),
      h(
        'div',
        { class: 'row-gap' },
        h(
          'button',
          {
            class: 'btn small-btn',
            onclick: async () => {
              const code = exportStore(app.store);
              try {
                await navigator.clipboard.writeText(code);
                alert('Backup code copied. Paste it into Notes to keep it.');
              } catch {
                prompt('Copy this backup code:', code);
              }
            },
          },
          'Copy backup code'
        ),
        h(
          'button',
          {
            class: 'btn small-btn',
            onclick: () => {
              const code = prompt('Paste a backup code. This replaces all current players.');
              if (!code) return;
              try {
                const s = importStore(code);
                app.replaceStore(s);
                paint();
                alert('Restored.');
              } catch {
                alert("That code didn't work. Check that the whole code was pasted.");
              }
            },
          },
          'Restore from code'
        )
      ),
      h(
        'p',
        { class: 'note', style: { marginTop: '20px' } },
        `Penguin Island levels: 1 = sums to ${LEVELS.add[1].maxAnswer}, 2 = to ${LEVELS.add[2].maxAnswer}, 3 = to ${LEVELS.add[3].maxAnswer}. ` +
          'Kids unlock the next level after 2 strong rounds in a row at the hardest difficulty of their current level.'
      )
    );
  }
  paint();
}
