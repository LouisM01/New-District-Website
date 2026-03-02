/* ============================================================
   NEW DISTRICT — DISTRICT MAP JS (clean rebuild)
   Replace your entire script.js with this,
   OR paste this block at the bottom replacing the old map code.
   The modal block at top is preserved from your original.
   ============================================================ */

// ── Modal (unchanged from your original, just cleaned) ──────
const modal      = document.getElementById("district-modal");
const modalTitle = document.getElementById("modal-title");
const modalBody  = document.querySelector(".modal-body");

const LOCKED_MSG = "New District Productions exists to return power to the artist. This district is not yet open — check back soon.";

function openModal(name, desc) {
  if (!modal || !modalTitle || !modalBody) return;
  modalTitle.textContent = `No Entry — ${name}`;
  modalBody.textContent  = desc || LOCKED_MSG;
  modal.classList.add("show");
  modal.setAttribute("aria-hidden", "false");
}

function closeModal() {
  if (!modal) return;
  modal.classList.remove("show");
  modal.setAttribute("aria-hidden", "true");
}

modal?.addEventListener("click", (e) => {
  if (e.target.dataset.close) closeModal();
});

document.addEventListener("keydown", (e) => {
  if (e.key === "Escape") closeModal();
});


// ── District Map ─────────────────────────────────────────────
(() => {
  const shell    = document.getElementById("ndpMapShell");
  const detail   = document.getElementById("ndpDetail");
  if (!shell) return;

  // ── State buttons ──────────────────────────────────────────
  const stateBtns = document.querySelectorAll("[data-ndp-state]");

  function setState(n) {
    shell.dataset.state = String(n);

    stateBtns.forEach((b) => {
      const active = Number(b.dataset.ndpState) === n;
      b.classList.toggle("is-active", active);
    });
  }

  stateBtns.forEach((b) => {
    b.addEventListener("click", () => setState(Number(b.dataset.ndpState)));
  });

  // Default
  setState(1);


  // ── Hover: update footer detail strip ─────────────────────
  shell.addEventListener("mouseover", (e) => {
    const pin = e.target.closest(".ndp-district");
    if (!pin || !detail) return;

    const name = pin.dataset.ndpName || "District";
    const desc = pin.dataset.ndpDesc || "Coming soon.";

    detail.innerHTML = `
      <span class="ndp-detail-name">${name}</span>
      <span class="ndp-detail-desc">${desc}</span>
    `;
  });

  shell.addEventListener("mouseleave", () => {
    if (!detail) return;
    detail.innerHTML = `
      <span class="ndp-detail-name">District Details</span>
      <span class="ndp-detail-desc">Hover a pin to preview</span>
    `;
  });


  // ── Click: locked → modal | open → follow link ────────────
  shell.addEventListener("click", (e) => {
    const locked = e.target.closest(".ndp-district.locked");
    if (!locked) return;

    e.preventDefault();
    openModal(
      locked.dataset.ndpName || "Restricted",
      locked.dataset.ndpDesc || LOCKED_MSG
    );
  });


  // ── Subtle parallax: glow tracks mouse ────────────────────
  const art = shell.querySelector(".ndp-map-art");

  shell.addEventListener("mousemove", (e) => {
    if (!art) return;
    const r  = shell.getBoundingClientRect();
    const xp = ((e.clientX - r.left) / r.width  * 100).toFixed(1);
    const yp = ((e.clientY - r.top)  / r.height * 100).toFixed(1);
    // Shift the radial glow origin slightly toward cursor
    art.style.backgroundPosition = `${xp}% ${yp}%`;
  });

  shell.addEventListener("mouseleave", () => {
    if (art) art.style.backgroundPosition = "50% 52%";
  });

})();
// ── City lights scatter ──────────────────────────────────────
(() => {
  const shell = document.getElementById("ndpMapShell");
  if (!shell) return;

  const canvas = document.createElement("canvas");
  canvas.setAttribute("aria-hidden", "true");
  canvas.style.cssText = `
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
    z-index: 2;
    pointer-events: none;
    mix-blend-mode: screen;
  `;
  shell.appendChild(canvas);

  function drawLights() {
    const W = shell.offsetWidth;
    const H = shell.offsetHeight;
    canvas.width  = W;
    canvas.height = H;
    const ctx = canvas.getContext("2d");
    ctx.clearRect(0, 0, W, H);

    const cx = W * 0.50;
    const cy = H * 0.52;
    const count = 520;

    for (let i = 0; i < count; i++) {
      // Distribute — denser near centre, sparser outward
      const angle  = Math.random() * Math.PI * 2;
      const dist   = Math.pow(Math.random(), 0.55) * Math.max(W, H) * 0.52;
      const x      = cx + Math.cos(angle) * dist;
      const y      = cy + Math.sin(angle) * dist * 0.72; // flatten vertically

      // Skip river band
      const riverY = H * 0.60 + (x / W) * H * -0.15;
      if (y > riverY - 14 && y < riverY + 14) continue;

      // Size + brightness fall off with distance
      const falloff   = 1 - (dist / (Math.max(W, H) * 0.52));
      const size      = Math.random() * 1.8 * falloff + 0.3;
      const alpha     = Math.random() * 0.7 * falloff + 0.08;

      // Colour: warm amber → orange → occasional white-hot
      const roll = Math.random();
      let colour;
      if (roll > 0.96)      colour = `rgba(255,245,200,${alpha})`; // white-hot
      else if (roll > 0.75) colour = `rgba(255,200,80,${alpha})`;  // amber
      else if (roll > 0.45) colour = `rgba(220,140,40,${alpha})`;  // orange-amber
      else                  colour = `rgba(180,100,20,${alpha})`;  // deep orange

      // Draw dot with soft glow
      const grd = ctx.createRadialGradient(x, y, 0, x, y, size * 3.5);
      grd.addColorStop(0,   colour);
      grd.addColorStop(0.4, colour.replace(/[\d.]+\)$/, `${alpha * 0.4})`));
      grd.addColorStop(1,   "rgba(0,0,0,0)");

      ctx.beginPath();
      ctx.arc(x, y, size * 3.5, 0, Math.PI * 2);
      ctx.fillStyle = grd;
      ctx.fill();
    }
  }

  drawLights();
  window.addEventListener("resize", drawLights);
})();