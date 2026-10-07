import {
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    setPersistence,
    inMemoryPersistence,
} from "https://www.gstatic.com/firebasejs/12.4.0/firebase-auth.js";

import {
    doc,
    setDoc,
} from "https://www.gstatic.com/firebasejs/12.4.0/firebase-firestore.js";

import { auth, db } from "../firebase/firebase-config.js";

// ============================================================
// ELEMENTS
// ============================================================

const loginSection = document.getElementById("loginSection");

const codetantraSection = document.getElementById("codetantraSection");

const emailInput = document.getElementById("email");

const passwordInput = document.getElementById("password");

const loginBtn = document.getElementById("loginBtn");

const signupBtn = document.getElementById("signupBtn");

const codetantraUsername = document.getElementById("codetantraUsername");

const codetantraPassword = document.getElementById("codetantraPassword");

const saveCodeTantraBtn = document.getElementById("saveCodeTantraBtn");

const message = document.getElementById("message");

// ============================================================
// FIREBASE PERSISTENCE
// ============================================================

const authReady = setPersistence(auth, inMemoryPersistence);

// ============================================================
// MESSAGE
// ============================================================

function showMessage(text, error = true) {
    message.textContent = text;

    message.style.color = error ? "#ff7777" : "#77ff99";
}

// ============================================================
// SHOW CODETANTRA SETUP
// ============================================================

function showCodeTantraSetup() {
    loginSection.classList.add("hidden");

    codetantraSection.classList.remove("hidden");

    showMessage("Firebase login successful.", false);
}

// ============================================================
// SIGN IN
// ============================================================

loginBtn.addEventListener("click", async () => {
    const email = emailInput.value.trim();

    const password = passwordInput.value;

    if (!email || !password) {
        showMessage("Enter email and password.");

        return;
    }

    try {
        loginBtn.disabled = true;

        showMessage("Signing in...", false);

        await authReady;

        const result = await signInWithEmailAndPassword(auth, email, password);

        console.log("Signed in:", result.user.uid);

        showCodeTantraSetup();
    } catch (error) {
        console.error(error);

        showMessage(error.message);
    } finally {
        loginBtn.disabled = false;
    }
});

// ============================================================
// CREATE ACCOUNT
// ============================================================

signupBtn.addEventListener("click", async () => {
    const email = emailInput.value.trim();

    const password = passwordInput.value;

    if (!email || !password) {
        showMessage("Enter email and password.");

        return;
    }

    if (password.length < 6) {
        showMessage("Password must be at least 6 characters.");

        return;
    }

    try {
        signupBtn.disabled = true;

        showMessage("Creating account...", false);

        await authReady;

        const result = await createUserWithEmailAndPassword(
            auth,
            email,
            password,
        );

        const uid = result.user.uid;

        // Create the user's Firestore document.
        await setDoc(
            doc(db, "users", uid),
            {
                email: email,
                createdAt: new Date().toISOString(),
            },
            {
                merge: true,
            },
        );

        console.log("Created Firebase user:", uid);

        // Firebase automatically signs
        // the new user in.
        showCodeTantraSetup();
    } catch (error) {
        console.error(error);

        showMessage(error.message);
    } finally {
        signupBtn.disabled = false;
    }
});

// ============================================================
// SAVE CODETANTRA CREDENTIALS
// ============================================================

saveCodeTantraBtn.addEventListener("click", async () => {
    const username = codetantraUsername.value.trim();

    const password = codetantraPassword.value;

    if (!username || !password) {
        showMessage("Enter your CodeTantra username and password.");

        return;
    }

    try {
        saveCodeTantraBtn.disabled = true;

        showMessage("Saving CodeTantra credentials...", false);

        // IMPORTANT:
        // We are still inside the same Firebase
        // authenticated window.

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

        // Send credentials to main.js.
        window.codetantra.success(username, password);
    } catch (error) {
        console.error(error);

        showMessage(error.message);
    } finally {
        saveCodeTantraBtn.disabled = false;
    }
});
