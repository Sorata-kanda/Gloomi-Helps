const {
    app,
    BrowserWindow,
    Tray,
    Menu,
    ipcMain,
    nativeImage,
} = require("electron");

const path = require("path");
const { chromium } = require("playwright");


// ============================================================
// ELECTRON STORAGE
// ============================================================

app.setPath(
    "userData",
    path.join(app.getPath("appData"), "Gloomi Help")
);
// ============================================================
// CONFIG
// ============================================================

const CHROME_EXECUTABLE =
    "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";

const CODETANTRA_LOGIN_URL =
    "https://lovelyprofessionaluniversity.codetantra.com/";

const CODETANTRA_HOME_URL =
    "https://lovelyprofessionaluniversity.codetantra.com/secure/home.jsp";

const MEETINGS_URL =
    "https://lovelyprofessionaluniversity.codetantra.com/secure/tla/m.jsp";

const MEETING_BASE_URL = "https://lovelyprofessionaluniversity.codetantra.com";

const GAP_THRESHOLD_MINS = 5;

// ============================================================
// CREDENTIALS
// ============================================================



let username = null;
let password = null;

console.log("Credentials loaded:", {
    username: username ? "YES" : "NO",
    password: password ? "YES" : "NO",
});

// ============================================================
// GLOBAL STATE
// ============================================================

let tray = null;
let trayWindow = null;
let consoleWindow = null;
let authWindow = null;

let browser = null;
let page = null;

let isQuitting = false;

// ============================================================
// CONSOLE STATE
// ============================================================

const logHistory = [];

let currentCountdown = {
    label: "",
    remaining: "",
    currentClass: null,
};

// ============================================================
// LOGGING
// ============================================================

function sendLog(message, type = "log") {
    const timestamp = new Date().toLocaleTimeString();

    const output = `[${timestamp}] ${message}`;

    const logEntry = {
        message: output,
        type,
    };

    // Keep history so the console can display
    // logs that happened before it was opened.
    logHistory.push(logEntry);

    // Prevent unlimited memory growth.
    if (logHistory.length > 1000) {
        logHistory.shift();
    }

    // Normal Electron/Node terminal
    if (type === "error") {
        console.error(output);
    } else if (type === "warn") {
        console.warn(output);
    } else {
        console.log(output);
    }

    // Send live log to console window
    if (consoleWindow && !consoleWindow.isDestroyed()) {
        consoleWindow.webContents.send("console-log", logEntry);
    }
}

function sendStatus(message) {
    if (trayWindow && !trayWindow.isDestroyed()) {
        trayWindow.webContents.send("bot-status", message);
    }

    sendLog(message);
}

function sendClasses(classes) {
    if (trayWindow && !trayWindow.isDestroyed()) {
        trayWindow.webContents.send("bot-classes", classes);
    }
}

function sendClassUpdate(updated) {
    if (trayWindow && !trayWindow.isDestroyed()) {
        trayWindow.webContents.send("bot-class-update", updated);
    }
}

function sendCountdown(label, remaining, currentClass = null) {
    currentCountdown = {
        label,
        remaining,
        currentClass,
    };

    // Tray UI
    if (trayWindow && !trayWindow.isDestroyed()) {
        trayWindow.webContents.send("bot-countdown", {
            label,
            remaining,
            currentClass,
        });
    }

    // Console UI
    if (consoleWindow && !consoleWindow.isDestroyed()) {
        consoleWindow.webContents.send("console-countdown", {
            label,
            remaining,
            currentClass,
        });
    }
}

// ============================================================
// WINDOWS
// ============================================================
function createAuthWindow() {
    if (authWindow && !authWindow.isDestroyed()) {
        authWindow.show();
        authWindow.focus();
        return;
    }

    authWindow = new BrowserWindow({
        width: 420,
        height: 520,

        resizable: false,
        maximizable: false,
        show: false,
        title: "Gloomi Help — Sign In",

        webPreferences: {
            preload: path.join(__dirname, "preload.js"),
            contextIsolation: true,
            nodeIntegration: false,
        },
    });
    
    authWindow.loadFile(path.join(__dirname, "auth", "login.html"));

    authWindow.on("closed", () => {
        authWindow = null;
    });

    authWindow.webContents.once("did-finish-load", () => {
        authWindow.show();
    });
}



