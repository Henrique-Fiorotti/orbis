"use client";

import * as React from "react";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";

const MIN_LOOP_ITEMS = 12;

export default function SlideOpacity({ items = [] }) {
  const [api, setApi] = React.useState(null);
  const [scrollProgress, setScrollProgress] = React.useState(0);
  const [snapList, setSnapList] = React.useState([]);
  const itemsSignature = React.useMemo(
    () => items.map((item) => `${item.icon}-${item.title}-${item.desc}`).join("|"),
    [items]
  );
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

  React.useEffect(() => {
    if (!api) return;

    const onUpdate = () => {
      setScrollProgress(api.scrollProgress());
    };

    setSnapList(api.scrollSnapList());
    api.on("select", onUpdate);
    api.on("scroll", onUpdate);
    onUpdate();

    return () => {
      api.off("select", onUpdate);
      api.off("scroll", onUpdate);
    };
  }, [api]);

  React.useEffect(() => {
    if (!api) return;

    api.reInit();
    setSnapList(api.scrollSnapList());
    setScrollProgress(api.scrollProgress());
  }, [api, itemsSignature]);

  const getOpacity = (index) => {
    if (!snapList.length) return 1;
    const total = snapList.length;

    let dist = Math.abs(scrollProgress - snapList[index]) * total;
    dist = Math.min(dist, total - dist);

    if (dist <= 1) return 1;
    const t = Math.min((dist - 1) / 1, 1);
    return 1 - t * 0.65;
  };

  /* Para adicionar cards vá para translations.js */

  return (
    <Carousel
      className="relative w-full"
      // Velocidade/comportamento do arraste: altere "dragFree" (true = livre, false = card a card) e "duration" (padrão ~25, quanto maior mais lento)
      opts={{ align: "center", loop: true, dragFree: true, duration: 60 }}
      setApi={setApi}
    >
      <div className="overflow-hidden [mask-image:linear-gradient(90deg,transparent,black_8%,black_92%,transparent)]">
        <CarouselContent className="-ml-4 cursor-grab active:cursor-grabbing">
          {carouselItems.map((item, index) => (
            <CarouselItem
              className="basis-[82%] pl-4 sm:basis-1/2 lg:basis-1/4"
              style={{
                opacity: getOpacity(index),
                transition: "opacity 0.12s ease",
              }}
              key={item.carouselKey}
            >
              <div
                className="select-none h-[190px] rounded-3xl border border-[var(--landing-feature-border)] bg-[var(--landing-feature-bg)] p-5 shadow-sm transition hover:border-[#7c3aed]"
                style={{ boxShadow: "var(--landing-feature-shadow)" }}
              >
                <img
                  alt=""
                  className="mb-3 h-7 w-7"
                  src={item.icon}
                  loading="lazy"
                  decoding="async"
                />
                <p
                  className="mb-1 text-[0.95rem] font-bold"
                  style={{ color: "var(--landing-heading)" }}
                >
                  {item.title}
                </p>
                <p
                  className="m-0 text-[0.82rem] leading-[1.65]"
                  style={{ color: "var(--landing-muted)" }}
                >
                  {item.desc}
                </p>
              </div>
            </CarouselItem>
          ))}
        </CarouselContent>
      </div>
      {/* <CarouselPrevious className="-left-4 border-[var(--landing-feature-border)] bg-[var(--landing-feature-bg)] text-[var(--landing-heading)] hover:bg-[var(--landing-alt-bg)] sm:-left-12" /> */}
      {/* <CarouselNext className="-right-4 border-[var(--landing-feature-border)] bg-[var(--landing-feature-bg)] text-[var(--landing-heading)] hover:bg-[var(--landing-alt-bg)] sm:-right-12" /> */}
    </Carousel>
  );
}
