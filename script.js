const modal = document.getElementById("district-modal");

const LOCKED_MESSAGE =
  "New District Productions exists to return power to the artist. Coming soon.";

const openModal = (name, message) => {
  if (!modal || !modalBody || !modalTitle) return;
  modalTitle.textContent = `No Entry — ${name}`;
  modalBody.textContent = message;
  modal.classList.add("show");
  modal.setAttribute("aria-hidden", "false");
};

const closeModal = () => {
  if (!modal) return;
  modal.classList.remove("show");
  modal.setAttribute("aria-hidden", "true");
};

document.querySelectorAll(".district.locked").forEach((button) => {
  button.addEventListener("click", () => {
    const name = button.dataset.name || "Restricted";
    openModal(name, LOCKED_MESSAGE);
  });
});

modal?.addEventListener("click", (event) => {
  const target = event.target;
  if (target instanceof HTMLElement && target.dataset.close) {
    closeModal();
  }
});

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape") {
    closeModal();
  }
});
// === Map “camera” parallax ===
(() => {
  const map = document.getElementById("map");
  if (!map) return;

  const setVars = (x, y) => {
    map.style.setProperty("--mx", `${x}%`);
    map.style.setProperty("--my", `${y}%`);
  };

  // default center
  setVars(50, 50);

  map.addEventListener("mousemove", (e) => {
    const r = map.getBoundingClientRect();
    const x = ((e.clientX - r.left) / r.width) * 100;
    const y = ((e.clientY - r.top) / r.height) * 100;
    setVars(x.toFixed(2), y.toFixed(2));
  });

  map.addEventListener("mouseleave", () => setVars(50, 50));
})();
(() => {
  const mapRoot = document.getElementById("ndpMap");
  if (!mapRoot) return;

  const detail = document.getElementById("mapDetail");
  const buttons = mapRoot.querySelectorAll(".map-btn");
  const art = mapRoot.querySelector(".map-art");

  // Optional: reuse your existing modal if present
  const ndpModal = document.getElementById("district-modal");
  const ndpModalTitle = ndpModal?.querySelector("#modal-title");
  const ndpModalBody = ndpModal?.querySelector(".modal-body");

  const setState = (n) => {
    mapRoot.dataset.state = String(n);
    // “city lights flicking on” feel: n=2 boosts glow slightly
    if (art) {
      art.style.filter =
        n === 2 ? "contrast(1.15) brightness(1.02)" :
        n === 3 ? "contrast(1.18) brightness(1.00)" :
        "contrast(1.10) brightness(.95)";
    }
  };

  buttons.forEach((b) => {
    b.addEventListener("click", () => setState(Number(b.dataset.state)));
  });

  // Hover details
  mapRoot.addEventListener("mouseover", (e) => {
    const el = e.target.closest(".district-marker");
    if (!el || !detail) return;

    const name = el.dataset.name || "District";
    const desc = el.dataset.desc || "Coming soon.";
    detail.innerHTML = `<span class="map-detail-title">${name}</span><span class="map-detail-sub">${desc}</span>`;
  });

  // Locked click -> modal
  mapRoot.addEventListener("click", (e) => {
    const locked = e.target.closest(".district-marker.locked");
    if (!locked) return;

    if (ndpModal) {
      ndpModalTitle && (ndpModalTitle.textContent = locked.dataset.name || "No Entry");
      ndpModalBody && (ndpModalBody.textContent = locked.dataset.desc || "Coming soon.");
      ndpModal.setAttribute("aria-hidden", "false");
      ndpModal.classList.add("open");
    }
  });

  // Default
  setState(1);
})();
