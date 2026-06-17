
document.getElementById("download-btn").addEventListener("click", async function () {
  const element = document.querySelector(".deck-view");

  if (!element) return;

  // 👉 Selectores a ocultar
  const hiddenSelectors = "button, select, input, textarea";

  const hiddenElements = element.querySelectorAll(hiddenSelectors);

  // Ocultar
  hiddenElements.forEach(el => {
    el.dataset.oldDisplay = el.style.display;
    el.style.display = "none";
  });

  const toSeeElements = element.querySelectorAll(".logo-photo");
  // Mostrar
  toSeeElements.forEach(el => {
    el.dataset.oldDisplay = el.style.display;
    el.style.display = "block";
  });

  // Capturar
  const canvas = await html2canvas(element, {
    scale: 2,
    backgroundColor: "#05070a",
    useCORS: true
  });

  // Restaurar
  hiddenElements.forEach(el => {
    el.style.display = el.dataset.oldDisplay || "";
    delete el.dataset.oldDisplay;
  });

  // Restaurar
  toSeeElements.forEach(el => {
    el.style.display = el.dataset.oldDisplay || "";
    delete el.dataset.oldDisplay;
  });

  // Descargar
  const link = document.createElement("a");
  link.download = "deck-view.png";
  link.href = canvas.toDataURL("image/png");
  link.click();
});
