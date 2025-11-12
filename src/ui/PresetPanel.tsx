import React from 'react';
import neutralPreset from '../../presets/neutral.json';
import glitchLitePreset from '../../presets/glitch-lite.json';
import peakRitualPreset from '../../presets/peak-ritual.json';
import { RenderParams } from '../engine/renderGraph';

interface Preset {
  name: string;
  params: RenderParams;
}

interface PresetPanelProps {
  onApply: (params: Partial<RenderParams>) => void;
}

const presets: Preset[] = [neutralPreset as Preset, glitchLitePreset as Preset, peakRitualPreset as Preset];

const presetCopy: Record<
  string,
  {
    label: string;
    description: string;
  }
> = {
  Neutral: {
    label: 'Balanced Neutral',
    description: 'Even tone response with light grain and gentle color bloom.'
  },
  'Glitch-Lite': {
    label: 'Signal Drift',
    description: 'Reactive bloom and edge split tuned for upbeat edits.'
  },
  'Peak Ritual': {
    label: 'Peak Ritual',
    description: 'Maximum bloom glow with heavier grain and vignette falloff.'
  }
};

export const PresetPanel: React.FC<PresetPanelProps> = ({ onApply }) => {
  return (
    <div className="preset-panel">
      <h2>Presets</h2>
      <div className="preset-grid">
        {presets.map((preset) => {
          const copy = presetCopy[preset.name] ?? { label: preset.name, description: '' };
          return (
            <button
              key={preset.name}
              className="preset-card"
              onClick={() => onApply(preset.params)}
              title={copy.description || copy.label}
            >
              <span className="preset-card__title">{copy.label}</span>
              {copy.description && <span className="preset-card__description">{copy.description}</span>}
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default PresetPanel;
