"use client";

import * as React from "react";
import { gsap } from "gsap";

import styles from "./parallax-doodles.module.css";

const PARALLAX_START_OFFSET = 800;

const DOODLES = {
  dashboard: [
    {
      className: styles.dashboardCustom,
      drift: -12,
      rotate: 6,
      src: "/dashboardcustom.svg",
      speed: 0.16,
      startOffset: 200,
      type: "dashboardcustom",
    },
  ],
  process: [
    {
      className: styles.processFootprint,
      drift: 18,
      rotate: 12,
      src: "/footprint.svg",
      speed: 0.18,
      startOffset: 200,
      type: "footprint",
    },
  ],
  pricing: [
    {
      className: styles.pricingCreditCard,
      drift: 8,
      rotate: 7,
      src: "/credit_card.svg",
      speed: 0.14,
      startOffset: 200,
      type: "credit-card",
    },
  ],
};

function DoodleShape({ className, drift, rotate, speed, src, startOffset }) {
  return (
    <img
      alt=""
      className={`${styles.doodle} ${className}`}
      data-drift={drift}
      data-parallax-doodle="true"
      data-rotate={rotate}
      data-speed={speed}
      data-start-offset={startOffset}
      decoding="async"
      draggable={false}
      loading="lazy"
      src={src}
    />
  );
}

export default function LandingParallaxDoodles({ variant }) {
  const rootRef = React.useRef(null);
  const doodles = DOODLES[variant] ?? [];

  React.useEffect(() => {
    const root = rootRef.current;

    if (!root) {
      return undefined;
    }

    const section = root.parentElement ?? root;
    const reduceMotionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    const nodes = Array.from(root.querySelectorAll("[data-parallax-doodle]"));

    if (reduceMotionQuery.matches) {
      gsap.set(nodes, { rotation: 0, y: 0 });
      return undefined;
    }

    gsap.set(nodes, {
      force3D: true,
      transformOrigin: "50% 50%",
    });

    const transforms = nodes.map((node) => ({
      node,
      rotationTo: gsap.quickTo(node, "rotation", { duration: 0.9, ease: "power3.out" }),
      yTo: gsap.quickTo(node, "y", { duration: 0.75, ease: "power3.out" }),
    }));

    function handleScroll() {
      const rect = section.getBoundingClientRect();
      const sectionCenter = rect.top + rect.height / 2;
      const viewportCenter = window.innerHeight / 2;
      const scrollDelta = viewportCenter - sectionCenter;

      transforms.forEach(({ node, rotationTo, yTo }) => {
        const speed = Number(node.dataset.speed ?? 0.15);
        const drift = Number(node.dataset.drift ?? 0);
        const rotate = Number(node.dataset.rotate ?? 0);
        const startOffset = Number(node.dataset.startOffset ?? PARALLAX_START_OFFSET);
        const delayedDelta =
          Math.sign(scrollDelta) * Math.max(0, Math.abs(scrollDelta) - startOffset);

        yTo(delayedDelta * speed + drift);
        rotationTo(rotate + delayedDelta * speed * 0.025);
      });
    }

    handleScroll();
    gsap.ticker.add(handleScroll);

    return () => {
      gsap.ticker.remove(handleScroll);
      transforms.forEach(({ rotationTo, yTo }) => {
        rotationTo.tween.kill();
        yTo.tween.kill();
      });
    };
  }, [variant]);

  if (!doodles.length) {
    return null;
  }

  return (
    <div
      className={styles.doodles}
      data-landing-parallax-doodles="true"
      ref={rootRef}
      aria-hidden="true"
    >
      {doodles.map((doodle) => (
        <DoodleShape key={`${variant}-${doodle.type}`} {...doodle} />
      ))}
    </div>
  );
}
