# alive-realtime-fx

A local-first React + TypeScript + Vite application that renders live camera or video input through a tactile, high-contrast real-time FX pipeline inspired by analog film and contemporary glitch aesthetics.

Features:
- WebGL2 processing graph with adjustable passes (chromatic aberration, grayscale S-curve, film grain, vignette/gate weave, crimson haze accent gate).
- Media capture from webcam or uploaded file with audio monitoring via WebAudio.
- MediaRecorder integration with a "record safe" mode to disable temporal jitter.
- Modular engine primitives for scheduling, framebuffer pooling, and shader utilities.
- UI HUD with master controls, preset selector, safe-area guides, and hotkeys for rapid toggling.
- Offline-friendly asset stubs stored as data URLs in `public/*.dataurl` so that no binary blobs are required in git history.

The project avoids external CDNs and runs entirely offline.
