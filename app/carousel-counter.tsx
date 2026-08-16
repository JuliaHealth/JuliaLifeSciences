"use client";

import { useEffect, useRef, useState } from "react";

type CarouselKind = "packages" | "talks";

const carouselConfig = {
  packages: {
    containerSelector: ".package-showcase",
    trackSelector: ".package-track",
    cardSelector: ".package-card",
    filterSelector: ".package-filter-input",
  },
  talks: {
    containerSelector: ".talk-carousel",
    trackSelector: ".talk-track",
    cardSelector: ".talk-card",
    filterSelector: null,
  },
} as const;

export function CarouselCounter({
  kind,
  total,
  className,
}: {
  kind: CarouselKind;
  total: number;
  className?: string;
}) {
  const outputRef = useRef<HTMLOutputElement>(null);
  const [counter, setCounter] = useState({ position: 1, total });

  useEffect(() => {
    const config = carouselConfig[kind];
    const container = outputRef.current?.closest(config.containerSelector);
    const track = container?.querySelector<HTMLElement>(config.trackSelector);
    if (!container || !track) return;

    let cards: HTMLElement[] = [];
    let cardStep = 1;
    let updateFrame = 0;
    let refreshFrame = 0;

    const updateCounter = () => {
      const position = cards.length
        ? Math.min(cards.length - 1, Math.max(0, Math.round(track.scrollLeft / cardStep))) + 1
        : 0;
      setCounter({ position, total: cards.length });
    };

    const refreshCards = () => {
      cards = Array.from(track.querySelectorAll<HTMLElement>(config.cardSelector)).filter(
        (card) => getComputedStyle(card).display !== "none",
      );
      cardStep = cards.length > 1
        ? cards[1].offsetLeft - cards[0].offsetLeft
        : cards[0]?.offsetWidth || 1;
      updateCounter();
    };

    const scheduleUpdate = () => {
      if (updateFrame) return;
      updateFrame = requestAnimationFrame(() => {
        updateFrame = 0;
        updateCounter();
      });
    };

    const scheduleRefresh = () => {
      if (refreshFrame) return;
      refreshFrame = requestAnimationFrame(() => {
        refreshFrame = 0;
        refreshCards();
      });
    };

    const handleFilter = (event: Event) => {
      if (!config.filterSelector || !(event.target instanceof Element) || !event.target.matches(config.filterSelector)) return;
      track.scrollLeft = 0;
      scheduleRefresh();
    };

    track.addEventListener("scroll", scheduleUpdate, { passive: true });
    window.addEventListener("resize", scheduleRefresh, { passive: true });
    container.addEventListener("change", handleFilter);
    refreshCards();

    return () => {
      cancelAnimationFrame(updateFrame);
      cancelAnimationFrame(refreshFrame);
      track.removeEventListener("scroll", scheduleUpdate);
      window.removeEventListener("resize", scheduleRefresh);
      container.removeEventListener("change", handleFilter);
    };
  }, [kind]);

  return (
    <output
      ref={outputRef}
      className={className}
      data-package-position={kind === "packages" ? "" : undefined}
      data-talk-position={kind === "talks" ? "" : undefined}
      aria-live="polite"
    >
      {`${counter.position} / ${counter.total}`}
    </output>
  );
}
