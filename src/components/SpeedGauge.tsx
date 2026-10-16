const CX = 100;
const CY = 100;
const R = 78;
const START = 135;
const SWEEP = 270;

function point(deg: number) {
  const a = (deg * Math.PI) / 180;
  return `${(CX + R * Math.cos(a)).toFixed(2)} ${(CY + R * Math.sin(a)).toFixed(2)}`;
}
const ARC = `M ${point(START)} A ${R} ${R} 0 1 1 ${point(START + SWEEP)}`;

/** 270-degree gauge. Fill uses a square-root scale so 5 Mbps and 150 Mbps are both readable. */
export function SpeedGauge({
  value,
  running,
  percent,
  caption,
}: {
  value: number | undefined;
  running: boolean;
  percent: number;
  caption: string;
}) {
  const frac = value === undefined ? 0 : Math.min(1, Math.sqrt(Math.max(value, 0) / 200));
  return (
    <div className="relative mx-auto w-full max-w-[17rem]" data-testid="speed-gauge">
      <svg viewBox="0 0 200 170" className="w-full" aria-hidden="true" focusable="false">
        <defs>
          <linearGradient id="gauge-g" x1="0" y1="1" x2="1" y2="0">
            <stop offset="0" stopColor="#1796a8" />
            <stop offset="0.6" stopColor="#ffc65c" />
            <stop offset="1" stopColor="#ff6b4a" />
          </linearGradient>
        </defs>
        <path d={ARC} fill="none" stroke="#e6d9c5" strokeWidth="14" strokeLinecap="round" />
        {value !== undefined && (
          <path
            d={ARC}
            fill="none"
            stroke="url(#gauge-g)"
            strokeWidth="14"
            strokeLinecap="round"
            pathLength={100}
            strokeDasharray={`${Math.max(frac * 100, 1.5)} 100`}
            className="transition-[stroke-dasharray] duration-500 ease-out"
          />
        )}
        {running && value === undefined && (
          <g className="anim-scan">
            <path d={ARC} fill="none" stroke="#1796a8" strokeWidth="14" strokeLinecap="round" pathLength={100} strokeDasharray="12 100" />
          </g>
        )}
        <text x="22" y="160" fontSize="10" fill="#3d5258" textAnchor="middle">
          0
        </text>
        <text x="178" y="160" fontSize="10" fill="#3d5258" textAnchor="middle">
          200+
        </text>
      </svg>
      <div className="absolute inset-x-0 top-[34%] text-center">
        <p className="font-display text-5xl font-bold leading-none tabular-nums text-ocean-900" data-testid="gauge-value">
          {value === undefined ? "--" : value}
        </p>
        <p className="mt-1 text-sm font-semibold text-ink-soft">Mbps</p>
        <p className="mt-1 text-xs font-medium text-ink-soft">{caption}</p>
      </div>
      <div
        role="progressbar"
        aria-label="Speed test progress"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={running ? percent : 0}
        hidden={!running}
        className="mx-auto -mt-4 h-2 w-3/4 overflow-hidden rounded-full bg-sand-200"
      >
        <div className="h-full rounded-full bg-gradient-to-r from-ocean-500 to-amber-400 transition-all duration-300" style={{ width: `${Math.max(percent, 4)}%` }} />
      </div>
    </div>
  );
}
