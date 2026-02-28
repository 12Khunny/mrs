import { useEffect, useState } from "react";

export default function AnimatedDots({
  text = "Detecting truck",
  className = "text-5xl font-semibold text-[var(--color-foreground)]",
}) {
  const [dots, setDots] = useState("");

  useEffect(() => {
    const interval = setInterval(() => {
      setDots((prev) => (prev.length >= 3 ? "" : prev + "."));
    }, 500);

    return () => clearInterval(interval);
  }, []);

  return (
    <span className={className}>
      {text}
      <span className="inline-block w-8 text-left">{dots}</span>
    </span>
  );
}
