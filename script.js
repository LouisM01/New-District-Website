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