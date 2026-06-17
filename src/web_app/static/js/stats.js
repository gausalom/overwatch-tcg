

const statsData = JSON.parse(
    document.getElementById("rounds-data").innerText
);


document.addEventListener("DOMContentLoaded", () => {
    const tournamentFiltersDiv = document.getElementById("tournament-filters");
    const playerFiltersDiv = document.getElementById("player-filters");
    const versionFiltersDiv = document.getElementById("version-filters");

    const generalStatsDiv = document.getElementById("general-stats");
    const inkStatsDiv = document.getElementById("ink-stats");

    // Obtener torneos únicos
    const tournaments = [...new Set(statsData.map(r => r.tournament_name))];
    const players = [...new Set(statsData.map(r => r.player_name))];

    // Obtener versiones únicas
    const versions = [...new Set(statsData.map(r => r.version))].sort((a,b) => a - b);

    // -------------------------------
    //   Renderizar filtros
    // -------------------------------
    players.forEach(t => {
        playerFiltersDiv.innerHTML += `
          <label>
            <input type="checkbox" class="filter-player" value="${t}" checked>
            ${t}
          </label>
        `;
    });

    tournaments.forEach(t => {
        tournamentFiltersDiv.innerHTML += `
          <label>
            <input type="checkbox" class="filter-tournament" value="${t}" checked>
            ${t}
          </label>
        `;
    });

    versions.forEach(v => {
        versionFiltersDiv.innerHTML += `
          <label>
            <input type="checkbox" class="filter-version" value="${v}" checked>
            Versión ${v}
          </label>
        `;
    });

    // =============================
    //   EVENTOS DE FILTROS
    // =============================
    document.querySelectorAll(".filter-tournament, .filter-version, .filter-player").forEach(cb => {
        cb.addEventListener("change", updateStats);
    });

    // =============================
    //   FUNCIÓN PRINCIPAL
    // =============================
    function updateStats() {

        // --- obtener filtros ---
        const activeTournaments = [...document.querySelectorAll(".filter-tournament:checked")].map(c => c.value);
        const activePlayers = [...document.querySelectorAll(".filter-player:checked")].map(c => c.value);
        const activeVersions = [...document.querySelectorAll(".filter-version:checked")].map(c => Number(c.value));

        // --- Filtrar registros ---
        const filtered = statsData.filter(r =>
            activeTournaments.includes(r.tournament_name) &&
            activePlayers.includes(r.player_name) &&
            activeVersions.includes(r.version)
        );

        // ===============================
        //      RESUMEN GENERAL
        // ===============================
        const totalRounds = filtered.length;
        let wins = 0;
        let diceWins = 0;
        let otpCount = 0;
        let games_won = 0;
        let games_loose = 0;

        filtered.forEach(r => {
            const roundWins =
  (r.win_first_game === 1 ? 1 : r.win_first_game === 0 ? -1 : 0) +
  (r.win_second_game === 1 ? 1 : r.win_second_game === 0 ? -1 : 0) +
  (r.win_third_game === 1 ? 1 : r.win_third_game === 0 ? -1 : 0);

            if (roundWins >= 1) wins++;
            if (r.has_won_dice) diceWins++;
            if (r.is_otp) otpCount++;

            if (r.win_first_game==1) games_won++;
            if (r.win_first_game==0) games_loose++;

            if (r.win_second_game==1) games_won++;
            if (r.win_second_game==0) games_loose++;

            if (r.win_third_game==1) games_won++;
            if (r.win_third_game==0) games_loose++;
        });

        const winRate = totalRounds ? ((wins / totalRounds) * 100).toFixed(1) : 0;
        const winRateGames = (games_won+games_loose) ? ((games_won / (games_won+games_loose)) * 100).toFixed(1) : 0;
        const diceRate = totalRounds ? ((diceWins / totalRounds) * 100).toFixed(1) : 0;
        const otpRate = totalRounds ? ((otpCount / totalRounds) * 100).toFixed(1) : 0;

        generalStatsDiv.innerHTML = `
            <div class="summary-card">
                <h4>Rondas jugadas</h4>
                <p>${totalRounds}</p>
            </div>
            <div class="summary-card">
                <h4>Rondas ganadas</h4>
                <p>${wins} (${winRate}%)</p>
            </div>
            <div class="summary-card">
                <h4>Dados ganados</h4>
                <p>${diceWins} (${diceRate}%)</p>
            </div>
            <div class="summary-card">
                <h4>Partidas Ganadas</h4>
                <p>${games_won} (${winRateGames}%)</p>
            </div>
            <div class="summary-card">
                <h4>Partidas Perdidas</h4>
                <p>${games_loose}</p>
            </div>
        `;

        // ===============================
        //      ESTADÍSTICAS DE TINTAS
        // ===============================
        const inkMap = {};

        filtered.forEach(r => {

            const inks = [r.first_ink, r.second_ink].sort();
            const key = `${inks[0]} - ${inks[1]}`;

            if (!inkMap[key]) {
                inkMap[key] = {
                    // Estadísticas de ronda
                    wins: 0,
                    total: 0,
                    otp: 0,
                    otd: 0,
                    win_otp: 0,
                    win_otd: 0,

                    // Estadísticas de partida
                    gameWins: 0,
                    gameTotal: 0,

                    gameOtp: 0,
                    gameOtpWins: 0,

                    gameOtd: 0,
                    gameOtdWins: 0
                };
            }

            // ==========================
            // ESTADÍSTICAS DE RONDA
            // ==========================

            inkMap[key].total++;

            const roundWins =
                (r.win_first_game === 1 ? 1 : r.win_first_game === 0 ? -1 : 0) +
                (r.win_second_game === 1 ? 1 : r.win_second_game === 0 ? -1 : 0) +
                (r.win_third_game === 1 ? 1 : r.win_third_game === 0 ? -1 : 0);

            if (roundWins >= 1)
                inkMap[key].wins++;

            if (r.is_otp)
                inkMap[key].otp++;
            else
                inkMap[key].otd++;

            if (r.is_otp && roundWins >= 1)
                inkMap[key].win_otp++;
            else if (roundWins >= 1)
                inkMap[key].win_otd++;

            // ==========================
            // ESTADÍSTICAS DE PARTIDA
            // ==========================

            let currentOtp = r.is_otp;

            [
                r.win_first_game,
                r.win_second_game,
                r.win_third_game
            ].forEach(result => {

                if (result !== 0 && result !== 1)
                    return;

                inkMap[key].gameTotal++;

                if (result === 1)
                    inkMap[key].gameWins++;

                if (currentOtp) {

                    inkMap[key].gameOtp++;

                    if (result === 1)
                        inkMap[key].gameOtpWins++;

                } else {

                    inkMap[key].gameOtd++;

                    if (result === 1)
                        inkMap[key].gameOtdWins++;
                }

                // Si ganas cambias OTP/OTD.
                // Si pierdes mantienes condición.
                if ((result === 0 && currentOtp===0) || (result===1 && currentOtp==1))
                    currentOtp = !currentOtp;
            });
        });

        // Renderizar tarjetas
        inkStatsDiv.innerHTML = "";

        const colores = {
          "1": "🟡",
          "2": "🟣",
          "3": "🟢",
          "4": "🔴",
          "5": "🔵",
          "6": "⚪"
        };



        Object.entries(inkMap).forEach(([ink, data]) => {

            const wr = ((data.wins / data.total) * 100).toFixed(1);

            var wr_otp = data.otp
                ? ((data.win_otp / data.otp) * 100).toFixed(1)
                : "N/A";

            var wr_otd = data.otd
                ? ((data.win_otd / data.otd) * 100).toFixed(1)
                : "N/A";

            const gameWr = data.gameTotal
                ? ((data.gameWins / data.gameTotal) * 100).toFixed(1)
                : "N/A";

            const gameOtpWr = data.gameOtp
                ? ((data.gameOtpWins / data.gameOtp) * 100).toFixed(1)
                : "N/A";

            const gameOtdWr = data.gameOtd
                ? ((data.gameOtdWins / data.gameOtd) * 100).toFixed(1)
                : "N/A";

            ink = ink.replace(/\b[1-6]\b/g, match => colores[match]);
            ink = ink.replace("-", "");

            inkStatsDiv.innerHTML += `
                <div class="ink-card">
                    <h4>${ink}</h4>

                    <p><strong>RONDAS</strong></p><br>
                    <p>${data.total} Total</p>
                    <p><strong>${data.wins}</strong> W / ${data.total - data.wins} L</p>
                    <p><strong>${wr}%</strong> Winrate</p>

                    <p>OTP: <strong>${data.otp}</strong> (${wr_otp}%)</p>
                    <p>OTD: <strong>${data.otd}</strong> (${wr_otd}%)</p>

                    <hr class="hr-data-decks">

                    <p><strong>PARTIDAS</strong></p><br>

                    <p>
                        ${data.gameTotal} Total
                    </p>
                    <p>
                        <strong>${data.gameWins}</strong> W /
                        ${data.gameTotal - data.gameWins} L
                    </p>

                    <p>
                        <strong>${gameWr}%</strong> Winrate
                    </p>

                    <p>
                        OTP: <strong>${data.gameOtp}</strong>
                        (${gameOtpWr}%)
                    </p>

                    <p>
                        OTD: <strong>${data.gameOtd}</strong>
                        (${gameOtdWr}%)
                    </p>
                </div>
            `;
        });
    }

    // Ejecutar al cargar
    updateStats();
});

