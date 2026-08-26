'use client';

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
}

export function PortraitFrame({
  src,
  alt,
  ratio = '3/4',
  priority = false,
  className = '',
}: PortraitFrameProps) {
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
