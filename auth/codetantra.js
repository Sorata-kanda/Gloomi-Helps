import {
    doc,
    setDoc,
} from "https://www.gstatic.com/firebasejs/12.4.0/firebase-firestore.js";

import { auth, db } from "../firebase/firebase-config.js";

const usernameInput = document.getElementById("username");
const passwordInput = document.getElementById("password");

const saveBtn = document.getElementById("saveBtn");
const message = document.getElementById("message");

function showMessage(text, error = true) {
    message.textContent = text;

    message.style.color = error ? "#ff7777" : "#77ff99";
}

saveBtn.addEventListener("click", async () => {
    const username = usernameInput.value.trim();
    const password = passwordInput.value;

    if (!username || !password) {
        showMessage("Enter your CodeTantra username and password.");
        return;
    }

    try {
        saveBtn.disabled = true;

        showMessage("Saving CodeTantra credentials...", false);

        const user = auth.currentUser;

        if (!user) {
            throw new Error("Firebase authentication session not found.");
        }

        const uid = user.uid;

        await setDoc(
            doc(db, "users", uid),
            {
                codetantra: {
                    username: username,
                    password: password,
                },
            },
            {
                merge: true,
            },
        );

        console.log("CodeTantra credentials saved for UID:", uid);

        showMessage("Credentials saved. Starting Gloomi Help...", false);

        // Send credentials to Electron main process.
        // They will only be kept in RAM.
        window.codetantra.success(username, password);
    } catch (error) {
        console.error(error);

        showMessage(error.message);
    } finally {
        saveBtn.disabled = false;
    }
});
