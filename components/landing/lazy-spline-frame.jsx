"use client";

import { useEffect, useRef, useState } from "react";
import { useTheme } from "next-themes";

function requestIdle(callback, timeout) {
  if (typeof window === "undefined") return 0;

  if ("requestIdleCallback" in window) {
    return window.requestIdleCallback(callback, { timeout });
  }

  return window.setTimeout(
    () =>
      callback({
        didTimeout: false,
        timeRemaining: () => 0,
      }),
    timeout,
  );
}

function cancelIdle(id) {
  if (typeof window === "undefined" || !id) return;

  if ("cancelIdleCallback" in window) {
    window.cancelIdleCallback(id);
    return;
  }

  window.clearTimeout(id);
}

export default function LazySplineFrame({
  className,
  frameClassName,
  overlayClassName,
  src,
  title,
  ...props
}) {
  const { resolvedTheme } = useTheme();
  const ref = useRef(null);
  const [loaded, setLoaded] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [shouldRender, setShouldRender] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    setLoaded(false);
  }, [resolvedTheme]);

  useEffect(() => {
    const node = ref.current;
    if (!mounted || !node) return;

    const connection = navigator.connection;
    const slowConnection =
      connection?.saveData || /2g/.test(connection?.effectiveType ?? "");

    let idleId = 0;
    let observer = null;

    const scheduleLoad = () => {
      if (idleId || shouldRender) return;

      idleId = requestIdle(
        () => {
          setShouldRender(true);
        },
        slowConnection ? 1800 : 600,
      );
    };

    if (typeof IntersectionObserver === "undefined") {
      scheduleLoad();
      return () => cancelIdle(idleId);
    }

    observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry?.isIntersecting) return;
        scheduleLoad();
        observer?.disconnect();
      },
      { rootMargin: slowConnection ? "0px" : "220px" },
    );

    observer.observe(node);

    return () => {
      observer?.disconnect();
      cancelIdle(idleId);
    };
  }, [mounted, shouldRender]);

  return (
    <div ref={ref} className={className} {...props}>
      {mounted && shouldRender ? (
        <iframe
          key={resolvedTheme ?? "system"}
          src={src}
          title={title}
          loading="lazy"
          frameBorder="0"
          referrerPolicy="strict-origin-when-cross-origin"
          className={frameClassName}
          style={{
            opacity: loaded ? 1 : 0,
            colorScheme: "light",
            background: "transparent",
          }}
          onLoad={() => setLoaded(true)}
        />
      ) : null}
      {overlayClassName ? <div className={overlayClassName} aria-hidden="true" /> : null}
    </div>
  );
}
