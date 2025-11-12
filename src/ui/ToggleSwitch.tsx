import React from 'react';

interface ToggleSwitchProps {
  id: string;
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  description?: string;
  disabled?: boolean;
}

const ToggleSwitch: React.FC<ToggleSwitchProps> = ({
  id,
  label,
  checked,
  onChange,
  description,
  disabled
}) => {
  const descriptionId = description ? `${id}-description` : undefined;

  return (
    <div className="toggle">
      <input
        id={id}
        type="checkbox"
        role="switch"
        className="toggle-input"
        checked={checked}
        onChange={(event) => onChange(event.target.checked)}
        aria-describedby={descriptionId}
        disabled={disabled}
      />
      <label className="toggle-label" htmlFor={id}>
        <span className="toggle-track" aria-hidden="true">
          <span className="toggle-thumb" />
        </span>
        <span className="toggle-text">
          <span className="toggle-title">{label}</span>
          {description && (
            <span id={descriptionId} className="toggle-description">
              {description}
            </span>
          )}
        </span>
      </label>
    </div>
  );
};

export default ToggleSwitch;
