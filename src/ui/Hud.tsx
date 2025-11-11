import React, { ChangeEvent } from 'react';
import { RenderParams } from '../engine/renderGraph';
import PresetPanel from './PresetPanel';
import { SafeGuideMode } from './SafeGuides';

interface HudProps {
  params: RenderParams;
  onParamChange: (changes: Partial<RenderParams>) => void;
  onPreset: (params: Partial<RenderParams>) => void;
  onStartCamera: () => void;
  onStopCamera: () => void;
  onVideoFile: (file: File) => void;
  onAudioFile: (file: File) => void;
  onToggleRecord: () => void;
  isRecording: boolean;
  cameraActive: boolean;
  safeMode: boolean;
  onSafeModeChange: (value: boolean) => void;
  safeGuide: SafeGuideMode;
  onSafeGuideChange: (mode: SafeGuideMode) => void;
  envelope: { peak: number; rms: number };
  degradeStep: number;
}

const formatPercent = (value: number) => `${Math.round(value * 100)}%`;

export const Hud: React.FC<HudProps> = ({
  params,
  onParamChange,
  onPreset,
  onStartCamera,
  onStopCamera,
  onVideoFile,
  onAudioFile,
  onToggleRecord,
  isRecording,
  cameraActive,
  safeMode,
  onSafeModeChange,
  safeGuide,
  onSafeGuideChange,
  envelope,
  degradeStep
}) => {
  const handleRange = (key: keyof RenderParams) => (event: ChangeEvent<HTMLInputElement>) => {
    const value = Number(event.target.value);
    onParamChange({ [key]: value } as Partial<RenderParams>);
  };

  const handleFile = (handler: (file: File) => void) => (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) handler(file);
  };

  return (
    <div className="hud">
      <div className="hud-panel">
        <div className="control-group">
          <h2>Capture</h2>
          <div className="video-source-controls">
            <button onClick={onStartCamera}>Enable Camera</button>
            <button onClick={onStopCamera} disabled={!cameraActive}>
              Stop Camera
            </button>
            <div className="file-input">
              <label htmlFor="video-input">Load Video</label>
              <input id="video-input" type="file" accept="video/*" onChange={handleFile(onVideoFile)} />
            </div>
            <div className="file-input">
              <label htmlFor="audio-input">Load Audio</label>
              <input id="audio-input" type="file" accept="audio/*" onChange={handleFile(onAudioFile)} />
            </div>
          </div>
          <div className="status-row">
            <span className="badge">Peak {formatPercent(envelope.peak)}</span>
            <span className="badge">RMS {formatPercent(envelope.rms)}</span>
            <span className="badge">Degrade L{degradeStep}</span>
          </div>
        </div>
        <div className="control-group">
          <h2>Contrast</h2>
          <label>Contrast K ({params.contrastK.toFixed(2)})</label>
          <input type="range" min="1" max="12" step="0.1" value={params.contrastK} onChange={handleRange('contrastK')} />
          <label>Black Clamp ({params.blackClamp.toFixed(2)})</label>
          <input type="range" min="0" max="0.2" step="0.005" value={params.blackClamp} onChange={handleRange('blackClamp')} />
          <label>Gamma ({params.gammaOut.toFixed(2)})</label>
          <input type="range" min="0.5" max="2" step="0.01" value={params.gammaOut} onChange={handleRange('gammaOut')} />
        </div>
        <div className="control-group">
          <h2>Texture</h2>
          <label>Grain ({params.grainIntensity.toFixed(2)})</label>
          <input
            type="range"
            min="0"
            max="0.6"
            step="0.01"
            value={params.grainIntensity}
            onChange={handleRange('grainIntensity')}
          />
          <label>Grain Size ({params.grainSize.toFixed(2)})</label>
          <input type="range" min="0.5" max="4" step="0.1" value={params.grainSize} onChange={handleRange('grainSize')} />
          <label>Vignette ({params.vignette.toFixed(2)})</label>
          <input type="range" min="0" max="1.5" step="0.01" value={params.vignette} onChange={handleRange('vignette')} />
        </div>
        <div className="control-group">
          <h2>Crimson</h2>
          <label>Gate Enabled</label>
          <input
            type="checkbox"
            checked={params.crimsonGate}
            onChange={(event) => onParamChange({ crimsonGate: event.target.checked })}
          />
          <label>Intensity ({params.crimsonAmount.toFixed(2)})</label>
          <input
            type="range"
            min="0"
            max="1.2"
            step="0.01"
            value={params.crimsonAmount}
            onChange={handleRange('crimsonAmount')}
          />
          <label>Chroma Aberration ({params.chromaAberration.toFixed(3)})</label>
          <input
            type="range"
            min="0"
            max="0.02"
            step="0.001"
            value={params.chromaAberration}
            onChange={handleRange('chromaAberration')}
          />
        </div>
        <div className="control-group">
          <h2>Guides</h2>
          <div className="preset-buttons">
            {(['off', '16:9', '9:16', '4:5'] as SafeGuideMode[]).map((mode) => (
              <button key={mode} onClick={() => onSafeGuideChange(mode)} aria-pressed={mode === safeGuide}>
                {mode}
              </button>
            ))}
          </div>
          <PresetPanel onApply={onPreset} />
        </div>
        <div className="control-group">
          <h2>Record</h2>
          <div className="transport-bar">
            <button onClick={onToggleRecord}>{isRecording ? 'Stop' : 'Record'}</button>
            <button
              onClick={() => onSafeModeChange(!safeMode)}
              aria-pressed={safeMode}
              aria-label={
                safeMode
                  ? 'Disable Safe Mode to restore full effect intensity'
                  : 'Enable Safe Mode to reduce intense visual effects'
              }
            >
              {safeMode ? 'Disable Safe Mode' : 'Enable Safe Mode'}
            </button>
            <label>
              <input
                type="checkbox"
                checked={params.recordSafe}
                onChange={(event) => onParamChange({ recordSafe: event.target.checked })}
              />
              Record Safe Override
            </label>
            <label>
              <input
                type="checkbox"
                checked={params.freezeFrame}
                onChange={(event) => onParamChange({ freezeFrame: event.target.checked })}
              />
              Freeze Frame (F)
            </label>
          </div>
          <p>
            Allow camera + microphone in browser or iframe using <code>allow="camera; microphone; autoplay"</code>. When the recorder is active, temporal
            jitter and glitches are softened automatically.
          </p>
        </div>
      </div>
    </div>
  );
};

export default Hud;
