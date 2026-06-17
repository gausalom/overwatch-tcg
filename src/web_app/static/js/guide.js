
const agregarBtn = document.getElementById('agregar');
const contenedor = document.getElementById('conjuntos');

agregarBtn.addEventListener('click', () => {
    const nuevo = document.createElement('div');
    nuevo.innerHTML = `
        <div class="conjunto">
            <div class="fila">
                <select name="first_ink[]" required>
                    <option value="1">Ámbar - Amarillo 🟡</option>
                    <option value="2">Amatista - Lila 🟣</option>
                    <option value="3">Esmeralda - Verde 🟢</option>
                    <option value="4">Rubí - Rojo 🔴</option>
                    <option value="5">Zafiro - Azul 🔵</option>
                    <option value="6">Acero - Gris ⚪</option>
                </select>
                <select name="second_ink[]" required>
                    <option value="1">Ámbar - Amarillo 🟡</option>
                    <option value="2">Amatista - Lila 🟣</option>
                    <option value="3">Esmeralda - Verde 🟢</option>
                    <option value="4">Rubí - Rojo 🔴</option>
                    <option value="5">Zafiro - Azul 🔵</option>
                    <option value="6">Acero - Gris ⚪</option>
                </select>
                <button type="button" class="eliminar">Eliminar Matchup</button>
            </div>
            <input type="text" name="deck_name[]" value="" required>
            <textarea name="content[]" rows="15"></textarea>
        </div>
    `;
    contenedor.appendChild(nuevo);

    nuevo.querySelector('.eliminar').addEventListener('click', () => {
        nuevo.remove();
    });
});

// Delegación para eliminar existentes
document.querySelectorAll('.conjunto .eliminar').forEach(btn => {
    btn.addEventListener('click', e => e.target.closest('.conjunto').remove());
});
