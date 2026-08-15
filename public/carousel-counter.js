(() => {
  function visibleCards(track) {
    return Array.from(track.querySelectorAll(".package-card")).filter(
      (card) => getComputedStyle(card).display !== "none",
    );
  }

  function updateCounter(showcase) {
    const track = showcase.querySelector(".package-track");
    const output = showcase.querySelector("[data-package-position]");
    if (!track || !output) return;

    const cards = visibleCards(track);
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

  function initializeCarousel(showcase) {
    const track = showcase.querySelector(".package-track");
    if (!track) return;

    let updateScheduled = false;
    const scheduleUpdate = () => {
      if (updateScheduled) return;
      updateScheduled = true;
      requestAnimationFrame(() => {
        updateScheduled = false;
        updateCounter(showcase);
      });
    };

    track.addEventListener("scroll", scheduleUpdate, { passive: true });
    showcase.addEventListener("change", (event) => {
      if (!event.target.classList.contains("package-filter-input")) return;
      track.scrollLeft = 0;
      scheduleUpdate();
    });
    updateCounter(showcase);
  }

  function initialize() {
    document.querySelectorAll(".package-showcase").forEach(initializeCarousel);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initialize, { once: true });
  } else {
    initialize();
  }
})();
