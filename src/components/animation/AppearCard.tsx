"use client";
import { useEffect, useRef, useState } from "react";

type AppearCardProps = {
  children: React.ReactNode;
  className?: string;
  delayMs?: number;
};

export default function AppearCard({ children, className = "", delayMs = 0 }: AppearCardProps) {
  const [visible, setVisible] = useState(false);
  const ref = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            setVisible(true);
            obs.disconnect();
          }
        });
      },
      { threshold: 0.15 }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      style={{ transitionDelay: `${delayMs}ms` }}
      className={
        `transform transition-all duration-700 ease-out ` +
        (visible ? `opacity-100 translate-y-0` : `opacity-0 translate-y-4`) +
        ` ` +
        className
      }
    >
      {children}
    </div>
  );
}
