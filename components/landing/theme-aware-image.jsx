"use client";

import { useEffect, useState } from "react";
import { useTheme } from "@/components/theme-provider";

export default function ThemeAwareImage({
  alt,
  darkSrc,
  lightSrc,
  ...props
}) {
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const src = mounted && resolvedTheme === "dark" ? darkSrc : lightSrc;

  return (
    <img
      src={src}
      alt={alt}
      loading="lazy"
      decoding="async"
      {...props}
    />
  );
}
