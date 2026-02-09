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
