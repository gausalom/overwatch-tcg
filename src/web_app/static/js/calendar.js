const calendarDays = document.getElementById("calendarDays");
const monthYear = document.getElementById("monthYear");
const eventsList = document.getElementById("eventsList");
const selectedDateEl = document.getElementById("selectedDate");
const userName = document.getElementById("user-name").textContent.trim();


const prevBtn = document.getElementById("prevMonth");
const nextBtn = document.getElementById("nextMonth");

let currentDate = new Date();

const monthNames = [
    "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
    "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"
];

/* =========================
   CARGA Y PROCESADO DE EVENTOS
   ========================= */

// EVENTS ahora es un ARRAY
const rawEvents = JSON.parse(
    document.getElementById("events-data").textContent
);

// Indexamos por día
const eventsByDay = {};

rawEvents.forEach(event => {
    if (!eventsByDay[event.day]) {
        eventsByDay[event.day] = [];
    }
    eventsByDay[event.day].push(event);
});

/* =========================
   CALENDARIO
   ========================= */

function renderCalendar() {
    calendarDays.innerHTML = "";

    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();

    monthYear.textContent = `${monthNames[month]} ${year}`;

    const firstDay = new Date(year, month, 1);
    const startDay = (firstDay.getDay() + 6) % 7; // lunes = 0

    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const daysPrevMonth = new Date(year, month, 0).getDate();

    // Días del mes anterior
    for (let i = startDay - 1; i >= 0; i--) {
        const day = document.createElement("div");
        day.className = "day other-month";
        day.textContent = daysPrevMonth - i;
        calendarDays.appendChild(day);
    }

    // Días del mes actual
    for (let d = 1; d <= daysInMonth; d++) {
        const day = document.createElement("div");
        day.className = "day";
        day.textContent = d;

        const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;

        // 🔴 Marcar días con eventos
        if (eventsByDay[dateStr]) {
            day.classList.add("has-events");
        }

        if (isToday(year, month, d)) {
            day.classList.add("today");
        }

        day.addEventListener("click", () => loadEvents(dateStr, day));
        calendarDays.appendChild(day);
    }
}

function isToday(year, month, day) {
    const today = new Date();
    return (
        today.getFullYear() === year &&
        today.getMonth() === month &&
        today.getDate() === day
    );
}

/* =========================
   EVENTOS DEL DÍA
   ========================= */

function loadEvents(date, dayElement) {
    selectedDateEl.textContent = date;
    eventsList.innerHTML = "";

    // Resaltar día seleccionado
    document.querySelectorAll(".day").forEach(d => d.classList.remove("selected"));
    if (dayElement) dayElement.classList.add("selected");

    const events = eventsByDay[date] || [];

    if (events.length === 0) {
        eventsList.innerHTML = "<li>No hay eventos</li>";
        return;
    }

    events.forEach(event => {
        const li = document.createElement("li");

        const playersArray = (event.players || "")
            .split(",")
            .map(p => p.trim())
            .filter(p => p.length > 0); // eliminamos strings vacíos


        let isUserInEvent = playersArray.includes(userName);

        const button = document.createElement("button");
        button.textContent = isUserInEvent ? "Desapuntarme" : "Apuntarme";
        button.className = isUserInEvent ? "btn-leave" : "btn-join";

        button.addEventListener("click", () => {
            const action = isUserInEvent ? "desapuntarme" : "apuntarme";

            // Usamos fetch pero sin esperar JSON
            fetch("/calendar-action", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    event_id: event.id_event,
                    action: action,
                    user: userName
                }),
                redirect: "follow"  // opcional, por seguridad
            })
            .then(res => {
                if (res.redirected) {
                    // Si el backend hace redirect, seguimos la URL
                    window.location.href = res.url;
                } else {
                    // Si no hay redirect, podemos actualizar localmente
                    if (action === "apuntarme") {
                        playersArray.push(userName);
                        isUserInEvent = true;
                        button.textContent = "Desapuntarme";
                        button.className = "btn-leave";
                    } else {
                        const index = playersArray.indexOf(userName);
                        if (index > -1) playersArray.splice(index, 1);
                        isUserInEvent = false;
                        button.textContent = "Apuntarme";
                        button.className = "btn-join";
                    }

                    // Actualizamos el texto de jugadores
                    li.querySelector("small").textContent = playersArray.join(", ");

                }
            })
            .catch(err => console.error("Error enviando acción:", err));
        });


        li.innerHTML = `
            <strong>${event.title}</strong><br>
            ${event.description}<br>
            <small>${playersArray.join(", ")}</small><br>
        `;
        li.appendChild(button);
        li.appendChild(document.createElement("br"));
        li.appendChild(document.createElement("br"));
        li.appendChild(document.createElement("hr"));
        li.appendChild(document.createElement("br"));
        eventsList.appendChild(li);

    });

}


/* =========================
   NAVEGACIÓN
   ========================= */

prevBtn.addEventListener("click", () => {
    currentDate.setMonth(currentDate.getMonth() - 1);
    renderCalendar();
});

nextBtn.addEventListener("click", () => {
    currentDate.setMonth(currentDate.getMonth() + 1);
    renderCalendar();
});

renderCalendar();
