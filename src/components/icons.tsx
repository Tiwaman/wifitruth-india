import type { SVGProps } from "react";

type P = SVGProps<SVGSVGElement>;

function Base({ children, ...p }: P) {
  return (
    <svg
      viewBox="0 0 24 24"
      width="1em"
      height="1em"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
      {...p}
    >
      {children}
    </svg>
  );
}

export const WifiIcon = (p: P) => (
  <Base {...p}>
    <path d="M2.5 9a15 15 0 0 1 19 0" />
    <path d="M5.8 12.5a10 10 0 0 1 12.4 0" />
    <path d="M9 16a5 5 0 0 1 6 0" />
    <circle cx="12" cy="19.4" r="1" fill="currentColor" />
  </Base>
);
export const PinIcon = (p: P) => (
  <Base {...p}>
    <path d="M12 21s7-6.2 7-11.5A7 7 0 0 0 5 9.5C5 14.8 12 21 12 21Z" />
    <circle cx="12" cy="9.5" r="2.5" />
  </Base>
);
export const SearchIcon = (p: P) => (
  <Base {...p}>
    <circle cx="11" cy="11" r="6.5" />
    <path d="m20 20-4.2-4.2" />
  </Base>
);
export const PlaneIcon = (p: P) => (
  <Base {...p}>
    <path d="M21.5 3 2.5 10.6l6.8 2.6 2.6 6.8L21.5 3Z" />
    <path d="M9.3 13.2 21.5 3" />
  </Base>
);
export const MenuIcon = (p: P) => (
  <Base {...p}>
    <path d="M4 7h16M4 12h16M4 17h16" />
  </Base>
);
export const CloseIcon = (p: P) => (
  <Base {...p}>
    <path d="m6 6 12 12M18 6 6 18" />
  </Base>
);
export const CheckIcon = (p: P) => (
  <Base {...p}>
    <path d="m5 12.5 4.5 4.5L19 7.5" />
  </Base>
);
export const LockIcon = (p: P) => (
  <Base {...p}>
    <rect x="5" y="10.5" width="14" height="9.5" rx="2.5" />
    <path d="M8.5 10.5V8a3.5 3.5 0 0 1 7 0v2.5" />
  </Base>
);
export const ClockIcon = (p: P) => (
  <Base {...p}>
    <circle cx="12" cy="12" r="8.5" />
    <path d="M12 7.5V12l3 2" />
  </Base>
);
export const ArrowRightIcon = (p: P) => (
  <Base {...p}>
    <path d="M5 12h14M13 6l6 6-6 6" />
  </Base>
);
export const ArrowLeftIcon = (p: P) => (
  <Base {...p}>
    <path d="M19 12H5M11 6l-6 6 6 6" />
  </Base>
);
export const ShieldIcon = (p: P) => (
  <Base {...p}>
    <path d="M12 3 4.5 6v5.5c0 4.5 3.1 8 7.5 9.5 4.4-1.5 7.5-5 7.5-9.5V6L12 3Z" />
    <path d="m9 12 2.2 2.2L15.5 10" />
  </Base>
);
export const UsersIcon = (p: P) => (
  <Base {...p}>
    <circle cx="9" cy="8.5" r="3.2" />
    <path d="M3 19.5c.6-3.3 3-5 6-5s5.4 1.7 6 5" />
    <path d="M16 5.6a3.1 3.1 0 0 1 0 5.8M18 14.8c1.7.6 2.7 2.2 3 4.7" />
  </Base>
);
export const SatelliteIcon = (p: P) => (
  <Base {...p}>
    <circle cx="12" cy="12" r="3" />
    <path d="M12 2v3M12 19v3M2 12h3M19 12h3" />
    <circle cx="12" cy="12" r="7.5" strokeDasharray="2 3" />
  </Base>
);
export const EyeOffIcon = (p: P) => (
  <Base {...p}>
    <path d="M3 12s3.5-6 9-6 9 6 9 6-3.5 6-9 6-9-6-9-6Z" />
    <circle cx="12" cy="12" r="2.6" />
    <path d="m4 4 16 16" />
  </Base>
);
export const DownloadIcon = (p: P) => (
  <Base {...p}>
    <path d="M12 4v11M7 11l5 5 5-5M5 20h14" />
  </Base>
);
export const UploadIcon = (p: P) => (
  <Base {...p}>
    <path d="M12 16V5M7 9l5-5 5 5M5 20h14" />
  </Base>
);
export const PulseIcon = (p: P) => (
  <Base {...p}>
    <path d="M3 12h4l2.5-6 4 12 2.5-6H21" />
  </Base>
);
export const SparkIcon = (p: P) => (
  <Base {...p}>
    <path d="M12 3v4M12 17v4M3 12h4M17 12h4M6 6l2.5 2.5M15.5 15.5 18 18M18 6l-2.5 2.5M8.5 15.5 6 18" />
  </Base>
);
export const CrosshairIcon = (p: P) => (
  <Base {...p}>
    <circle cx="12" cy="12" r="7" />
    <circle cx="12" cy="12" r="1.5" fill="currentColor" />
    <path d="M12 2.5v4M12 17.5v4M2.5 12h4M17.5 12h4" />
  </Base>
);

