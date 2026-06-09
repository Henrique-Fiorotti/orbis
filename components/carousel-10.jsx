"use client";

import * as React from "react";

import { getMarqueeInertiaFrame, normalizeMarqueeOffset } from "@/lib/marquee-inertia.mjs";

import styles from "./carousel-10.module.css";

const MIN_LOOP_ITEMS = 12;
const MARQUEE_GROUPS = [-1, 0, 1];

function FeatureCard({ item }) {
  return (
    <div className={styles.card}>
      <img
        alt=""
        className={styles.icon}
        src={item.icon}
        loading="lazy"
        decoding="async"
        draggable={false}
      />
      <p className={styles.title}>{item.title}</p>
      <p className={styles.description}>{item.desc}</p>
    </div>
  );
}

export default function SlideOpacity({ items = [] }) {
  const shellRef = React.useRef(null);
  const trackRef = React.useRef(null);
  const dragStateRef = React.useRef({
    lastTime: 0,
    lastX: 0,
    offset: 0,
    pointerId: null,
    startOffset: 0,
    startX: 0,
    velocity: 0,
  });
  const inertiaFrameRef = React.useRef(null);
  const inertiaTimestampRef = React.useRef(0);
  const loopWidthRef = React.useRef(0);
  const centerScaleFrameRef = React.useRef(null);
  const [isDragging, setIsDragging] = React.useState(false);
  const carouselItems = React.useMemo(() => {
    if (!items.length) return [];

    const repeats = Math.max(1, Math.ceil(MIN_LOOP_ITEMS / items.length));
    return Array.from({ length: repeats }, (_, repeatIndex) =>
      items.map((item, itemIndex) => ({
        ...item,
        carouselKey: `${repeatIndex}-${itemIndex}-${item.title}`,
      }))
    ).flat();
  }, [items]);

  const setDragOffset = React.useCallback((offset) => {
    const normalizedOffset = normalizeMarqueeOffset(offset, loopWidthRef.current);

    dragStateRef.current.offset = normalizedOffset;
    shellRef.current?.style.setProperty("--marquee-drag-offset", `${normalizedOffset}px`);
  }, []);

  const cancelInertia = React.useCallback(() => {
    if (inertiaFrameRef.current === null) {
      return;
    }

    window.cancelAnimationFrame(inertiaFrameRef.current);
    inertiaFrameRef.current = null;
  }, []);

  const runInertiaFrame = React.useCallback(
    (timestamp) => {
      const elapsedMs = inertiaTimestampRef.current ? timestamp - inertiaTimestampRef.current : 16;
      inertiaTimestampRef.current = timestamp;

      const nextFrame = getMarqueeInertiaFrame({
        elapsedMs,
        offset: dragStateRef.current.offset,
        velocity: dragStateRef.current.velocity,
      });

      setDragOffset(nextFrame.offset);
      dragStateRef.current.velocity = nextFrame.velocity;

      if (nextFrame.done) {
        inertiaFrameRef.current = null;
        return;
      }

      inertiaFrameRef.current = window.requestAnimationFrame(runInertiaFrame);
    },
    [setDragOffset]
  );

  const startInertia = React.useCallback(() => {
    cancelInertia();

    if (Math.abs(dragStateRef.current.velocity) <= 0.025) {
      return;
    }

    inertiaTimestampRef.current = 0;
    inertiaFrameRef.current = window.requestAnimationFrame(runInertiaFrame);
  }, [cancelInertia, runInertiaFrame]);

  const measureLoopWidth = React.useCallback(() => {
    const track = trackRef.current;

    if (!track) {
      return;
    }

    loopWidthRef.current = track.scrollWidth / MARQUEE_GROUPS.length;
    setDragOffset(dragStateRef.current.offset);
  }, [setDragOffset]);

  const updateCenterScale = React.useCallback(() => {
    const shell = shellRef.current;

    if (!shell) {
      return;
    }

    const shellRect = shell.getBoundingClientRect();
    const shellCenter = shellRect.left + shellRect.width / 2;
    const maxDistance = Math.max(shellRect.width / 2, 1);
    const marqueeItems = shell.querySelectorAll(`.${styles.marqueeItem}`);

    marqueeItems.forEach((item) => {
      const itemRect = item.getBoundingClientRect();
      const itemCenter = itemRect.left + itemRect.width / 2;
      const distanceRatio = Math.min(Math.abs(shellCenter - itemCenter) / maxDistance, 1);
      const prominence = 1 - distanceRatio;
      const scale = 1 + prominence * 0.12;

      item.style.setProperty("--center-card-scale", scale.toFixed(3));
      item.style.setProperty("--center-card-depth", String(Math.round(prominence * 100)));
    });

    centerScaleFrameRef.current = window.requestAnimationFrame(updateCenterScale);
  }, []);

  const handlePointerDown = React.useCallback((event) => {
    if (event.button !== undefined && event.button !== 0) {
      return;
    }

    const shell = shellRef.current;

    if (!shell) {
      return;
    }

    event.preventDefault();
    cancelInertia();
    shell.setPointerCapture?.(event.pointerId);
    dragStateRef.current.pointerId = event.pointerId;
    dragStateRef.current.startX = event.clientX;
    dragStateRef.current.startOffset = dragStateRef.current.offset;
    dragStateRef.current.lastX = event.clientX;
    dragStateRef.current.lastTime = event.timeStamp || performance.now();
    dragStateRef.current.velocity = 0;
    setIsDragging(true);
  }, [cancelInertia]);

  const handlePointerMove = React.useCallback(
    (event) => {
      const dragState = dragStateRef.current;

      if (dragState.pointerId !== event.pointerId) {
        return;
      }

      event.preventDefault();
      const currentTime = event.timeStamp || performance.now();
      const elapsedMs = Math.max(1, currentTime - dragState.lastTime);
      const deltaX = event.clientX - dragState.lastX;

      dragState.velocity = deltaX / elapsedMs;
      dragState.lastX = event.clientX;
      dragState.lastTime = currentTime;
      setDragOffset(dragState.startOffset + event.clientX - dragState.startX);
    },
    [setDragOffset]
  );

  const finishPointerDrag = React.useCallback((event) => {
    const dragState = dragStateRef.current;

    if (dragState.pointerId !== event.pointerId) {
      return;
    }

    const shell = shellRef.current;

    if (shell?.hasPointerCapture?.(event.pointerId)) {
      shell.releasePointerCapture(event.pointerId);
    }

    dragState.pointerId = null;
    setIsDragging(false);
    startInertia();
  }, [startInertia]);

  React.useEffect(() => cancelInertia, [cancelInertia]);

  React.useEffect(() => {
    measureLoopWidth();

    if (typeof ResizeObserver === "undefined") {
      window.addEventListener("resize", measureLoopWidth);

      return () => {
        window.removeEventListener("resize", measureLoopWidth);
      };
    }

    const observer = new ResizeObserver(measureLoopWidth);

    if (trackRef.current) {
      observer.observe(trackRef.current);
    }

    return () => {
      observer.disconnect();
    };
  }, [measureLoopWidth, carouselItems.length]);

  React.useEffect(() => {
    centerScaleFrameRef.current = window.requestAnimationFrame(updateCenterScale);

    return () => {
      if (centerScaleFrameRef.current !== null) {
        window.cancelAnimationFrame(centerScaleFrameRef.current);
      }
    };
  }, [updateCenterScale, carouselItems.length]);

  if (!carouselItems.length) {
    return null;
  }

  /* Para adicionar cards va para translations.js */

  return (
    <div
      ref={shellRef}
      className={[styles.marqueeShell, isDragging ? styles.isDragging : ""].filter(Boolean).join(" ")}
      role="region"
      aria-label="Recursos Orbis"
      aria-roledescription="carousel"
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={finishPointerDrag}
      onPointerCancel={finishPointerDrag}
    >
      <div className={styles.marqueeTrack} ref={trackRef}>
        {MARQUEE_GROUPS.map((groupIndex) => (
          <div
            className={styles.marqueeGroup}
            aria-hidden={groupIndex === 0 ? undefined : "true"}
            key={groupIndex}
          >
            {carouselItems.map((item) => (
              <div
                className={styles.marqueeItem}
                role={groupIndex === 0 ? "group" : undefined}
                aria-roledescription={groupIndex === 0 ? "slide" : undefined}
                key={`${groupIndex}-${item.carouselKey}`}
              >
                <FeatureCard item={item} />
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
