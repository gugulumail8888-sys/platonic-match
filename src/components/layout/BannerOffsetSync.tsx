'use client';

import { useEffect, useRef } from 'react';

export function BannerOffsetSync({ children }: { children: React.ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const update = () => {
      document.body.style.setProperty('--banner-offset', `${el.offsetHeight}px`);
    };
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    window.addEventListener('resize', update);
    return () => {
      ro.disconnect();
      window.removeEventListener('resize', update);
    };
  }, []);

  return (
    <div ref={ref} className="fixed top-0 left-0 right-0 z-50 flex flex-col">
      {children}
    </div>
  );
}
