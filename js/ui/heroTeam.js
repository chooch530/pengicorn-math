// Heroes world: pick a team. Super Heroes (a caped kid hero) or Super Unicorns.
// Saved per kid (kid.prefs.team); the Hero Path chip opens this again to switch.
import { h } from './dom.js';
import { art } from '../art/registry.js';
import { teamCharacter } from '../art/hero.js';
import { topbar, homeButton } from './chrome.js';
import { sfx } from '../audio/sfx.js';
import * as speech from '../audio/speech.js';
import { setTeam } from '../logic/progress.js';

export function render(app) {
  const kid = app.kid;
  if (!kid) return app.go('kids');

  const preview = (team) => teamCharacter({ ...kid, prefs: { ...kid.prefs, team } });

  const card = (team, label, glyph) => {
    const who = preview(team);
    return h(
      'button',
      {
        class: `mode-card team-card team-${team}${kid.prefs.team === team ? ' selected' : ''}`,
        'aria-label': label,
        onclick: () => {
          sfx.correct();
          app.updateKid(setTeam(kid, team));
          speech.speak(team === 'unicorn' ? 'Super unicorns!' : 'Super heroes!', { remember: false });
          app.go('heroPath');
        },
      },
      h('div', { class: 'mode-glyph' }, glyph),
      art.character(who.kind, who.variant, { className: 'float' })
    );
  };

  const el = h(
    'div',
    { class: 'screen' },
    topbar(app, { left: [homeButton(app, 'splash')] }),
    h('div', { class: 'mode-row' }, card('hero', 'Super heroes', 'POW'), card('unicorn', 'Super unicorns', 'ZAP'))
  );

  return {
    el,
    enter() {
      document.body.dataset.theme = 'hero';
      speech.speak('Pick your team! Super heroes, or super unicorns?');
    },
  };
}
