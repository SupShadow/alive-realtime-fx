// src/ui/Hud.tsx
import React, { ChangeEvent } from 'react';
import { RenderParams } from '../engine/renderGraph';
import PresetPanel from './PresetPanel';
import { SafeGuideMode } from './SafeGuides';
import InfoTooltip from './InfoTooltip';

type RecordState = 'idle' | 'recording' | 'paused';

interface HudProps {
  params: RenderParams;
  onParamChange: (changes: Partial<RenderParams>) => void;
  onPreset: (params: Partial<RenderParams>) => void;
  onStartCamera: () => void;
  onStopCamera: () => void;
  onVideoFile: (file: File) => void;
  onAudioFile: (file: File) => void;
  onRecordPrimaryAction: () => void;
  onRecordPauseToggle: () => void;
  recordState: RecordState;
  elapsedTimeMs: number;
  cameraActive: boolean;
  safeMode: boolean;
  onSafeModeChange: (value: boolean) => void;
  safeGuide: SafeGuideMode;
  onSafeGuideChange: (mode: SafeGuideMode) => void;
  envelope: { peak: number; rms: number };
  degradeStep: number;
}

const formatPercent = (value: number) => `${Math.round(value * 100)}%`;

const formatDuration = (milliseconds: number) => {
  const totalSeconds = Math.floor(milliseconds / 1000);
  const minutes = Math.floor(totalSeconds / 60)
    .toString()
    .padStart(2, '0');
  const seconds = (totalSeconds % 60).toString().padStart(2, '0');
  return `${minutes}:${seconds}`;
};

