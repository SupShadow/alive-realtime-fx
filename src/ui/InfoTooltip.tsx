import React, { PropsWithChildren, useId, useState } from 'react';

interface InfoTooltipProps {
  content: React.ReactNode;
  className?: string;
  ariaLabel?: string;
}

const InfoTooltip: React.FC<PropsWithChildren<InfoTooltipProps>> = ({
  content,
  className,
  ariaLabel = 'More details'
}) => {
  const tooltipId = useId();
  const [open, setOpen] = useState(false);

  const show = () => setOpen(true);
  const hide = () => setOpen(false);
  const toggle = () => setOpen((value) => !value);

  return (
    <span className={`info-tooltip ${className ?? ''}`}>
      <button
        type="button"
        className="info-tooltip__trigger"
        aria-label={ariaLabel}
        aria-expanded={open}
        aria-controls={tooltipId}
        onClick={toggle}
        onFocus={show}
        onBlur={hide}
        onMouseEnter={show}
        onMouseLeave={hide}
      >
        <span aria-hidden="true">?</span>
      </button>
      <span
        role="tooltip"
        id={tooltipId}
        className={`info-tooltip__bubble ${open ? 'is-visible' : ''}`}
      >
        {content}
      </span>
    </span>
  );
};

export default InfoTooltip;
