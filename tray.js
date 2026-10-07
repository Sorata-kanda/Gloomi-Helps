let classes = [];

let countdownTarget = null;

// ============================================================
// DOM
// ============================================================

const classList = document.getElementById("classList");

const statusBar = document.getElementById("statusBar");

const clockEl = document.getElementById("clock");

const clockDate = document.getElementById("clockDate");

const quitBtn = document.getElementById("quitBtn");

// ============================================================
// CLOCK
// ============================================================

function updateClock() {
    const now = new Date();

    const hh = String(now.getHours()).padStart(2, "0");

    const mm = String(now.getMinutes()).padStart(2, "0");

    const ss = String(now.getSeconds()).padStart(2, "0");

    clockEl.textContent = `${hh}:${mm}:${ss}`;

    clockDate.textContent = now.toLocaleDateString("en-US", {
        weekday: "long",
        day: "numeric",
        month: "long",
        year: "numeric",
    });
}

setInterval(updateClock, 1000);

updateClock();

// ============================================================
// HELPERS
// ============================================================

function shortName(title) {
    if (!title) return "Unknown";

    return title.split(/[-–]/)[0].trim();
}

// ============================================================
// STATUS
// ============================================================

const STATUS_LABEL = {
    upcoming: "upcoming",

    joining: "joining",

    "in-class": "ongoing",

    done: "ended",
};

// ============================================================
// RENDER
// ============================================================

function renderClasses() {
    if (classes.length === 0) {
        classList.innerHTML = `
            <div class="empty-state">

                <div class="empty-icon">
                    📭
                </div>

                <div class="empty-text">
                    No classes today
                </div>

            </div>
        `;

        return;
    }

    classList.innerHTML = classes
        .map((cls) => {
            const status = cls.status || "upcoming";

            const badgeLabel = STATUS_LABEL[status] || status;

            const timeText = cls.endTime
                ? `${cls.startTime} → ${cls.endTime}`
                : cls.startTime;

            const isActive =
                countdownTarget && countdownTarget.classTitle === cls.title;

            const countdownHtml = isActive
                ? `
                        <div class="class-countdown">
                            Class joins in:
                            ${countdownTarget.remaining}
                        </div>
                    `
                : "";

            return `

                <div class="
                    class-item
                    ${status}
                ">

                    <div class="
                        class-item-left
                    ">

                        <div class="
                            class-dot
                            ${status}
                        "></div>


                        <div class="
                            class-info
                        ">

                            <div class="
                                class-name
                            ">
                                ${shortName(cls.title)}
                            </div>


                            <div class="
                                class-time
                            ">
                                ${timeText}
                            </div>


                            ${countdownHtml}

                        </div>

                    </div>


                    <span class="
                        badge
                        ${status}
                    ">
                        ${badgeLabel}
                    </span>

                </div>

            `;
        })
        .join("");
}

// ============================================================
// BOT EVENTS
// ============================================================

window.bot.onStatus((msg) => {
    statusBar.textContent = msg;
});

window.bot.onClasses((list) => {
    classes = list;

    renderClasses();
});

window.bot.onClassUpdate((updated) => {
    const index = classes.findIndex((c) => c.href === updated.href);

    if (index !== -1) {
        classes[index] = {
            ...classes[index],
            ...updated,
        };
    } else {
        classes.push(updated);
    }

    renderClasses();
});

window.bot.onCountdown(({ label, remaining, currentClass }) => {
    statusBar.textContent = `${label}: ${remaining}`;

    if (currentClass) {
        countdownTarget = {
            classTitle: currentClass.title,

            remaining,
        };

        renderClasses();
    }
});

// ============================================================
// QUIT
// ============================================================

quitBtn.addEventListener("click", () => {
    window.bot.quit();
});
