// Fetch an SVG file, inject it inline into its container div, then wire up the click handler.
// Inline SVGs inherit CSS `color` from the page, so currentColor in the SVG follows style.css.
async function inlineSVG(containerId, command) {
    const container = document.getElementById(containerId);
    if (!container) return;

    const src = container.dataset.src;
    const response = await fetch(src);
    const text = await response.text();

    // innerHTML lets the HTML parser handle Inkscape namespaces gracefully
    container.innerHTML = text;

    const svg = container.querySelector('svg');
    if (!svg) return;

    svg.setAttribute('width', '100%');
    svg.setAttribute('height', '100%');
    svg.style.cursor = 'pointer';

    // Lively's web-wallpaper sandbox has no native process-launch API.
    // launcher.js bridges that gap — run it once: node launcher.js
    svg.addEventListener('click', () => {
        console.log(`Activating ${containerId}...`);
        fetch(`http://127.0.0.1:7890/launch?cmd=${encodeURIComponent(command)}`)
            .then(r => r.json())
            .then(data => console.log('Launch result:', data))
            .catch(() => console.warn('Launcher not running. Start it with: node launcher.js'));
    });
}

// Assign the powers to your specific artifacts:
inlineSVG('ka-button', 'powershell');
inlineSVG('thoth-button', 'code');
inlineSVG('duamutef-button', 'recycle-bin');
inlineSVG('seshat-button', 'notepad').then(startSeshatClock);

// ─── Seshat Control Panel ────────────────────────────────────────────────────
document.getElementById('seshat-panel-button').addEventListener('click', () => {
    window.open('SeshatControlPanel.html', 'SeshatControlPanel',
        'width=1100,height=740,left=120,top=60');
});

// ─── Seshat Chronometer ───────────────────────────────────────────────────────
// 59 palm-rib bud IDs ordered bud-1 (base = midnight) → bud-58 (top = midnight).
// bud-41 has two overlapping paths; both are included.
// CSS classes .seshat-bud-on / .seshat-bud-dim / @keyframes seshat-ripple
// are defined in SeshatAnimation.svg's embedded <style> block.
const SESHAT_BUDS = [
  // bud-1 (base/midnight) → bud-58 (top/midnight) — bottom to top
  'path71',
  'ellipse71', 'ellipse72', 'ellipse73', 'ellipse74', 'ellipse75',
  'ellipse76', 'ellipse77', 'ellipse78', 'ellipse79', 'ellipse80',
  'ellipse81', 'ellipse82', 'ellipse83', 'ellipse84', 'ellipse85',
  'ellipse86', 'ellipse88', 'ellipse87', 'ellipse89', 'ellipse90',
  'ellipse91', 'ellipse92', 'ellipse93', 'ellipse129','ellipse94',
  'ellipse95', 'ellipse96', 'ellipse97', 'ellipse98', 'ellipse99',
  'ellipse100','ellipse101','ellipse102','ellipse103','ellipse104',
  'ellipse105','ellipse106','ellipse107','ellipse108','ellipse109',
  'ellipse110','ellipse111','ellipse112','ellipse113','ellipse114',
  'ellipse115','ellipse116','ellipse117','ellipse118','ellipse119',
  'ellipse120','ellipse121','ellipse122','ellipse123','ellipse124',
  'ellipse125','ellipse126','ellipse127',
];

let _seshatRippleLock = false;

function seshatClockTick() {
  const now      = new Date();
  const mins     = now.getHours() * 60 + now.getMinutes();
  const isQtr    = now.getMinutes() % 15 === 0;
  const pastHalf = now.getMinutes() >= 30;
  const n        = SESHAT_BUDS.length - 1;   // 58 steps across 59 entries

  // Which bud index corresponds to the current time (0 = midnight base)
  const mainIdx = Math.round(mins / 1440 * n);

  // Bud halfway between this hour and the next (shown dim after :30)
  const halfMins = now.getHours() * 60 + 30;
  const halfIdx  = Math.round(halfMins / 1440 * n);

  // Clear all persistent clock classes
  SESHAT_BUDS.forEach(id => {
    const el = document.getElementById(id);
    if (!el) return;
    el.classList.remove('seshat-bud-on', 'seshat-bud-dim');
  });

  // Light the current-time bud — bright cyber cyan
  const mainEl = document.getElementById(SESHAT_BUDS[mainIdx]);
  if (mainEl) mainEl.classList.add('seshat-bud-on');

  // Light the half-hour intermediate bud — dim cyan (only after :30)
  if (pastHalf && halfIdx !== mainIdx) {
    const halfEl = document.getElementById(SESHAT_BUDS[halfIdx]);
    if (halfEl) halfEl.classList.add('seshat-bud-dim');
  }

  // Quarter-hour column ripple — each bud fires in sequence bottom → top
  if (isQtr && !_seshatRippleLock) {
    _seshatRippleLock = true;
    SESHAT_BUDS.forEach((id, i) => {
      const el = document.getElementById(id);
      if (el) el.style.animation = `seshat-ripple 0.8s ${(i * 0.025).toFixed(3)}s ease-out forwards`;
    });
    // Clear ripple after the full wave completes (59 × 0.025s + 0.8s ≈ 2.3s)
    setTimeout(() => {
      SESHAT_BUDS.forEach(id => {
        const el = document.getElementById(id);
        if (el) el.style.animation = '';
      });
    }, 2600);
  } else if (!isQtr) {
    _seshatRippleLock = false;
  }
}

function startSeshatClock() {
  seshatClockTick();                    // fire immediately on load
  setInterval(seshatClockTick, 60_000); // then update every minute
}