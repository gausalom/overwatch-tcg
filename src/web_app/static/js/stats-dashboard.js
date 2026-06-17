const statsData = JSON.parse(
    document.getElementById("rounds-data").innerText
);

document.addEventListener("DOMContentLoaded", () => {
    setupSetFilter();
    updateStats();
});

function setupSetFilter() {
    const setFilterDiv = document.getElementById("set-filter");

    const sets = [...new Set(statsData.map(r => r.set_deck))];

    sets.forEach(v => {
        setFilterDiv.innerHTML += `
            <label>
                <input type="checkbox" class="filter-set" value="${v}" checked>
                Set ${v}
            </label>
        `;
    });

    document.querySelectorAll(".filter-set").forEach(cb => {
        cb.addEventListener("change", updateStats);
    });
}

function updateStats() {
    const activeSets = [...document.querySelectorAll(".filter-set:checked")]
        .map(c => Number(c.value));

    const filteredData = statsData.filter(r => activeSets.includes(r.set_deck));

    renderStats("general-stats", "ink-stats", filteredData);
}

function renderStats(generalId, inkId, data) {
    const generalStatsDiv = document.getElementById(generalId);
    const inkStatsDiv = document.getElementById(inkId);

    const totalRounds = data.length;
    let wins = 0;
    let draws = 0;
    let looses = 0;
    let diceWins = 0;
    let games_won = 0;
    let games_loose = 0;

    let wins_2_0 = 0;
    let losses_0_2 = 0;

    let uniqueDecks = new Set();

    let game3Played = 0;
    let game3Wins = 0;

    data.forEach(r => {
        const roundWins =
            (r.win_first_game === 1 ? 1 : r.win_first_game === 0 ? -1 : 0) +
            (r.win_second_game === 1 ? 1 : r.win_second_game === 0 ? -1 : 0) +
            (r.win_third_game === 1 ? 1 : r.win_third_game === 0 ? -1 : 0);

        if (roundWins >= 1) wins++;
        if (roundWins==0) draws++;
        if (roundWins <= -1) looses++;
        if (r.has_won_dice) diceWins++;

        if (r.win_first_game == 1) games_won++;
        if (r.win_first_game == 0) games_loose++;

        if (r.win_second_game == 1) games_won++;
        if (r.win_second_game == 0) games_loose++;

        if (r.win_third_game == 1) games_won++;
        if (r.win_third_game == 0) games_loose++;

        uniqueDecks.add(r.deck_name);

        if (r.win_third_game !== null && r.win_third_game !== undefined) {
            game3Played++;
            if (r.win_third_game === 1) game3Wins++;
        }

        let gamesWonInRound = 0;
        let gamesLostInRound = 0;

        if (r.win_first_game === 1) gamesWonInRound++;
        if (r.win_second_game === 1) gamesWonInRound++;
        if (r.win_third_game === 1) gamesWonInRound++;

        if (r.win_first_game === 0) gamesLostInRound++;
        if (r.win_second_game === 0) gamesLostInRound++;
        if (r.win_third_game === 0) gamesLostInRound++;

        if (gamesWonInRound === 2 && gamesLostInRound === 0) wins_2_0++;
        if (gamesLostInRound === 2 && gamesWonInRound === 0) losses_0_2++;
    });

    const winRate = totalRounds ? ((wins / totalRounds) * 100).toFixed(1) : 0;
    const drawRate = totalRounds ? ((draws / totalRounds) * 100).toFixed(1) : 0;
    const looseRate = totalRounds ? ((looses / totalRounds) * 100).toFixed(1) : 0;
    const diceRate = totalRounds ? ((diceWins / totalRounds) * 100).toFixed(1) : 0;
    const gameWR = (games_won + games_loose) ? ((games_won * 100) / (games_won + games_loose)).toFixed(1) : 0;
    const looseWR = (games_won + games_loose) ? ((games_loose * 100) / (games_won + games_loose)).toFixed(1) : 0;

    generalStatsDiv.innerHTML = `
        <div class="summary-card"><h4>Rondas jugadas</h4><p>${totalRounds}</p></div>
        <div class="summary-card"><h4>Rondas ganadas</h4><p>${wins} (${winRate}%)</p></div>
        <div class="summary-card"><h4>Rondas empatadas</h4><p>${draws} (${drawRate}%)</p></div>
        <div class="summary-card"><h4>Rondas perdidas</h4><p>${looses} (${looseRate}%)</p></div>
        <div class="summary-card"><h4>Dados ganados</h4><p>${diceWins} (${diceRate}%)</p></div>
        <div class="summary-card"><h4>Partidas Ganadas</h4><p>${games_won} (${gameWR}%)</p></div>
        <div class="summary-card"><h4>Partidas Perdidas</h4><p>${games_loose} (${looseWR}%)</p></div>
        <div class="summary-card"><h4>Clutch (Game 3)</h4><p>${game3Played ? ((game3Wins / game3Played) * 100).toFixed(1) : "N/A"}%</p></div>
        <div class="summary-card"><h4>Victorias 2-0</h4><p>${wins ? ((wins_2_0 / wins) * 100).toFixed(1) : 0}%</p></div>
        <div class="summary-card"><h4>Derrotas 0-2</h4><p>${(totalRounds - wins) ? ((losses_0_2 / (totalRounds - wins)) * 100).toFixed(1) : 0}%</p></div>
    `;

    const inkMap = {};

    data.forEach(r => {
        const inks = [r.first_ink, r.second_ink].sort();
        const key = `${inks[0]} - ${inks[1]}`;

        if (!inkMap[key]) {
            inkMap[key] = { wins: 0, total: 0, otp: 0, otd: 0, win_otp: 0, win_otd: 0 };
        }

        inkMap[key].total++;

        const roundWins =
            (r.win_first_game === 1 ? 1 : r.win_first_game === 0 ? -1 : 0) +
            (r.win_second_game === 1 ? 1 : r.win_second_game === 0 ? -1 : 0) +
            (r.win_third_game === 1 ? 1 : r.win_third_game === 0 ? -1 : 0);

        if (roundWins >= 1) inkMap[key].wins++;

        if (r.is_otp) inkMap[key].otp++;
        else inkMap[key].otd++;

        if (r.is_otp && roundWins >= 1) inkMap[key].win_otp++;
        else if (roundWins >= 1) inkMap[key].win_otd++;
    });

    const colores = { "1": "🟡", "2": "🟣", "3": "🟢", "4": "🔴", "5": "🔵", "6": "⚪" };

    inkStatsDiv.innerHTML = "";

    Object.entries(inkMap).forEach(([ink, d]) => {
        const wr = ((d.wins / d.total) * 100).toFixed(1);
        let wr_otp = d.otp ? ((d.win_otp / d.otp) * 100).toFixed(1) : "N/A";
        let wr_otd = d.otd ? ((d.win_otd / d.otd) * 100).toFixed(1) : "N/A";

        ink = ink.replace(/\b[1-6]\b/g, m => colores[m]).replace("-", "");

        inkStatsDiv.innerHTML += `
            <div class="ink-card">
                <h4>${ink}</h4>
                <p>${d.total} Total</p>
                <p><strong>${d.wins}</strong> W / ${d.total - d.wins} L</p>
                <p><strong>${wr}%</strong> Winrate</p>
                <hr class="hr-data-decks">
                <p>OTP: <strong>${d.otp}</strong> (${wr_otp}%)</p>
                <p>OTD: <strong>${d.otd}</strong> (${wr_otd}%)</p>
            </div>
        `;
    });
}