/* Stay kinds */
export const HotelIcon = (p: P) => (
  <Base {...p}>
    <rect x="5" y="3.5" width="14" height="17" rx="2" />
    <path d="M9 8h1.5M13.5 8H15M9 12h1.5M13.5 12H15M10 20.5v-4h4v4" />
  </Base>
);
export const HostelIcon = (p: P) => (
  <Base {...p}>
    <path d="M4 20V4M20 20V4M4 9h16M4 15h16M4 20h16" />
    <path d="M7 9V7.5a1.5 1.5 0 0 1 3 0V9M14 15v-1.5a1.5 1.5 0 0 1 3 0V15" />
  </Base>
);
export const GuesthouseIcon = (p: P) => (
  <Base {...p}>
    <path d="M3.5 11 12 4l8.5 7" />
    <path d="M6 9.5V20h12V9.5" />
    <path d="M10 20v-5h4v5" />
  </Base>
);
export const HomestayIcon = (p: P) => (
  <Base {...p}>
    <path d="M3.5 11 12 4l8.5 7" />
    <path d="M6 9.5V20h12V9.5" />
    <path d="M12 16.6c-2.2-1.4-2.8-2.3-2.8-3.3a1.5 1.5 0 0 1 2.8-.6 1.5 1.5 0 0 1 2.8.6c0 1-.6 1.9-2.8 3.3Z" />
  </Base>
);
export const ResortIcon = (p: P) => (
  <Base {...p}>
    <path d="M12 21V9.5" />
    <path d="M12 9.5c-1-3-4-4.2-7-3.6 2.2.3 4 1.2 5 3.2M12 9.5c1-3 4-4.2 7-3.6-2.2.3-4 1.2-5 3.2M12 9.5c-2-1-4.8-.5-6.5 1.6 2.4-.7 4.6-.5 6.5.4M12 9.5c2-1 4.8-.5 6.5 1.6-2.4-.7-4.6-.5-6.5.4" />
    <path d="M4 21h16" />
  </Base>
);
export const TentIcon = (p: P) => (
  <Base {...p}>
    <path d="M3 20 12 5l9 15H3Z" />
    <path d="M12 20v-6.5M9.5 20 12 14.5l2.5 5.5" />
  </Base>
);

/* Spots */
export const BellIcon = (p: P) => (
  <Base {...p}>
    <path d="M5 17.5h14M6.5 17.5a5.5 5.5 0 0 1 11 0M12 8.5V7M10.2 7h3.6" />
    <path d="M4 20.5h16" />
  </Base>
);
export const BedIcon = (p: P) => (
  <Base {...p}>
    <path d="M3.5 18.5V6M3.5 14h17v4.5M20.5 14v-2.5A2.5 2.5 0 0 0 18 9h-7v5" />
    <circle cx="7.3" cy="11" r="1.6" />
  </Base>
);
export const BunkIcon = (p: P) => (
  <Base {...p}>
    <path d="M5 21V3M19 21V3M5 8.5h14M5 15.5h14" />
    <path d="M8 8.5V7a1.2 1.2 0 0 1 2.4 0v1.5M13.5 15.5V14a1.2 1.2 0 0 1 2.4 0v1.5" />
  </Base>
);
export const SunIcon = (p: P) => (
  <Base {...p}>
    <circle cx="12" cy="12" r="4" />
    <path d="M12 3v2M12 19v2M3 12h2M19 12h2M5.6 5.6 7 7M17 17l1.4 1.4M18.4 5.6 17 7M7 17l-1.4 1.4" />
  </Base>
);
export const SofaIcon = (p: P) => (
  <Base {...p}>
    <path d="M5 11V8.5A2.5 2.5 0 0 1 7.5 6h9A2.5 2.5 0 0 1 19 8.5V11" />
    <path d="M3 13a2 2 0 0 1 4 0v1.5h10V13a2 2 0 0 1 4 0v4.5H3V13ZM6 17.5V20M18 17.5V20" />
  </Base>
);
export const DotsIcon = (p: P) => (
  <Base {...p}>
    <circle cx="6" cy="12" r="1.3" fill="currentColor" />
    <circle cx="12" cy="12" r="1.3" fill="currentColor" />
    <circle cx="18" cy="12" r="1.3" fill="currentColor" />
  </Base>
);
export const MapIcon = (p: P) => (
  <Base {...p}>
    <path d="M9 4 3.5 6v14L9 18l6 2 5.5-2V4L15 6 9 4Z" />
    <path d="M9 4v14M15 6v14" />
  </Base>
);
