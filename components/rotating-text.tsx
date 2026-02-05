"use client";

import { useState, useEffect } from "react";

interface RotatingTextProps {
  words: string[];
  interval?: number;
  className?: string;
  animationClassName?: string;
  minWidthCh?: number;
  paddingRightCh?: number;
}

export function RotatingText({
  words,
  interval = 3000,
  className = "",
  animationClassName = "animate-rotate-word",
  minWidthCh,
  paddingRightCh = 0,
}: RotatingTextProps) {
  const [index, setIndex] = useState(0);
  const longestWordLength = Math.max(0, ...words.map((w) => w.length));
  const minWidth = minWidthCh ?? longestWordLength;

  useEffect(() => {
    const timer = setInterval(() => {
      setIndex((prev) => (prev + 1) % words.length);
    }, interval);
    return () => clearInterval(timer);
  }, [words.length, interval]);

  return (
    <span
      key={words[index]}
      className={`inline-block text-center ${animationClassName} ${className}`}
      style={{ minWidth: `${minWidth}ch`, paddingRight: `${paddingRightCh}ch` }}
    >
      {words[index]}
    </span>
  );
}