function createTrayWindow() {
    trayWindow = new BrowserWindow({
        width: 420,
        height: 560,

        frame: false,
        resizable: false,

        show: false,

        skipTaskbar: true,

        webPreferences: {
            preload: path.join(__dirname, "preload.js"),
            contextIsolation: true,
            nodeIntegration: false,
        },
    });

    trayWindow.loadFile(path.join(__dirname, "tray.html"));

    // Closing this window DOES NOT quit the application.
    trayWindow.on("close", (event) => {
        if (!isQuitting) {
            event.preventDefault();
            trayWindow.hide();
        }
    });

    // Optional: hide when clicking outside
    trayWindow.on("blur", () => {
        if (!isQuitting) {
            trayWindow.hide();
        }
    });
}

function createConsoleWindow() {
    if (consoleWindow && !consoleWindow.isDestroyed()) {
        consoleWindow.show();
        consoleWindow.focus();
        return;
    }

    consoleWindow = new BrowserWindow({
        width: 850,
        height: 550,

        minWidth: 600,
        minHeight: 350,

        title: "Gloomi Help — Console",

        backgroundColor: "#000000",

        webPreferences: {
            preload: path.join(__dirname, "preload.js"),

            contextIsolation: true,

            nodeIntegration: false,
        },
    });

    // IMPORTANT:
    // Register this BEFORE loading the page.
    consoleWindow.webContents.on("did-finish-load", () => {
        // Send all previous logs
        for (const log of logHistory) {
            consoleWindow.webContents.send("console-log", log);
        }

        // Send current countdown
        consoleWindow.webContents.send("console-countdown", currentCountdown);
    });

    consoleWindow.loadFile(path.join(__dirname, "console.html"));

    // Closing console DOES NOT quit app
    consoleWindow.on("close", (event) => {
        if (!isQuitting) {
            event.preventDefault();

            consoleWindow.hide();
        }
    });

    consoleWindow.on("closed", () => {
        consoleWindow = null;
    });
}

// ============================================================
// TRAY
// ============================================================

function createTray() {
    const iconPath = path.join(__dirname, "assets", "tray-icon.png");

    tray = new Tray(nativeImage.createFromPath(iconPath));

    tray.setToolTip("Gloomi Help");

    const contextMenu = Menu.buildFromTemplate([
        {
            label: "Show console",
            click: () => {
                createConsoleWindow();
            },
        },

        {
            type: "separator",
        },

        {
            label: "Quit",
            click: async () => {
                await shutdown();
            },
        },
    ]);

    tray.setContextMenu(contextMenu);

    tray.on("click", () => {
        toggleTrayWindow();
    });
}

function toggleTrayWindow() {
    if (!trayWindow) return;

    if (trayWindow.isVisible()) {
        trayWindow.hide();
        return;
    }

    const bounds = tray.getBounds();

    const windowBounds = trayWindow.getBounds();

    const x = Math.round(bounds.x + bounds.width / 2 - windowBounds.width / 2);

    const y = Math.round(bounds.y - windowBounds.height - 8);

    trayWindow.setPosition(x, y, false);

    trayWindow.show();
    trayWindow.focus();
}

// ============================================================
// PLAYWRIGHT
// ============================================================

async function launchBrowser() {
    sendLog("Launching Chrome...");

    browser = await chromium.launch({
        headless: false,
        executablePath: CHROME_EXECUTABLE,

        args: ["--start-maximized"],
    });

    const context = await browser.newContext({
        viewport: null,

        permissions: ["microphone", "camera"],
    });

    await context.grantPermissions(["microphone", "camera"], {
        origin: MEETING_BASE_URL,
    });

    page = await context.newPage();

    sendLog("Chrome launched.");

    return {
        browser,
        page,
    };
}

// ============================================================
// LOGIN
// ============================================================

async function login(page) {
    if (!username || !password) {
        throw new Error(
            "CodeTantra credentials missing. Check your .env file.",
        );
    }

    sendStatus("Logging into CodeTantra...");

    await page.goto(CODETANTRA_LOGIN_URL, {
        waitUntil: "domcontentloaded",
    });

    await page.waitForSelector("input[type='text']");

    await page.fill("input[type='text']", username);

    await page.fill("input[type='password']", password);

    await page.click("button[type='submit'], input[type='submit']");

    await page.waitForURL(CODETANTRA_HOME_URL, {
        timeout: 30000,
    });

    sendStatus("Logged into CodeTantra.");
}

