import React from "react";

/** Lets the animation duration ride in as a CSS custom property without a cast. */
type MarqueeTrackStyle = React.CSSProperties & {
  "--helm-marquee-duration": string;
};

interface MarqueeProps {
  items: string[];
  duration?: number;
  reverse?: boolean;
  renderItem: (item: string, index: number) => React.ReactNode;
  ariaLabel?: string;
}

export default function Marquee({
  items,
  duration = 38,
  reverse = false,
  renderItem,
  ariaLabel,
}: MarqueeProps) {
  const doubled = [...items, ...items];
  const trackStyle: MarqueeTrackStyle = { "--helm-marquee-duration": `${duration}s` };

  return (
    <div className="helm-marquee relative w-full overflow-hidden" aria-label={ariaLabel} role="group">
      <div
        className="helm-marquee-track items-center"
        data-dir={reverse ? "reverse" : "forward"}
        style={trackStyle}
      >
        {doubled.map((item, i) => (
          <div key={`${item}-${i}`} aria-hidden={i >= items.length ? "true" : undefined} className="shrink-0">
            {renderItem(item, i)}
          </div>
        ))}
      </div>
      <div aria-hidden="true" className="pointer-events-none absolute inset-y-0 left-0 w-20 bg-gradient-to-r from-[#0A0A0A] to-transparent sm:w-40" />
      <div aria-hidden="true" className="pointer-events-none absolute inset-y-0 right-0 w-20 bg-gradient-to-l from-[#0A0A0A] to-transparent sm:w-40" />
    </div>
  );
}
