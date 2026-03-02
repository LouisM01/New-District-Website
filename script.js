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
    const cy = H * 0.50;

    // River mask helper
    const inRiver = (x, y) => {
      const riverY = H * 0.625 - (x / W) * H * 0.14;
      return y > riverY - 18 && y < riverY + 18;
    };

    // ── Pass 1: tiny crisp street-level lights (main body) ───
    for (let i = 0; i < 1100; i++) {
      const angle = Math.random() * Math.PI * 2;
      const dist  = Math.pow(Math.random(), 0.48) * Math.max(W, H) * 0.52;
      const x     = cx + Math.cos(angle) * dist;
      const y     = cy + Math.sin(angle) * dist * 0.65;

      if (x < 0 || x > W || y < 0 || y > H) continue;
      if (inRiver(x, y)) continue;

      const falloff = Math.max(0, 1 - dist / (Math.max(W, H) * 0.52));
      const alpha   = Math.random() * 0.5 * falloff + 0.06;

      // Tiny — max 1.2px radius, most much smaller
      const size = Math.random() * 1.2 * falloff + 0.15;

      const roll = Math.random();
      let r, g, b;
      if      (roll > 0.95) { r=255; g=245; b=200; }
      else if (roll > 0.75) { r=255; g=200; b=75;  }
      else if (roll > 0.48) { r=220; g=145; b=40;  }
      else if (roll > 0.22) { r=185; g=100; b=18;  }
      else                  { r=140; g=70;  b=8;   }

      // Very tight glow — barely 2x the dot size
      const grd = ctx.createRadialGradient(x, y, 0, x, y, size * 2.2);
      grd.addColorStop(0,   `rgba(${r},${g},${b},${alpha})`);
      grd.addColorStop(0.5, `rgba(${r},${g},${b},${alpha * 0.3})`);
      grd.addColorStop(1,   `rgba(0,0,0,0)`);

      ctx.beginPath();
      ctx.arc(x, y, size * 2.2, 0, Math.PI * 2);
      ctx.fillStyle = grd;
      ctx.fill();
    }

    // ── Pass 2: bare pinpricks — no glow at all ──────────────
    for (let i = 0; i < 350; i++) {
      const angle = Math.random() * Math.PI * 2;
      const dist  = Math.pow(Math.random(), 0.42) * Math.max(W, H) * 0.50;
      const x     = cx + Math.cos(angle) * dist;
      const y     = cy + Math.sin(angle) * dist * 0.68;

      if (x < 0 || x > W || y < 0 || y > H) continue;
      if (inRiver(x, y)) continue;

      const falloff = Math.max(0, 1 - dist / (Math.max(W, H) * 0.50));
      const alpha   = Math.random() * 0.65 * falloff + 0.08;

      ctx.beginPath();
      ctx.arc(x, y, 0.7, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(255,215,100,${alpha})`;
      ctx.fill();
    }

    // ── Pass 3: street-grid aligned clusters ─────────────────
    // Small groups of 2-4 dots mimicking block lighting
    for (let i = 0; i < 60; i++) {
      const angle = Math.random() * Math.PI * 2;
      const dist  = Math.pow(Math.random(), 0.6) * Math.max(W, H) * 0.38;
      const bx    = cx + Math.cos(angle) * dist;
      const by    = cy + Math.sin(angle) * dist * 0.62;

      if (inRiver(bx, by)) continue;

      const clusterSize = Math.floor(Math.random() * 3) + 2;
      for (let j = 0; j < clusterSize; j++) {
        const ox = bx + (Math.random() - 0.5) * 18;
        const oy = by + (Math.random() - 0.5) * 10;
        if (inRiver(ox, oy)) continue;

        const falloff = Math.max(0, 1 - dist / (Math.max(W, H) * 0.38));
        const alpha   = Math.random() * 0.55 * falloff + 0.12;

        ctx.beginPath();
        ctx.arc(ox, oy, 0.9, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255,200,80,${alpha})`;
        ctx.fill();
      }
    }
  }

  drawLights();
  window.addEventListener("resize", drawLights);
})();