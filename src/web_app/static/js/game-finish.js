const finishButton = document.getElementById("finish");
const overlay = document.getElementById("confirm-overlay");
const confirmYes = document.getElementById("confirm-yes");
const confirmNo = document.getElementById("confirm-no");

if (finishButton) {
  finishButton.onclick = () => {
    overlay.classList.remove("hidden");
  };
}

confirmNo.onclick = () => {
  overlay.classList.add("hidden");
};

confirmYes.onclick = () => {
  overlay.classList.add("hidden");
  sendAction("FINISH_GAME", {});
};
