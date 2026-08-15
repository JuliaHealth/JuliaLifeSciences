(() => {
  function visibleCards(track, cardSelector) {
    return Array.from(track.querySelectorAll(cardSelector)).filter(
      (card) => getComputedStyle(card).display !== "none",
    );
  }

  function updateCounter(showcase, config) {
    const track = showcase.querySelector(config.trackSelector);
    const output = showcase.querySelector(config.outputSelector);
    if (!track || !output) return;

    const cards = visibleCards(track, config.cardSelector);
    if (!cards.length) {
      output.textContent = "0 / 0";
      return;
    }

    const trackLeft = track.getBoundingClientRect().left;
    const currentIndex = cards.reduce((closestIndex, card, index) => {
      const closestDistance = Math.abs(cards[closestIndex].getBoundingClientRect().left - trackLeft);
      const distance = Math.abs(card.getBoundingClientRect().left - trackLeft);
      return distance < closestDistance ? index : closestIndex;
    }, 0);
    output.textContent = `${currentIndex + 1} / ${cards.length}`;
  }

  function initializeCarousel(showcase, config) {
    const track = showcase.querySelector(config.trackSelector);
    if (!track) return;

    let updateScheduled = false;
    const scheduleUpdate = () => {
      if (updateScheduled) return;
      updateScheduled = true;
      requestAnimationFrame(() => {
        updateScheduled = false;
        updateCounter(showcase, config);
      });
    };

    track.addEventListener("scroll", scheduleUpdate, { passive: true });
    if (config.filterSelector) {
      showcase.addEventListener("change", (event) => {
        if (!event.target.matches(config.filterSelector)) return;
        track.scrollLeft = 0;
        scheduleUpdate();
      });
    }
    updateCounter(showcase, config);
  }

  function initialize() {
    document.querySelectorAll(".package-showcase").forEach((showcase) => initializeCarousel(showcase, {
      trackSelector: ".package-track",
      cardSelector: ".package-card",
      outputSelector: "[data-package-position]",
      filterSelector: ".package-filter-input",
    }));
    document.querySelectorAll(".talk-carousel").forEach((carousel) => initializeCarousel(carousel, {
      trackSelector: ".talk-track",
      cardSelector: ".talk-card",
      outputSelector: "[data-talk-position]",
    }));
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initialize, { once: true });
  } else {
    initialize();
  }
})();
