import React from 'react';

export type SafeGuideMode = 'off' | '16:9' | '9:16' | '4:5';

interface SafeGuidesProps {
  mode: SafeGuideMode;
}

const ratios: Record<Exclude<SafeGuideMode, 'off'>, number> = {
  '16:9': 16 / 9,
  '9:16': 9 / 16,
  '4:5': 4 / 5
};

export const SafeGuides: React.FC<SafeGuidesProps> = ({ mode }) => {
  if (mode === 'off') return null;
  const ratio = ratios[mode];
  const viewBoxWidth = ratio >= 1 ? ratio * 100 : 100;
  const viewBoxHeight = ratio >= 1 ? 100 : (1 / ratio) * 100;

  return (
    <div className="safe-guides">
      <svg viewBox={`0 0 ${viewBoxWidth} ${viewBoxHeight}`} preserveAspectRatio="xMidYMid meet">
        <rect
          x="0"
          y="0"
          width={viewBoxWidth}
          height={viewBoxHeight}
          fill="none"
          stroke="rgba(255,255,255,0.25)"
          strokeWidth="0.6"
        />
        <line
          x1="0"
          y1={viewBoxHeight / 3}
          x2={viewBoxWidth}
          y2={viewBoxHeight / 3}
          stroke="rgba(255,255,255,0.15)"
          strokeWidth="0.4"
        />
        <line
          x1="0"
          y1={(viewBoxHeight / 3) * 2}
          x2={viewBoxWidth}
          y2={(viewBoxHeight / 3) * 2}
          stroke="rgba(255,255,255,0.15)"
          strokeWidth="0.4"
        />
        <line
          x1={viewBoxWidth / 3}
          y1="0"
          x2={viewBoxWidth / 3}
          y2={viewBoxHeight}
          stroke="rgba(255,255,255,0.15)"
          strokeWidth="0.4"
        />
        <line
          x1={(viewBoxWidth / 3) * 2}
          y1="0"
          x2={(viewBoxWidth / 3) * 2}
          y2={viewBoxHeight}
          stroke="rgba(255,255,255,0.15)"
          strokeWidth="0.4"
        />
      </svg>
    </div>
  );
};

export default SafeGuides;
