# alive-realtime-fx

A local-first React + TypeScript + Vite application that renders live camera or video input through a tactile, high-contrast real-time FX pipeline inspired by analog film and contemporary glitch aesthetics.

## Features

- WebGL2 processing graph with adjustable passes (chromatic aberration, grayscale S-curve, film grain, vignette/gate weave, crimson haze accent gate).
- Media capture from webcam or uploaded file with audio monitoring via WebAudio.
- MediaRecorder integration with a "record safe" mode to disable temporal jitter.
- Modular engine primitives for scheduling, framebuffer pooling, and shader utilities.
- UI HUD with master controls, preset selector, safe-area guides, and hotkeys for rapid toggling.
- Offline-friendly asset stubs stored as data URLs in `public/*.dataurl` so that no binary blobs are required in git history.

The project avoids external CDNs and runs entirely offline.

## Camera & microphone permissions

- The app checks runtime permission status for the camera and microphone using the [`Permissions` API](https://developer.mozilla.org/en-US/docs/Web/API/Permissions_API) when it is available.
- If either permission is blocked, a HUD-styled banner appears inside the canvas wrapper to explain why capture cannot start and how to resolve it (browser site permissions or iframe `allow="camera; microphone; autoplay"` attributes).
- The banner is dismissible for the current session. It will re-open automatically if permissions are revoked again, helping operators understand why capture controls are disabled.

## Voraussetzungen & Installation

- Installiere [Node.js](https://nodejs.org/) in Version **18** oder höher (Vite 5 erfordert mindestens Node 18).
- Klone dieses Repository und wechsle in das Projektverzeichnis.
- Installiere alle Abhängigkeiten:

  ```bash
  npm install
  ```

## Entwicklung & Build

- `npm run dev`: Startet den Vite-Entwicklungsserver mit Hot Module Replacement für schnelle Iterationen.
- `npm run build`: Erstellt einen optimierten Produktionsbuild im Verzeichnis `dist/`.
- `npm run preview`: Dient zur lokalen Vorschau des Produktionsbuilds über einen statischen Vite-Server.
- `npm run typecheck`: Führt den TypeScript-Compiler im `--noEmit`-Modus aus, um statische Typprüfungen ohne Build durchzuführen.