// ============================================================
// GET TODAY'S CLASSES
// ============================================================

async function getTodaysClasses(page) {
    sendStatus("Fetching today's classes...");

    await page.goto(MEETINGS_URL, {
        waitUntil: "domcontentloaded",
    });

    await page
        .waitForSelector("a.fc-time-grid-event", {
            timeout: 15000,
        })
        .catch(() => {});

    const allMeetings = await page.locator("a.fc-time-grid-event").all();

    const classes = [];

    for (const meeting of allMeetings) {
        const timeEl = meeting.locator(".fc-time");

        const titleEl = meeting.locator(".fc-title");

        const dataFull = await timeEl
            .getAttribute("data-full")
            .catch(() => null);

        if (!dataFull) {
            sendLog(
                "Skipping class because time information is missing.",
                "warn",
            );
            continue;
        }

        const href = await meeting.getAttribute("href");

        const classTitle = await titleEl.textContent().catch(() => null);

        const [startTime, endTime = null] = dataFull.split(" - ");

        classes.push({
            title: classTitle?.trim(),
            startTime,
            endTime,

            href: MEETING_BASE_URL + href,

            status: "upcoming",
        });
    }

    sendLog(`Found ${classes.length} classes today.`);

    sendClasses(classes);

    return classes;
}

// ============================================================
// TIME
// ============================================================

function parseTimeToDate(timeStr) {
    const [time, modifier] = timeStr.trim().split(" ");

    let [hours, minutes] = time.split(":").map(Number);

    if (modifier === "PM" && hours !== 12) {
        hours += 12;
    }

    if (modifier === "AM" && hours === 12) {
        hours = 0;
    }

    const now = new Date();

    return new Date(
        now.getFullYear(),
        now.getMonth(),
        now.getDate(),
        hours,
        minutes,
    );
}

// ============================================================
// COUNTDOWN
// ============================================================

async function countdownWait(label, waitMs, currentClass = null) {
    if (waitMs <= 0) return;

    const endAt = Date.now() + waitMs;

    while (true) {
        const remaining = endAt - Date.now();

        if (remaining <= 0) {
            sendCountdown(label, "00:00:00", currentClass);
            return;
        }

        const totalSeconds = Math.ceil(remaining / 1000);

        const hours = Math.floor(totalSeconds / 3600);

        const minutes = Math.floor(
            (totalSeconds % 3600) / 60
        );

        const seconds = totalSeconds % 60;

        const formatted =
            `${String(hours).padStart(2, "0")}:` +
            `${String(minutes).padStart(2, "0")}:` +
            `${String(seconds).padStart(2, "0")}`;

        sendCountdown(label, formatted, currentClass);

        await new Promise((resolve) =>
            setTimeout(resolve, 1000)
        );
    }
}
// ============================================================
// GET IN-CLASS REMAINING TIME
// ============================================================

async function getInClassRemainingMs(classPage) {
    try {
        const classFrame = classPage
            .frames()
            .find((frame) =>
                frame.url().includes("/js/ctai/m2.html")
            );

        if (!classFrame) {
            throw new Error("In-class iframe not found");
        }

        const timeLeftEl = classFrame
            .locator("span.tabular-nums")
            .first();

        await timeLeftEl.waitFor({
            state: "visible",
            timeout: 20000,
        });

        const timeLeftStr = await timeLeftEl.innerText();

        const parts = timeLeftStr
            .trim()
            .split(":")
            .map(Number);

        let msUntilEnd = 0;

        if (parts.length === 3) {
            msUntilEnd =
                (parts[0] * 3600 +
                    parts[1] * 60 +
                    parts[2]) *
                1000;
        } else if (parts.length === 2) {
            msUntilEnd =
                (parts[0] * 60 + parts[1]) * 1000;
        }

        if (msUntilEnd <= 0) {
            throw new Error(
                `Invalid in-class timer: ${timeLeftStr}`
            );
        }

        sendLog(
            `In-class timer: ${timeLeftStr} remaining.`
        );

        return msUntilEnd;
    } catch (error) {
        sendLog(
            `Could not read in-class timer: ${error.message}`,
            "warn"
        );

        return null;
    }
}

