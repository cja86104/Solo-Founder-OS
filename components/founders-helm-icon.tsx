import { cn } from "@/lib/utils";

interface FoundersHelmIconProps {
  className?: string;
}

export function FoundersHelmIcon({ className }: FoundersHelmIconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={cn("h-5 w-5", className)}
    >
      {/* Outer wheel */}
      <circle cx="12" cy="12" r="9" />
      {/* Hub */}
      <circle cx="12" cy="12" r="2.5" />
      {/* 6 spokes */}
      <line x1="12" y1="3" x2="12" y2="9.5" />
      <line x1="12" y1="14.5" x2="12" y2="21" />
      <line x1="19.79" y1="7.5" x2="14.17" y2="10.75" />
      <line x1="9.83" y1="13.25" x2="4.21" y2="16.5" />
      <line x1="4.21" y1="7.5" x2="9.83" y2="10.75" />
      <line x1="14.17" y1="13.25" x2="19.79" y2="16.5" />
      {/* Handle pegs */}
      <circle cx="12" cy="3" r="1" fill="currentColor" strokeWidth="0" />
      <circle cx="12" cy="21" r="1" fill="currentColor" strokeWidth="0" />
      <circle cx="19.79" cy="7.5" r="1" fill="currentColor" strokeWidth="0" />
      <circle cx="4.21" cy="7.5" r="1" fill="currentColor" strokeWidth="0" />
      <circle cx="19.79" cy="16.5" r="1" fill="currentColor" strokeWidth="0" />
      <circle cx="4.21" cy="16.5" r="1" fill="currentColor" strokeWidth="0" />
    </svg>
  );
}
