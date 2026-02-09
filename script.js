const modal = document.getElementById("district-modal");
const modalBody = modal?.querySelector(".modal-body");
const modalTitle = modal?.querySelector("#modal-title");

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