// ============================================================
// JOIN CLASS
// ============================================================

async function joinAndAttend(page, classInfo) {
    sendStatus(`Opening ${classInfo.title}...`);

    sendClassUpdate({
        href: classInfo.href,
        status: 'joining',
    });

    await page.goto(classInfo.href, {
        waitUntil: 'domcontentloaded',
    });

    const joinBtn = page.locator('a.joinBtn');

    await joinBtn.waitFor({
        state: 'visible',
        timeout: 5 * 60 * 1000,
    });

    sendStatus(`Joining ${classInfo.title}...`);

    const context = page.context();

    let classPage;

    try {
        [classPage] = await Promise.all([
            context.waitForEvent('page', {
                timeout: 10000,
            }),

            joinBtn.click(),
        ]);

        await classPage.waitForLoadState('domcontentloaded').catch(() => {});
    } catch {
        classPage = page;

        await joinBtn.click().catch(() => {});
    }

    sendClassUpdate({
        href: classInfo.href,
        status: 'in-class',
    });

    sendStatus(`Currently attending: ${classInfo.title}`);

    // ========================================================
    // DETERMINE CLASS END TIME
    // ========================================================

    let waitMs = null;

    // 1. Prefer the live in-class countdown
    waitMs = await getInClassRemainingMs(classPage);

    // 2. Fall back to timetable end time
    if (waitMs === null && classInfo.endTime) {
        const end = parseTimeToDate(classInfo.endTime);

        waitMs = end.getTime() - Date.now();

        sendLog(`Using timetable end time: ${classInfo.endTime}`);
    }

    // 3. Do NOT invent a fake class duration
    if (waitMs === null) {
        throw new Error(`Unable to determine end time for ${classInfo.title}.`);
    }

    // ========================================================
    // WAIT UNTIL CLASS ENDS
    // ========================================================

    await waitForClassToEnd(classPage, classInfo, waitMs);

    // Close only the class tab if it is separate
    if (classPage !== page && !classPage.isClosed()) {
        await classPage.close().catch(() => {});
    }
}

// ============================================================
// WAIT FOR CLASS END
// ============================================================

async function waitForClassToEnd(classPage, classInfo, waitMs) {
    if (waitMs > 0) {
        await countdownWait('Class ends in', waitMs, classInfo);
    }

    if (isQuitting) return;

    sendStatus(`${classInfo.title} ended.`);
    sendLog(`${classInfo.title} ended.`);

    sendClassUpdate({
        href: classInfo.href,
        status: 'done',
    });
}

// ============================================================
// BOT LOOP
// ============================================================

// ============================================================
// WAIT UNTIL NEXT DAY
// ============================================================

async function waitUntilNextDay() {
    const now = new Date();

    const nextDay = new Date(
        now.getFullYear(),
        now.getMonth(),
        now.getDate() + 1,
        6,
        0,
        0,
    );

    const waitMs = nextDay.getTime() - Date.now();

    sendStatus("All classes completed for today.");
    sendLog("All classes completed for today.");

    // Close Chrome while waiting overnight.
    if (browser) {
        try {
            await browser.close();
        } catch (error) {
            sendLog(
                `Error closing Chrome: ${error.message}`,
                "warn",
            );
        }

        browser = null;
        page = null;
    }

    if (isQuitting) return;

    sendStatus("Waiting until tomorrow...");
    
    await countdownWait(
        "Next day starts in",
        waitMs,
        null,
    );
}

// ============================================================
// BOT LOOP
// ============================================================

