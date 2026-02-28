(function initAdminModeSwitch() {
  if (typeof getAdminSession === "function" && !getAdminSession()) {
    return;
  }

  const showTourMode = document.getElementById("showTourMode");
  const showReviewMode = document.getElementById("showReviewMode");
  const showPresenceMode = document.getElementById("showPresenceMode");
  const tourPanel = document.getElementById("tourPanel");
  const analyticsPanel = document.getElementById("analyticsPanel");
  const reviewPanel = document.getElementById("reviewPanel");
  const presencePanel = document.getElementById("presencePanel");

  if (
    !showTourMode ||
    !showReviewMode ||
    !showPresenceMode ||
    !tourPanel ||
    !analyticsPanel ||
    !reviewPanel ||
    !presencePanel
  ) {
    return;
  }

  function switchMode(mode) {
    const tourActive = mode === "tour";
    const reviewActive = mode === "review";
    const presenceActive = mode === "presence";

    showTourMode.classList.toggle("is-active", tourActive);
    showReviewMode.classList.toggle("is-active", reviewActive);
    showPresenceMode.classList.toggle("is-active", presenceActive);
    showTourMode.setAttribute("aria-selected", String(tourActive));
    showReviewMode.setAttribute("aria-selected", String(reviewActive));
    showPresenceMode.setAttribute("aria-selected", String(presenceActive));

    tourPanel.classList.toggle("is-hidden", !tourActive);
    analyticsPanel.classList.toggle("is-hidden", !tourActive);
    reviewPanel.classList.toggle("is-hidden", !reviewActive);
    presencePanel.classList.toggle("is-hidden", !presenceActive);
  }

  showTourMode.addEventListener("click", () => switchMode("tour"));
  showReviewMode.addEventListener("click", () => switchMode("review"));
  showPresenceMode.addEventListener("click", () => switchMode("presence"));

  switchMode("tour");
})();
