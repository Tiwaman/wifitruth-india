import { WifiArcsShape } from "@/components/WifiArcs";

/** Hand-authored hero artwork: layered mountains, sun, sea, palm beach, dotted route with paper plane, pin and wifi arcs. */
export function Scenery({ className = "" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 1440 600"
      preserveAspectRatio="xMaxYMax slice"
      className={className}
      aria-hidden="true"
      focusable="false"
    >
      <defs>
        <radialGradient id="sc-sun" cx="0.5" cy="0.5" r="0.5">
          <stop offset="0" stopColor="#ffe3a1" stopOpacity="0.95" />
          <stop offset="1" stopColor="#ffb457" stopOpacity="0" />
        </radialGradient>
        <linearGradient id="sc-sea" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#0f7e8d" />
          <stop offset="1" stopColor="#073b46" />
        </linearGradient>
      </defs>

      <ellipse cx="300" cy="110" rx="110" ry="22" fill="#fff" opacity="0.1" />
      <ellipse cx="380" cy="128" rx="70" ry="14" fill="#fff" opacity="0.08" />
      <ellipse cx="1260" cy="90" rx="90" ry="16" fill="#fff" opacity="0.1" />

      <g className="anim-sun">
        <circle cx="990" cy="340" r="190" fill="url(#sc-sun)" />
      </g>
      <circle cx="990" cy="340" r="62" fill="#ffd98a" />
      <circle cx="990" cy="340" r="62" fill="#ff9a5c" opacity="0.25" />

      <path
        d="M0 600V390L110 310 200 360 330 250 450 350 560 295 690 385 810 335 940 430 1060 400V600Z"
        fill="#0d6473"
        opacity="0.55"
      />
      <path d="M0 600V460L140 385 260 445 400 360 540 455 680 405 820 480 960 450 1100 480V600Z" fill="#0a4f5c" opacity="0.9" />
      <path d="M330 250 290 280 330 268 360 285ZM560 295 530 318 560 308 590 322Z" fill="#fff" opacity="0.35" />

      <path d="M600 470H1440V600H600Z" fill="url(#sc-sea)" />
      <g stroke="#ffd98a" strokeLinecap="round" strokeWidth="3" opacity="0.55">
        <path d="M950 488h80M930 505h120M915 524h150M935 545h110" />
      </g>
      <g stroke="#7fd0da" strokeLinecap="round" strokeWidth="2" opacity="0.35" fill="none">
        <path d="M640 520q18-8 36 0t36 0M1180 540q18-8 36 0t36 0M760 572q18-8 36 0t36 0" />
      </g>

      <path d="M0 600V505C110 470 250 495 370 538 470 572 560 584 650 600Z" fill="#04242c" />

      <path d="M1160 600C1190 548 1300 510 1440 505V600Z" fill="#f0d6a2" />
      <path d="M1160 600C1190 556 1300 528 1440 524V600Z" fill="#e7bf80" opacity="0.7" />

      <g fill="#04242c" stroke="#04242c">
        <path d="M1338 548C1336 500 1342 450 1362 398" fill="none" strokeWidth="9" strokeLinecap="round" />
        <g transform="translate(1362 398)" stroke="none">
          <path d="M0 0C-26-30-70-30-96-6 -62-22-28-18 0 0Z" />
          <path d="M0 0C-14-40-52-60-92-46 -52-46-22-30 0 0Z" />
          <path d="M0 0C20-38 60-52 100-34 62-36 28-26 0 0Z" />
          <path d="M0 0C32-20 76-14 98 12 66-4 30-6 0 0Z" />
          <path d="M0 0C-6-18-4-44 6-60 6-38 4-18 0 0Z" />
        </g>
        <path d="M1232 560C1232 530 1240 500 1254 474" fill="none" strokeWidth="6" strokeLinecap="round" />
        <g transform="translate(1254 474) scale(0.62)" stroke="none">
          <path d="M0 0C-26-30-70-30-96-6 -62-22-28-18 0 0Z" />
          <path d="M0 0C20-38 60-52 100-34 62-36 28-26 0 0Z" />
          <path d="M0 0C32-20 76-14 98 12 66-4 30-6 0 0Z" />
        </g>
      </g>

      <path
        d="M760 330C880 150 1040 200 1115 395"
        fill="none"
        stroke="#fff"
        strokeOpacity="0.8"
        strokeWidth="3.5"
        strokeLinecap="round"
        strokeDasharray="2 12"
      />
      <g transform="translate(925 176) rotate(14)">
        <g className="anim-plane">
          <path d="M0 0 46-16 28 18 20 6Z" fill="#fffdf9" />
          <path d="M20 6 46-16 14-2Z" fill="#d5f0f3" />
        </g>
      </g>

      <WifiArcsShape cx={1115} cy={352} r={20} stroke="#ffd98a" width={5} />
      <ellipse cx="1115" cy="424" rx="22" ry="6" fill="#04242c" opacity="0.35" />
      <g className="anim-pin">
        <path d="M1115 418c-20-17-26-28-26-40a26 26 0 0 1 52 0c0 12-6 23-26 40Z" fill="#ff6b4a" />
        <circle cx="1115" cy="378" r="10" fill="#fffdf9" />
      </g>
    </svg>
  );
}

/** Lighter artwork for page banners. */
export function SceneryBanner({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 1440 240" preserveAspectRatio="xMaxYMax slice" className={className} aria-hidden="true" focusable="false">
      <circle cx="1120" cy="120" r="46" fill="#ffd98a" opacity="0.9" />
      <circle cx="1120" cy="120" r="110" fill="#ffb457" opacity="0.12" />
      <path d="M0 240V150L120 90 230 140 360 60 480 135 600 95 730 160 860 110 990 170 1120 130 1260 175 1440 120V240Z" fill="#0d6473" opacity="0.6" />
      <path d="M0 240V190L150 140 280 185 420 130 560 188 700 150 850 200 1000 170 1160 205 1300 175 1440 200V240Z" fill="#073b46" opacity="0.95" />
      <g stroke="#7fd0da" strokeLinecap="round" strokeWidth="2" opacity="0.4" fill="none">
        <path d="M980 214q18-8 36 0t36 0M1180 224q18-8 36 0t36 0" />
      </g>
      <WifiArcsShape cx={1290} cy={74} r={12} stroke="#ffd98a" width={4} />
    </svg>
  );
}
