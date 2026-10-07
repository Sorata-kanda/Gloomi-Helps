const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("bot", {
    onStatus(callback) {
        ipcRenderer.on("bot-status", (_, message) => {
            callback(message);
        });
    },

    onClasses(callback) {
        ipcRenderer.on("bot-classes", (_, classes) => {
            callback(classes);
        });
    },

    onClassUpdate(callback) {
        ipcRenderer.on("bot-class-update", (_, updated) => {
            callback(updated);
        });
    },

    onCountdown(callback) {
        ipcRenderer.on("bot-countdown", (_, data) => {
            callback(data);
        });
    },

    showConsole() {
        ipcRenderer.send("show-console");
    },

    quit() {
        ipcRenderer.send("quit-app");
    },
});

contextBridge.exposeInMainWorld("debug", {
    onLog(callback) {
        ipcRenderer.on("console-log", (_, data) => {
            callback(data);
        });
    },

    onCountdown(callback) {
        ipcRenderer.on("console-countdown", (_, data) => {
            callback(data);
        });
    },
});

contextBridge.exposeInMainWorld("auth", {
    success(uid) {
        ipcRenderer.send("auth-success", uid);
    },
});

contextBridge.exposeInMainWorld("codetantra", {
    success(username, password) {
        ipcRenderer.send("codetantra-success", username, password);
    },
});
