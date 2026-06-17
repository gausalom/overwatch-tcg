function showPreview(cardId, faceUp, status, guest) {
  const previewDiv = document.querySelector(".preview")
  // Limpiar contenido anterior
  previewDiv.innerHTML = ""

  const img = document.createElement("img")
  if ((faceUp && status==1) || guest){
    img.src = `/static/img/card_images/${cardId}.webp`  // ruta a la imagen
  }else{
    img.src = `/static/img/card_images/back.webp`  // ruta a la imagen
  }

  previewDiv.appendChild(img)
}

function clearPreview() {
  const previewDiv = document.querySelector(".preview")
  previewDiv.innerHTML = "La Taberna"
}
