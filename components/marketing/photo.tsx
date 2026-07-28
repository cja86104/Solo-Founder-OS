import React from "react";
import type { PhotoAsset } from "@/lib/marketing/content";

interface PhotoProps {
  photo: PhotoAsset;
  slot: number;
  className?: string;
  imgClassName?: string;
  priority?: boolean;
  alt?: string;
  children?: React.ReactNode;
}

/**
 * Every photo goes through the same duotone grade so the set reads as one shoot.
 * Explicit width/height prevents layout shift; below-fold photos lazy-load.
 *
 * `alt` overrides the caption from content.ts — pass `alt=""` when the photo is
 * purely decorative (a section backdrop) so screen readers skip it instead of
 * announcing scenery mid-section. Nullish coalescing, so "" is honoured.
 *
 * Deliberately a plain <img>, not next/image: the duotone grade and the
 * ::before/::after overlays live on .helm-photo-wrap and depend on this exact
 * box model. Swapping in next/image changes the rendered markup and the
 * design here is locked.
 */
export default function Photo({
  photo,
  slot,
  className = "",
  imgClassName = "",
  priority = false,
  alt,
  children,
}: PhotoProps) {
  return (
    <div className={`helm-photo-wrap ${className}`}>
      <img
        data-aiwp-slot={slot}
        src={photo.src}
        alt={alt ?? photo.alt}
        width={photo.width}
        height={photo.height}
        loading={priority ? "eager" : "lazy"}
        decoding="async"
        className={`helm-duotone h-full w-full object-cover ${imgClassName}`}
      />
      {children}
    </div>
  );
}
