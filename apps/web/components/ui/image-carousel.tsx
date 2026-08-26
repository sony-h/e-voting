'use client';

import { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { useReducedMotion } from 'motion/react';
import { PortraitFrame } from '@/components/ui/portrait-frame';

export interface CarouselImage {
  id: string;
  url: string;
  caption?: string | null;
}

interface ImageCarouselProps {
  images: CarouselImage[];
  ratio?: '3/4' | '2/3';
  /** Auto-advance interval in ms. When set, arrows are hidden and dots remain. */
  autoplayMs?: number;
  rounded?: 'none' | 'lg' | '2xl';
  altFallback?: string;
}

export function ImageCarousel({
  images,
  ratio = '3/4',
  autoplayMs,
  rounded = '2xl',
  altFallback = 'Gambar',
}: ImageCarouselProps) {
  const reduced = useReducedMotion();
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    if (!autoplayMs || images.length <= 1 || reduced || paused) return;
    const id = setInterval(() => setIndex((i) => (i + 1) % images.length), autoplayMs);
    return () => clearInterval(id);
  }, [autoplayMs, images.length, reduced, paused]);

  if (images.length === 0) return null;
  const current = images[index % images.length]!;
  const go = (dir: number) => setIndex((i) => (i + dir + images.length) % images.length);
  const manual = !autoplayMs;

  return (
    <div
      onMouseEnter={autoplayMs ? () => setPaused(true) : undefined}
      onMouseLeave={autoplayMs ? () => setPaused(false) : undefined}
      onTouchStart={autoplayMs ? () => setPaused(true) : undefined}
      onTouchEnd={autoplayMs ? () => setPaused(false) : undefined}
    >
      <div className="relative">
        <motion.div
          key={current.id}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.28 }}
        >
          <PortraitFrame
            src={current.url}
            alt={current.caption ?? altFallback}
            ratio={ratio}
            className={rounded === 'none' ? '' : rounded === 'lg' ? 'rounded-lg' : 'rounded-2xl'}
          />
        </motion.div>
        {current.caption && (
          <p className="absolute bottom-0 left-0 right-0 truncate bg-black/50 px-4 py-2 text-sm font-medium text-white">
            {current.caption}
          </p>
        )}
        {manual && images.length > 1 && (
          <>
            <button
              type="button"
              aria-label="Sebelumnya"
              onClick={() => go(-1)}
              className="absolute left-3 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full bg-black/40 text-lg text-white transition-colors hover:bg-black/60"
            >
              ‹
            </button>
            <button
              type="button"
              aria-label="Berikutnya"
              onClick={() => go(1)}
              className="absolute right-3 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full bg-black/40 text-lg text-white transition-colors hover:bg-black/60"
            >
              ›
            </button>
          </>
        )}
      </div>
      {images.length > 1 && (
        <div className="mt-3 flex justify-center gap-2">
          {images.map((img, i) => (
            <button
              key={img.id}
              type="button"
              aria-label={`Gambar ${i + 1}`}
              onClick={() => setIndex(i)}
              className={`h-2 rounded-full transition-all duration-200 ${
                i === index ? 'w-6 bg-primary' : 'w-2 bg-muted-foreground/30'
              }`}
            />
          ))}
        </div>
      )}
    </div>
  );
}
