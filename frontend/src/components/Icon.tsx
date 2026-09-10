import type { ReactNode } from "react";

const paths = {
  dashboard: <><rect x="3" y="3" width="7" height="7" rx="1" /><rect x="14" y="3" width="7" height="4" rx="1" /><rect x="3" y="14" width="7" height="7" rx="1" /><rect x="14" y="11" width="7" height="10" rx="1" /></>,
  customers: <><circle cx="9" cy="8" r="3" /><path d="M3 21v-2a6 6 0 0 1 12 0v2M16 5a3 3 0 0 1 0 6m3 10v-2a6 6 0 0 0-2-4" /></>,
  approvals: <><path d="m12 3 8 3v6c0 5-8 9-8 9s-8-4-8-9V6l8-3Z" /><path d="m8 12 3 3 5-6" /></>,
  analytics: <><path d="M4 3v18h17M8 16v-4m5 4V7m5 9V4" /></>,
  exposure: <><rect x="3" y="5" width="18" height="15" rx="2" /><path d="M3 9h18m-5 5h5M7 5V3h10" /></>,
  risk: <><path d="m12 3 10 18H2L12 3Z" /><path d="M12 9v5m0 3v.1" /></>,
  pulse: <path d="M2 12h5l3-8 4 16 3-8h5" />,
  check: <path d="m5 12 4 4L19 6" />,
  performance: <><path d="m3 17 6-6 4 3 8-10m-6 0h6v6" /></>,
  refresh: <><path d="M20 8a8 8 0 1 0 0 8M20 3v5h-5" /></>,
  search: <><circle cx="10" cy="10" r="6" /><path d="m15 15 6 6" /></>,
  arrow: <path d="M4 12h16m-6-6 6 6-6 6" />,
  sent: <><path d="m21 3-7 18-4-7-7-4L21 3ZM10 14 21 3" /></>,
} satisfies Record<string, ReactNode>;

export type IconName = keyof typeof paths;
export function Icon({ name, className = "" }: { name: IconName; className?: string }) {
  return <svg className={`rr-icon ${className}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false">{paths[name]}</svg>;
}

export function ProductMark() {
  return <svg className="product-mark" viewBox="0 0 32 32" fill="none" aria-hidden="true" focusable="false">
    <path d="M6 8v16h20" stroke="currentColor" strokeOpacity=".45" strokeWidth="2" />
    <path d="m5 19 7-7 5 5L27 6m-7 0h7v7" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
  </svg>;
}
