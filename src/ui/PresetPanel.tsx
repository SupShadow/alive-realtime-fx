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

export const PresetPanel: React.FC<PresetPanelProps> = ({ onApply }) => {
  return (
    <div className="preset-panel">
      <h2>Presets</h2>
      <div className="preset-buttons">
        {presets.map((preset) => (
          <button key={preset.name} onClick={() => onApply(preset.params)}>
            {preset.name}
          </button>
        ))}
      </div>
    </div>
  );
};

export default PresetPanel;
