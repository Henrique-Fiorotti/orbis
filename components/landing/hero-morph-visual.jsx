"use client";

import * as React from "react";
import { gsap } from "gsap";
import { MorphSVGPlugin } from "gsap/MorphSVGPlugin";

gsap.registerPlugin(MorphSVGPlugin);

export const HERO_MORPH_SHAPES = [
  {
    src: "/shields.svg",
    fallback:
      "M480-81q-140-35-230-162.5T160-523v-238l320-120 320 120v238q0 152-90 279.5T480-81Z",
  },
  {
    src: "/automation.svg",
    fallback:
      "M283-272q-40 34-83.5 30.5T124-272q-32-27-42.5-69.5T98-429l82-137q-27-21-43-52.5T121-687q0-64 45-109t109-45q64 0 109 45t45 109q0 64-45 109t-109 45q-11 0-21.5-1.5T233-539l-84 141q-14 23-9 45t22 36q17 14 39.5 15.5T244-317l433-372q40-34 84-31t76 30q32 27 42.5 70T863-532l-81 137q27 21 43 52.5t16 68.5q0 64-45.5 109T686-120q-64 0-108.5-45T533-274q0-64 44.5-109T686-428q11 0 21 1t20 4l84-140q14-23 9-45t-22-36q-17-14-39.5-15.5T716-644L283-272Z",
  },
  {
    src: "/dashboardgear.svg",
    fallback:
      "M450-510v-290h430v290H450ZM80-160v-290h390v290H80Zm0-350v-290h310v290H80ZM700-63l-5-48q-21-6-40-17t-35-26l-42 20-35-54 38-30q-6-20-6-41.5t6-41.5l-38-30 35-55 42 20q17-14 35.5-25t39.5-17l5-49h60l6 49q21 6 39.5 17t35.5 25l42-20 35 55-38 30q6 20 6 41.5t-6 41.5l38 30-35 54-42-20q-16 15-35 26t-40 17l-6 48h-60Zm102-125q30-30 30-72t-30-72q-30-30-72-30t-72 30q-30 30-30 72t30 72q30 30 72 30t72-30Z",
  },
  {
    src: "/score.svg",
    fallback:
      "M295-119q-36-1-68.5-18.5T165-189q-40-48-62.5-114.5T80-440q0-83 31.5-156T197-723q54-54 127-85.5T480-840q83 0 156 31.5T763-722q54 55 85.5 129T880-434q0 75-24 142t-69 113q-29 30-60.5 45T662-119q-18 0-36-4.5T590-137l-56-28q-13-7-26.5-10t-27.5-3q-14 0-27.5 3T426-165l-56 28q-19 10-37.5 14.5T295-119Zm234.5-271.5Q550-411 550-440q0-8-1.5-16t-5.5-15l64-82q12 14 21 29.5t14 33.5h62q-18-79-80.5-129.5T480-670q-81 0-144 50.5T256-490h62q17-54 61.5-87T480-610q21 0 41.5 5t38.5 15l-64 82q-4-1-8-1.5t-8-.5q-29 0-49.5 20.5T410-440q0 29 20.5 49.5T480-370q29 0 49.5-20.5Z",
  },
  {
    src: "/orb-ia.svg",
    fallback:
      "M480-120q-72 0-134-27.5T238-238q-43-43-70.5-105T140-480q0-72 27.5-134T238-722q43-43 105-70.5T480-820q72 0 134 27.5T722-722q43 43 70.5 105T820-480q0 72-27.5 134T722-238q-43 43-105 70.5T480-120Zm0-110q76 0 128-52t52-128q0-76-52-128t-128-52q-76 0-128 52t-52 128q0 76 52 128t128 52Zm0-150q47 0 81.5-28.5T606-480q-10-43-44.5-71.5T480-580q-47 0-81.5 28.5T354-480q10 43 44.5 71.5T480-380Z",
  },
];

const useIsomorphicLayoutEffect =
  typeof window !== "undefined" ? React.useLayoutEffect : React.useEffect;

async function loadSvgPath({ src, fallback }) {
  try {
    const response = await fetch(src);
    const svgText = await response.text();
    const svg = new DOMParser().parseFromString(svgText, "image/svg+xml");
    const path = svg.querySelector("svg > path, svg > g > path, svg > g > g > path");

    return path?.getAttribute("d") || fallback;
  } catch {
    return fallback;
  }
}

export default function HeroMorphVisual({ ariaLabel = "Recursos preventivos do Orbis", onShapeChange }) {
  const shellRef = React.useRef(null);
  const svgRef = React.useRef(null);
  const pathRef = React.useRef(null);
  const onShapeChangeRef = React.useRef(onShapeChange);

  React.useEffect(() => {
    onShapeChangeRef.current = onShapeChange;
  }, [onShapeChange]);

  useIsomorphicLayoutEffect(() => {
    const shell = shellRef.current;
    const svg = svgRef.current;
    const path = pathRef.current;

    if (!shell || !svg || !path) {
      return undefined;
    }

    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let context = null;
    let disposed = false;

    async function setupAnimation() {
      const shapes = await Promise.all(HERO_MORPH_SHAPES.map(loadSvgPath));

      if (disposed) {
        return;
      }

      onShapeChangeRef.current?.(0);

      context = gsap.context(() => {
        gsap.set(path, {
          attr: { d: shapes[0] },
          svgOrigin: "480 -480",
        });

        if (reducedMotion) {
          gsap.set([shell, svg], { autoAlpha: 1, clearProps: "transform" });
          return;
        }

        gsap.fromTo(
          svg,
          { autoAlpha: 0, scale: 0.88, y: 18 },
          { autoAlpha: 1, scale: 1, y: 0, duration: 0.7, ease: "back.out(1.45)" },
        );

        gsap.to(svg, {
          y: -14,
          duration: 3.2,
          repeat: -1,
          yoyo: true,
          ease: "sine.inOut",
        });

        const morphTimeline = gsap.timeline({
          repeat: -1,
          defaults: { duration: 0.86, ease: "power3.inOut" },
        });

        shapes.slice(1).concat(shapes[0]).forEach((shape, index) => {
          const nextShapeIndex = (index + 1) % shapes.length;

          morphTimeline
            .call(() => onShapeChangeRef.current?.(nextShapeIndex), undefined, "+=0.82")
            .to(path, {
              morphSVG: {
                shape,
                shapeIndex: "auto",
              },
            }, "<")
            .to(path, {
              scale: 0.94,
              duration: 0.18,
              repeat: 1,
              yoyo: true,
              ease: "sine.inOut",
            }, "<0.04");
        });
      }, shell);
    }

    setupAnimation();

    return () => {
      disposed = true;
      context?.revert();
    };
  }, []);

  return (
    <div ref={shellRef} className="hero-morph-shell">
      <svg
        ref={svgRef}
        className="hero-morph-svg"
        viewBox="0 -960 960 960"
        role="img"
        aria-label={ariaLabel}
      >
        <path ref={pathRef} className="hero-morph-path" d={HERO_MORPH_SHAPES[0].fallback} />
      </svg>
    </div>
  );
}
