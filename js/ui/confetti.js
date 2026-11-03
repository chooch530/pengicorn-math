// Lightweight confetti burst on a full-screen canvas. Removes itself when done.

const COLORS = ['#ff6b9d', '#ffd23f', '#5bc0ff', '#7ed957', '#b07cff', '#ffa25a'];

export function confetti({ duration = 2800, count = 140 } = {}) {
  const canvas = document.createElement('canvas');
  canvas.id = 'confetti';
  document.body.append(canvas);
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  const W = (canvas.width = innerWidth * dpr);
  const H = (canvas.height = innerHeight * dpr);
  canvas.style.width = innerWidth + 'px';
  canvas.style.height = innerHeight + 'px';
  const g = canvas.getContext('2d');

  const parts = Array.from({ length: count }, () => ({
    x: W / 2 + (Math.random() - 0.5) * W * 0.3,
    y: H * 0.35,
    vx: (Math.random() - 0.5) * 22 * dpr,
    vy: (-Math.random() * 20 - 8) * dpr,
    r: (6 + Math.random() * 8) * dpr,
    a: Math.random() * Math.PI,
    va: (Math.random() - 0.5) * 0.4,
    c: COLORS[(Math.random() * COLORS.length) | 0],
    round: Math.random() < 0.3,
  }));

  const start = performance.now();
  let raf;
  function frame(now) {
    const t = now - start;
    g.clearRect(0, 0, W, H);
    for (const p of parts) {
      p.vy += 0.6 * dpr;
      p.vx *= 0.99;
      p.x += p.vx;
      p.y += p.vy;
      p.a += p.va;
      g.save();
      g.globalAlpha = Math.max(0, 1 - t / duration);
      g.translate(p.x, p.y);
      g.rotate(p.a);
      g.fillStyle = p.c;
      if (p.round) {
        g.beginPath();
        g.arc(0, 0, p.r / 2, 0, Math.PI * 2);
        g.fill();
      } else g.fillRect(-p.r / 2, -p.r / 4, p.r, p.r / 2);
      g.restore();
    }
    if (t < duration) raf = requestAnimationFrame(frame);
    else canvas.remove();
  }
  raf = requestAnimationFrame(frame);
  return () => {
    cancelAnimationFrame(raf);
    canvas.remove();
  };
}