export const Hud: React.FC<HudProps> = ({
  params,
  onParamChange,
  onPreset,
  onStartCamera,
  onStopCamera,
  onVideoFile,
  onAudioFile,
  onRecordPrimaryAction,
  onRecordPauseToggle,
  recordState,
  elapsedTimeMs,
  cameraActive,
  safeMode,
  onSafeModeChange,
  safeGuide,
  onSafeGuideChange,
  envelope,
  degradeStep,
}) => {
  const handleRange =
    (key: keyof RenderParams) =>
    (event: ChangeEvent<HTMLInputElement>) => {
      const value = Number(event.target.value);
      onParamChange({ [key]: value } as Partial<RenderParams>);
    };

  const handleFile =
    (handler: (file: File) => void) =>
    (event: ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (file) handler(file);
    };

  return (
    <div className="hud">
      <div className="hud-panel">
        {/* Capture */}
        <div className="control-group">
          <h2>Capture</h2>
          <div className="video-source-controls">
            <button
              onClick={onStartCamera}
              disabled={cameraActive}
              title="Enable camera input"
            >
              {cameraActive ? 'Camera Active' : 'Enable Camera'}
            </button>
            <button
              onClick={onStopCamera}
              disabled={!cameraActive}
              title="Disable camera input"
            >
              Stop Camera
            </button>

            <div className="file-input">
              <label htmlFor="video-input">Load Video</label>
              <input
                id="video-input"
                type="file"
                accept="video/*"
                onChange={handleFile(onVideoFile)}
              />
            </div>

            <div className="file-input">
              <label htmlFor="audio-input">Load Audio</label>
              <input
                id="audio-input"
                type="file"
                accept="audio/*"
                onChange={handleFile(onAudioFile)}
              />
            </div>
          </div>

          <div className="status-row">
            <span className="badge">Peak {formatPercent(envelope.peak)}</span>
            <span className="badge">RMS {formatPercent(envelope.rms)}</span>
            <span className="badge">Degrade L{degradeStep}</span>
          </div>
        </div>

        {/* Tone & Contrast */}
        <div className="control-group">
          <h2>Tone &amp; Contrast</h2>

          <div className="control-stack">
            <div className="control-label-row">
              <label htmlFor="contrast-k">
                Contrast Curve ({params.contrastK.toFixed(2)})
              </label>
              <InfoTooltip
                content="Increases the steepness of the tone curve to create punchier highlights and deeper blacks."
                ariaLabel="Learn about contrast curve"
              />
            </div>
            <p className="control-helper">
              Boost to lift scene energy without crushing details.
            </p>
            <input
              id="contrast-k"
              type="range"
              min="1"
              max="12"
              step="0.1"
              value={params.contrastK}
              onChange={handleRange('contrastK')}
            />
          </div>

          <div className="control-stack">
            <div className="control-label-row">
              <label htmlFor="shadow-lift">
                Shadow Lift ({params.blackClamp.toFixed(2)})
              </label>
              <InfoTooltip
                content="Raises the darkest values to keep shadow noise or silhouettes from disappearing."
                ariaLabel="Learn about shadow lift"
              />
            </div>
            <p className="control-helper">
              Keeps black levels gentle for web playback and overlays.
            </p>
            <input
              id="shadow-lift"
              type="range"
              min="0"
              max="0.2"
              step="0.005"
              value={params.blackClamp}
              onChange={handleRange('blackClamp')}
            />
          </div>

          <div className="control-stack">
            <div className="control-label-row">
              <label htmlFor="midtone-gamma">
                Midtone Gamma ({params.gammaOut.toFixed(2)})
              </label>
              <InfoTooltip
                content="Rebalances midtones to keep faces and textures readable after contrast shaping."
                ariaLabel="Learn about midtone gamma"
              />
            </div>
            <p className="control-helper">
              Fine-tune midtone brightness for output monitoring.
            </p>
            <input
              id="midtone-gamma"
              type="range"
              min="0.5"
              max="2"
              step="0.01"
              value={params.gammaOut}
              onChange={handleRange('gammaOut')}
            />
          </div>
        </div>

        {/* Texture */}
        <div className="control-group">
          <h2>Texture</h2>

          <div className="control-stack">
            <div className="control-label-row">
              <label htmlFor="grain-amount">
                Film Grain ({params.grainIntensity.toFixed(2)})
              </label>
              <InfoTooltip
                content="Adds organic noise that helps motion feel analog and hides minor compression artifacts."
                ariaLabel="Learn about film grain"
              />
            </div>
            <p className="control-helper">
              Dial in how visible the grain appears on screen.
            </p>
            <input
              id="grain-amount"
              type="range"
              min="0"
              max="0.6"
              step="0.01"
              value={params.grainIntensity}
              onChange={handleRange('grainIntensity')}
            />
          </div>

          <div className="control-stack">
            <div className="control-label-row">
              <label htmlFor="grain-size">
                Grain Size ({params.grainSize.toFixed(2)})
              </label>
              <InfoTooltip
                content="Controls the perceived coarseness of the grain texture from fine to chunky."
                ariaLabel="Learn about grain size"
              />
            </div>
            <p className="control-helper">
              Match grain scale to your footage resolution.
            </p>
            <input
              id="grain-size"
              type="range"
              min="0.5"
              max="4"
              step="0.1"
              value={params.grainSize}
              onChange={handleRange('grainSize')}
            />
          </div>

          <div className="control-stack">
            <div className="control-label-row">
              <label htmlFor="edge-vignette">
                Edge Vignette ({params.vignette.toFixed(2)})
              </label>
              <InfoTooltip
                content="Darkens the frame perimeter to keep focus toward the center of the image."
                ariaLabel="Learn about edge vignette"
              />
            </div>
            <p className="control-helper">
              Subtle falloff grounds the image without hiding content.
            </p>
            <input
              id="edge-vignette"
              type="range"
              min="0"
              max="1.5"
              step="0.01"
              value={params.vignette}
              onChange={handleRange('vignette')}
            />
          </div>
        </div>

        {/* Color Bloom & Distortion */}
        <div className="control-group">
          <h2>Color Bloom &amp; Distortion</h2>

          <div className="control-stack">
            <div className="control-label-row">
              <label htmlFor="color-bloom-gate">Color Bloom Gate</label>
              <InfoTooltip
                content="Enables responsive bloom pulses that react to peaks in the signal."
                ariaLabel="Learn about color bloom gate"
              />
            </div>
            <p className="control-helper">
              Toggle to allow bloom flashes during high-energy moments.
            </p>
            <input
              id="color-bloom-gate"
              type="checkbox"
              checked={params.crimsonGate}
              onChange={(event) =>
                onParamChange({ crimsonGate: event.target.checked })
              }
            />
          </div>

          <div className="control-stack">
            <div className="control-label-row">
              <label htmlFor="color-bloom-amount">
                Bloom Intensity ({params.crimsonAmount.toFixed(2)})
              </label>
              <InfoTooltip
                content="Sets how strong the reactive color bloom appears when the gate is active."
                ariaLabel="Learn about bloom intensity"
              />
            </div>
            <p className="control-helper">
              Higher values push vibrant glow into highlights.
            </p>
            <input
              id="color-bloom-amount"
              type="range"
              min="0"
              max="1.2"
              step="0.01"
              value={params.crimsonAmount}
              onChange={handleRange('crimsonAmount')}
            />
          </div>

          <div className="control-stack">
            <div className="control-label-row">
              <label htmlFor="edge-split">
                Edge Color Split ({params.chromaAberration.toFixed(3)})
              </label>
              <InfoTooltip
                content="Offsets color channels at the frame edge for a stylised chromatic glitch."
                ariaLabel="Learn about edge color split"
              />
            </div>
            <p className="control-helper">
              Use lightly to keep subjects legible while adding motion energy.
            </p>
            <input
              id="edge-split"
              type="range"
              min="0"
              max="0.02"
              step="0.001"
              value={params.chromaAberration}
              onChange={handleRange('chromaAberration')}
            />
          </div>
        </div>

        {/* Guides */}
        <div className="control-group">
          <h2>Guides</h2>
          <div className="preset-buttons">
            {(['off', '16:9', '9:16', '4:5'] as SafeGuideMode[]).map((mode) => (
              <button
                key={mode}
                onClick={() => onSafeGuideChange(mode)}
                aria-pressed={mode === safeGuide}
              >
                {mode}
              </button>
            ))}
          </div>
          <PresetPanel onApply={onPreset} />
        </div>

        {/* Record */}
        <div className="control-group">
          <h2>Record</h2>

          <div className="record-panel">
            <div className="record-primary">
              <button
                className={`record-button record-${recordState}`}
                onClick={onRecordPrimaryAction}
                title="Start/Stop recording of the processed feed"
              >
                {recordState === 'idle' ? 'Start Recording' : 'Stop Recording'}
              </button>

              <div
                className="record-status"
                role="status"
                aria-live="polite"
                aria-atomic="true"
              >
                <span
                  className={`record-indicator ${
                    recordState !== 'idle' ? 'active' : ''
                  } ${recordState === 'paused' ? 'paused' : ''}`}
                  aria-hidden="true"
                />
                <span className="record-status-text">
                  {recordState === 'recording'
                    ? 'Recording'
                    : recordState === 'paused'
                    ? 'Paused'
                    : 'Idle'}
                </span>
              </div>

              <span className="record-timer" aria-hidden={recordState === 'idle'}>
                {formatDuration(elapsedTimeMs)}
              </span>

              <button
                className="record-pause"
                onClick={onRecordPauseToggle}
                disabled={recordState === 'idle'}
                aria-pressed={recordState === 'paused'}
                title={recordState === 'paused' ? 'Resume recording' : 'Pause recording'}
              >
                {recordState === 'paused' ? 'Resume' : 'Pause'}
              </button>
            </div>

            <div className="record-secondary">
              <button
                onClick={() => onSafeModeChange(!safeMode)}
                aria-pressed={safeMode}
                aria-label={
                  safeMode
                    ? 'Disable Safe Mode to restore full effect intensity'
                    : 'Enable Safe Mode to reduce intense visual effects'
                }
                title={
                  safeMode
                    ? 'Disable Safe Mode to restore full effect intensity'
                    : 'Enable Safe Mode to reduce intense visual effects'
                }
              >
                {safeMode ? 'Disable Safe Mode' : 'Enable Safe Mode'}
              </button>

              <div className="control-stack">
                <div className="control-label-row">
                  <label htmlFor="record-safe">Record Safe Override</label>
                  <InfoTooltip
                    content="Forces a conservative output profile when capturing, even if live mode is more intense."
                    ariaLabel="Learn about record safe override"
                  />
                </div>
                <input
                  id="record-safe"
                  type="checkbox"
                  checked={params.recordSafe}
                  onChange={(event) =>
                    onParamChange({ recordSafe: event.target.checked })
                  }
                />
              </div>

              <div className="control-stack">
                <div className="control-label-row">
                  <label htmlFor="freeze-frame">Freeze Frame (F)</label>
                  <InfoTooltip
                    content="Locks the current frame for still captures while keeping audio flowing."
                    ariaLabel="Learn about freeze frame"
                  />
                </div>
                <input
                  id="freeze-frame"
                  type="checkbox"
                  checked={params.freezeFrame}
                  onChange={(event) =>
                    onParamChange({ freezeFrame: event.target.checked })
                  }
                />
              </div>
            </div>
          </div>

          <p>
            Allow camera + microphone in browser or iframe using{' '}
            <code>allow="camera; microphone; autoplay"</code>. When the recorder is
            active, temporal jitter and glitches are softened automatically.
          </p>
        </div>
      </div>
    </div>
  );
};

export default Hud;
