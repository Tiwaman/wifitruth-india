/** Three radiating arcs (pulse via CSS; reduced motion shows them static). Draws inside an existing <svg>. */
export function WifiArcsShape({
  cx,
  cy,
  r = 30,
  stroke = "#ffffff",
  width = 4,
}: {
  cx: number;
  cy: number;
  r?: number;
  stroke?: string;
  width?: number;
}) {
  const arc = (k: number) => {
    const rr = r * k;
    const a = (50 * Math.PI) / 180;
    const dx = Math.sin(a) * rr;
    const dy = Math.cos(a) * rr;
    return `M ${cx - dx} ${cy - dy} A ${rr} ${rr} 0 0 1 ${cx + dx} ${cy - dy}`;
  };
  return (
    <g fill="none" stroke={stroke} strokeWidth={width} strokeLinecap="round">
      <path className="arc-1" d={arc(1)} />
      <path className="arc-2" d={arc(1.7)} />
      <path className="arc-3" d={arc(2.4)} />
    </g>
  );
}

export function WifiArcs({ className = "h-24 w-24", stroke = "#ffffff" }: { className?: string; stroke?: string }) {
  return (
    <svg viewBox="0 0 100 100" className={className} aria-hidden="true" focusable="false">
      <WifiArcsShape cx={50} cy={78} r={14} stroke={stroke} width={5} />
      <circle cx={50} cy={78} r={5} fill={stroke} />
    </svg>
  );
}
