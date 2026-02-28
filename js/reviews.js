(function initReviewsCarousel() {
  const root = document.getElementById("reviewsCarousel");
  if (!root) {
    return;
  }

  const track = document.getElementById("reviewsTrack");
  const dots = document.getElementById("reviewsDots");
  if (!track || !dots) {
    return;
  }

  async function loadReviews() {
    try {
      const response = await fetch("/api/reviews");
      if (!response.ok) {
        throw new Error("Reviews API error");
      }

      const payload = await response.json();
      if (!Array.isArray(payload)) {
        throw new Error("Invalid reviews payload");
      }

      return payload;
    } catch (error) {
      return readReviewsFromStorage();
    }
  }

  loadReviews().then((reviews) => {
    if (reviews.length === 0) {
      track.innerHTML = '<p class="admin-empty">Отзывов пока нет.</p>';
      return;
    }

    let currentIndex = 0;
    let timer = null;

    track.innerHTML = reviews
      .map((review) => {
        const safeName = escapeHtml(review.name);
        const safeText = escapeHtml(review.text);
        const safeStars = renderStars(review.stars);

        return `
          <article class="review-slide card">
            <p class="review-stars" aria-label="Оценка ${review.stars} из 5">${safeStars}</p>
            <p class="review-text">${safeText}</p>
            <p class="review-name">— ${safeName}</p>
          </article>
        `;
      })
      .join("");

    dots.innerHTML = reviews
      .map(
        (_, index) =>
          `<button type="button" class="review-dot ${index === 0 ? "is-active" : ""}" data-index="${index}" aria-label="Показать отзыв ${
            index + 1
          }"></button>`
      )
      .join("");

    function updateCarousel() {
      track.style.transform = `translateX(-${currentIndex * 100}%)`;

      const allDots = dots.querySelectorAll(".review-dot");
      allDots.forEach((dot, index) => {
        dot.classList.toggle("is-active", index === currentIndex);
      });
    }

    function nextSlide() {
      currentIndex = (currentIndex + 1) % reviews.length;
      updateCarousel();
    }

    function startAutoplay() {
      stopAutoplay();
      timer = setInterval(nextSlide, 4200);
    }

    function stopAutoplay() {
      if (!timer) {
        return;
      }

      clearInterval(timer);
      timer = null;
    }

    dots.addEventListener("click", (event) => {
      const target = event.target;
      if (!(target instanceof HTMLElement)) {
        return;
      }

      const dot = target.closest(".review-dot");
      if (!dot) {
        return;
      }

      const index = Number(dot.getAttribute("data-index"));
      if (!Number.isFinite(index)) {
        return;
      }

      currentIndex = index;
      updateCarousel();
      startAutoplay();
    });

    root.addEventListener("mouseenter", stopAutoplay);
    root.addEventListener("mouseleave", startAutoplay);

    updateCarousel();
    startAutoplay();
  });
})();
