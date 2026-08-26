'use client';

import { useState } from 'react';
import Image from 'next/image';

const RATIO_CLASS = {
  '3/4': 'aspect-[3/4]',
  '2/3': 'aspect-[2/3]',
} as const;

interface PortraitFrameProps {
  src: string;
  alt: string;
  ratio?: keyof typeof RATIO_CLASS;
  priority?: boolean;
  className?: string;
  /** When true, container adapts to the uploaded image's natural ratio (clamped to portrait). */
  adaptive?: boolean;
}

export function PortraitFrame({
  src,
  alt,
  ratio = '3/4',
  priority = false,
  className = '',
  adaptive = true,
}: PortraitFrameProps) {
  const [naturalRatio, setNaturalRatio] = useState<string | null>(null);

  // Fixed frame: blurred backdrop + contained image
  if (!adaptive) {
    return (
      <div className={`relative w-full overflow-hidden ${RATIO_CLASS[ratio]} ${className}`}>
        <Image
          src={src}
          fill
          alt=""
          aria-hidden
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          className="scale-110 object-cover blur-2xl"
        />
        <Image
          src={src}
          fill
          alt={alt}
          priority={priority}
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          className="object-contain"
        />
      </div>
    );
  }

  // Adaptive: container follows image ratio, clamped to portrait
  const handleLoad: React.ReactEventHandler<HTMLImageElement> = (e) => {
    const img = e.currentTarget;
    const w = img.naturalWidth;
    const h = img.naturalHeight;
    if (!w || !h) return;
    if (w > h) setNaturalRatio(ratio);
    else setNaturalRatio(`${w}/${h}`);
  };

  return (
    <div
      key={src}
      className={`relative w-full overflow-hidden ${className}`}
      style={{ aspectRatio: naturalRatio ?? ratio.replace('/', ' / ') }}
    >
      {/* Hidden probe to read natural dimensions; key remounts on src change so ratio resets */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={src}
        alt=""
        aria-hidden
        onLoad={handleLoad}
        className="pointer-events-none absolute h-0 w-0 opacity-0"
      />
      <Image
        src={src}
        fill
        alt={alt}
        priority={priority}
        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
        className="object-contain"
      />
    </div>
  );
}