async function runLoop() {
    while (!isQuitting) {
        try {
            sendLog("Starting today's class check...");

            const launch = await launchBrowser();

            browser = launch.browser;
            page = launch.page;

            await login(page);

            const classes = await getTodaysClasses(page);

            if (classes.length === 0) {
                sendStatus("No classes scheduled for today.");
                sendLog("No classes scheduled for today.");
            }

            for (let i = 0; i < classes.length; i++) {
                if (isQuitting) return;

                const cls = classes[i];

                const now = new Date();

                const start = parseTimeToDate(cls.startTime);

                const end = cls.endTime
                    ? parseTimeToDate(cls.endTime)
                    : null;

                // ====================================================
                // ALREADY ENDED
                // ====================================================

                if (end && Date.now() > end.getTime()) {
                    cls.status = "done";

                    sendClassUpdate(cls);

                    sendLog(
                        `Skipping ended class: ${cls.title}`,
                    );

                    continue;
                }

                const minsUntilStart =
                    (start.getTime() - now.getTime()) / 1000 / 60;

                // ====================================================
                // LARGE GAP
                // ====================================================

                if (minsUntilStart > GAP_THRESHOLD_MINS) {
                    sendStatus(`Next class: ${cls.title}`);

                    if (browser) {
                        await browser.close();

                        browser = null;
                        page = null;
                    }

                    const waitMs =
                        start.getTime() -
                        Date.now() -
                        2 * 60 * 1000;

                    if (waitMs > 0) {
                        await countdownWait(
                            "Next class starts in",
                            waitMs,
                            cls,
                        );
                    }

                    if (isQuitting) return;

                    const newLaunch = await launchBrowser();

                    browser = newLaunch.browser;
                    page = newLaunch.page;

                    await login(page);
                }

                // ====================================================
                // SMALL GAP
                // ====================================================

                else if (minsUntilStart > 0) {
                    sendStatus(
                        `Waiting for ${cls.title}...`,
                    );

                    await page.goto(MEETINGS_URL, {
                        waitUntil: "domcontentloaded",
                    });

                    await countdownWait(
                        "Next class starts in",
                        start.getTime() - Date.now(),
                        cls,
                    );
                }

                if (isQuitting) return;

                // ====================================================
                // JOIN CLASS
                // ====================================================

                await joinAndAttend(page, cls);

                // Return to meetings page after class
                if (page) {
                    await page
                        .goto(MEETINGS_URL, {
                            waitUntil: "domcontentloaded",
                        })
                        .catch(() => {});
                }
            }

            // ========================================================
            // TODAY IS FINISHED
            // ========================================================

            await waitUntilNextDay();

        } catch (error) {
            sendStatus("BOT ERROR — check console");

            sendLog(
                error.stack || error.message,
                "error",
            );

            // Make sure Chrome isn't left running after an error.
            if (browser) {
                try {
                    await browser.close();
                } catch {}
            }

            browser = null;
            page = null;

            if (isQuitting) return;

            // Don't permanently kill the bot because of a temporary
            // error. Wait 5 minutes and try again.
            sendStatus("Retrying in 5 minutes...");

            await countdownWait(
                "Retrying in",
                5 * 60 * 1000,
            );
        }
    }
}

// ============================================================
// SHUTDOWN
// ============================================================

async function shutdown() {
    if (isQuitting) return;

    isQuitting = true;

    sendLog("Shutting down Gloomi Help...");

    try {
        if (browser) {
            await browser.close();
        }
    } catch (error) {
        console.error(error);
    }

    if (tray) {
        tray.destroy();
        tray = null;
    }

    app.quit();
}

// ============================================================
// IPC
// ============================================================

ipcMain.on("auth-success", (event, uid) => {
    sendLog(`Firebase authentication successful. UID: ${uid}`);

    sendLog("Waiting for CodeTantra credentials...");

    // DO NOT close authWindow.
    // The Firebase session must remain alive.
});

ipcMain.on("codetantra-success", (event, newUsername, newPassword) => {
    username = newUsername;
    password = newPassword;

    sendLog("CodeTantra credentials received.");

    sendLog("CodeTantra credentials stored in memory.");

    if (authWindow && !authWindow.isDestroyed()) {
        authWindow.close();

        authWindow = null;
    }

    sendLog("Starting Gloomi Help bot...");

    runLoop();
});


ipcMain.on("show-console", () => {
    createConsoleWindow();
});

ipcMain.on("hide-console", () => {
    if (consoleWindow && !consoleWindow.isDestroyed()) {
        consoleWindow.hide();
    }
});

ipcMain.on("quit-app", async () => {
    await shutdown();
});

// ============================================================
// APP START
// ============================================================

app.whenReady().then(async () => {
    createTrayWindow();
    createTray();

    sendLog("Gloomi Help started.");
    sendLog("Waiting for Firebase authentication...");

    createAuthWindow();
});

app.on("before-quit", () => {
    isQuitting = true;
});

app.on("window-all-closed", (event) => {
    // IMPORTANT:
    // Don't quit when windows are closed.
    // The application lives in the tray.
});
