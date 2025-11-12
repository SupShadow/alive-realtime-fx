# Manual QA Checklist

## Recording controls

- [ ] Start the application with `npm run dev` and load it in a supported browser.
- [ ] Click the **Record (R)** button to begin recording and confirm the UI indicates the active recording state.
- [ ] Press the **R** key to stop recording and ensure the capture is saved to disk.
- [ ] With focus on the main canvas (no text inputs focused), press **R** to start recording and confirm the recording indicator appears.
- [ ] Focus a text input (e.g., any slider numeric field) and press **R** to verify the hotkey is ignored while typing.
- [ ] Press **G** to toggle the Crimson Gate effect and confirm the visual changes.
- [ ] Press **F** to toggle Freeze Frame and confirm the effect.
- [ ] Press **P** to trigger the peak punch-in boost.

> This checklist verifies that recording can be triggered via both the UI control and the keyboard shortcut while ensuring keyboard handling does not interfere with text entry.
