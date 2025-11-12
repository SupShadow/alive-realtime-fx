import React, { useMemo } from 'react';

interface LevelMeterProps {
  label: string;
  peak: number;
  rms: number;
  secondaryLabel?: string;
  bars?: number;
}

const clamp = (value: number) => Math.max(0, Math.min(1, Number.isFinite(value) ? value : 0));

const LevelMeter: React.FC<LevelMeterProps> = React.memo(({ label, peak, rms, secondaryLabel, bars = 12 }) => {
  const thresholds = useMemo(() => Array.from({ length: bars }, (_, index) => (index + 1) / bars), [bars]);
  const peakLevel = clamp(peak);
  const rmsLevel = clamp(rms);
  const peakPercent = Math.round(peakLevel * 100);
  const rmsPercent = Math.round(rmsLevel * 100);

  return (
    <div className="level-meter" role="group" aria-label={label}>
      <div
        className="level-meter__bars"
        role="img"
        aria-label={`${label} peak ${peakPercent} percent, rms ${rmsPercent} percent`}
      >
        {thresholds.map((threshold, index) => {
          const hasRms = rmsLevel >= threshold;
          const hasPeak = peakLevel >= threshold;
          let barClass = 'level-meter__bar';
          if (hasPeak) {
            barClass += hasRms ? ' is-rms' : ' is-peak';
          } else if (hasRms) {
            barClass += ' is-rms';
          }
          return <span key={index} className={barClass} aria-hidden="true" />;
        })}
      </div>
      <div className="level-meter__legend">
        <span className="level-meter__label">{label}</span>
        {secondaryLabel && <span className="level-meter__value">{secondaryLabel}</span>}
      </div>
    </div>
  );
});

LevelMeter.displayName = 'LevelMeter';

export default LevelMeter;
