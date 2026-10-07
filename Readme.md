# Gloomi Help

### LPU CodeTantra Class Attendance Assistant

Gloomi Help is a Windows desktop application designed to automate attendance for LPU CodeTantra classes.

It runs quietly in the Windows system tray, monitors your daily class schedule, and automatically joins classes when they are scheduled. The goal is simple: reduce the repetitive work involved in attending online classes and let the application handle it for you.

---

## Features

- **Automatic class detection**  
  Retrieves and processes your scheduled CodeTantra classes for the current day.

- **Automatic class joining**  
  Joins classes automatically when their scheduled time arrives.

- **Background operation**  
  Runs from the Windows system tray without requiring the main application window to remain open.

- **Live class tracking**  
  Displays upcoming, joining, ongoing, and completed class states.

- **Countdown system**  
  Shows the remaining time before the next class begins.

- **Automatic browser control**  
  Uses Playwright to launch and control Google Chrome for CodeTantra.

- **Microphone and camera handling**  
  Automatically grants the required browser permissions for online classes.

- **Authentication**  
  Uses Firebase Authentication to manage Gloomi Help user accounts.

- **Automatic recovery**  
  Handles failures and retries the process instead of requiring the application to be restarted manually.

- **Built-in console**  
  Provides real-time information about what the application is currently doing.

---

## How It Works

```text
                    Gloomi Help
                         |
                         v
                 User Authentication
                         |
                         v
              CodeTantra Credentials
                         |
                         v
                Fetch Today's Classes
                         |
                         v
                 Wait for Class Time
                         |
                         v
                 Launch / Control Chrome
                         |
                         v
                  Join CodeTantra
                         |
                         v
                  Attend the Class
```

Once configured, Gloomi Help can remain running in the background and take care of scheduled classes automatically.

---

## Built With

<p align="left">
  <a href="https://www.electronjs.org/">
    <img src="https://skillicons.dev/icons?i=electron" height="48" alt="Electron" />
  </a>
  &nbsp;
  <a href="https://nodejs.org/">
    <img src="https://skillicons.dev/icons?i=nodejs" height="48" alt="Node.js" />
  </a>
  &nbsp;
  <a href="https://developer.mozilla.org/en-US/docs/Web/JavaScript">
    <img src="https://skillicons.dev/icons?i=js" height="48" alt="JavaScript" />
  </a>
  &nbsp;
  <a href="https://playwright.dev/">
    <img src="https://skillicons.dev/icons?i=playwright" height="48" alt="Playwright" />
  </a>
  &nbsp;
  <a href="https://firebase.google.com/">
    <img src="https://skillicons.dev/icons?i=firebase" height="48" alt="Firebase" />
  </a>
  &nbsp;
  <a href="https://developer.mozilla.org/en-US/docs/Web/HTML">
    <img src="https://skillicons.dev/icons?i=html" height="48" alt="HTML" />
  </a>
  &nbsp;
  <a href="https://developer.mozilla.org/en-US/docs/Web/CSS">
    <img src="https://skillicons.dev/icons?i=css" height="48" alt="CSS" />
  </a>
</p>

---

## Requirements

Before running Gloomi Help, make sure you have:

- Windows 10 or later
- Node.js installed
- Google Chrome installed
- An active LPU CodeTantra account
- Internet access

---

## Getting Started

### 1. Clone the repository

```bash
git clone https://github.com/Sorata-kanda/Gloomi-Help.git
cd Gloomi-Help
```

### 2. Install dependencies

```bash
npm install
```

### 3. Start the application

```bash
npm start
```

On the first launch, sign in using your Gloomi Help account and provide your LPU CodeTantra credentials.

After setup, Gloomi Help will start the attendance automation process.

---

## Building for Windows

To build the Windows installer locally:

```bash
npm run build
```

The generated installer will be placed in:

```text
dist/
```

You can then install Gloomi Help using the generated Windows installer.

---

## Automatic Releases

Gloomi Help uses **GitHub Actions** to automatically build and publish new Windows releases.

A new release can be created by pushing a version tag:

```bash
git tag v1.0.0
git push origin v1.0.0
```

The workflow will then:

1. Set up a Windows build environment.
2. Install the project dependencies.
3. Build the Electron application.
4. Generate the Windows installer.
5. Create a GitHub Release.
6. Attach the generated installer to the release.

This means releases can be created without manually building the application on a local machine.

---

## Security

Gloomi Help uses Firebase Authentication for application accounts.

CodeTantra credentials are required by the automation to log into CodeTantra. During normal operation, the credentials are supplied to the application and kept in memory while the bot is running.

Sensitive information such as credentials, API keys, environment files, and private configuration should never be committed to the repository.

---

## Project Structure

```text
Gloomi-Help/
│
├── assets/             Application icons and assets
├── auth/               Authentication interface
├── firebase/           Firebase configuration
│
├── main.js             Electron main process
├── preload.js          Secure renderer bridge
│
├── tray.html           Tray interface
├── tray.css            Tray styling
├── tray.js             Tray interface logic
│
├── console.html        Bot activity console
│
├── package.json        Project configuration
└── README.md           Project documentation
```

---

## Development

The application is primarily built around three components:

**Electron** handles the Windows desktop application, system tray, windows, and IPC communication.

**Playwright** controls the browser and performs the CodeTantra automation.

**Firebase** handles user authentication and cloud data.

These components work together to keep the application running in the background while providing a simple interface for the user.

---

## Status

Gloomi Help is currently under active development.

New features, improvements, and reliability updates may be introduced over time.

---

## Author

**Rahul Jangra**

Computer Science Engineering  
Lovely Professional University

---

<p align="center">
  <strong>Gloomi Help</strong><br>
  LPU CodeTantra Class Attendance Assistant
</p>