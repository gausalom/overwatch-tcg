
let inkChart = null;
let deck = {};

document.addEventListener("DOMContentLoaded", () => {
    const costCounts = {};

    const deck_cards_tmp = document.getElementById("deck_cards").value;
    const deck_cards = JSON.parse(deck_cards_tmp);

    // Recorre cada carta del deck
    Object.values(deck_cards).forEach(entry => {
        let cost = entry.cost || 0;
        if (!costCounts[cost]) costCounts[cost] = 0;

        costCounts[cost] += entry.qty;  // sumamos unidades
    });

    // Determinar el coste mínimo y máximo
    const costs = Object.keys(costCounts).map(Number);
    const minCost = Math.min(...costs, 0); // por si no hay cartas, que arranque en 0
    const maxCost = Math.max(...costs, 0);

    const labels = [];
    const values = [];
    for (let i = minCost+1; i <= maxCost; i++) {
        labels.push(i);
        values.push(costCounts[i] || 0); // si no hay cartas de ese coste, ponemos 0
    }


    const ctx = document.getElementById("inkCurveChart").getContext("2d");

    // Si ya existe la gráfica, la destruimos antes de regenerarla
    if (inkChart) inkChart.destroy();

    inkChart = new Chart(ctx, {
        type: "bar",
        data: {
            labels: labels,
            datasets: [{
                label: "Número de Cartas",
                data: values,
                borderWidth: 2
            }]
        },
        options: {
            responsive: true,
            plugins: {
                legend: { display: false }
            },
            scales: {
                x: {
                    title: {
                        display: false,
                        text: "Coste de tinta"
                    }
                },
                y: {
                    title: {
                        display: false,
                        text: "Cantidad"
                    },
                    beginAtZero: true,
                    ticks: {
                        precision: 0
                    }
                }
            }
        }
    });
});