import { useEffect, useState } from "react";

const MESSAGES = [
  "Free shipping · Softer hair and skin from your first shower · 60-day money-back guarantee",
];

export function AnnouncementBar() {
  const [idx, setIdx] = useState(0);
  useEffect(() => {
    const i = setInterval(() => setIdx((n) => (n + 1) % MESSAGES.length), 4500);
    return () => clearInterval(i);
  }, []);
  return (
    <div className="border-b border-border/60 bg-background">
      <div className="mx-auto flex h-8 max-w-[1400px] items-center justify-center px-4 text-[11px] tracking-wide text-foreground/80">
        <span key={idx} className="animate-in fade-in duration-500">{MESSAGES[idx]}</span>
      </div>
    </div>
  );
}
