(function initHomePage() {
  const popularGrid = document.getElementById("homePopularToursGrid");
  const latestGrid = document.getElementById("homeToursGrid");
  const blogTrack = document.getElementById("homeBlogTrack");
  const prevBtn = document.getElementById("homeBlogPrevBtn");
  const nextBtn = document.getElementById("homeBlogNextBtn");

  if (!popularGrid || !latestGrid || !blogTrack || !prevBtn || !nextBtn) {
    return;
  }

  const tours = typeof readToursFromStorage === "function" ? readToursFromStorage() : [];

  if (!Array.isArray(tours) || tours.length === 0) {
    popularGrid.innerHTML = '<p class="admin-empty">Туры пока не добавлены.</p>';
    latestGrid.innerHTML = '<p class="admin-empty">Туры пока не добавлены.</p>';
  } else {
    const byPopularity = [...tours]
      .sort((firstTour, secondTour) => Number(secondTour.views || 0) - Number(firstTour.views || 0))
      .slice(0, 3);

    const byNew = [...tours]
      .sort((firstTour, secondTour) => String(secondTour.id).localeCompare(String(firstTour.id)))
      .slice(0, 4);

    popularGrid.innerHTML = byPopularity.map((tour) => renderTourCardMarkup(tour, "Открыть тур")).join("");
    latestGrid.innerHTML = byNew.map((tour) => renderTourCardMarkup(tour, "Открыть тур")).join("");
  }

  async function loadArticles() {
    try {
      const response = await fetch("/api/articles");
      if (!response.ok) {
        throw new Error("Articles API error");
      }

      const payload = await response.json();
      if (!Array.isArray(payload)) {
        throw new Error("Invalid articles payload");
      }

      return payload;
    } catch (error) {
      return typeof BLOG_ARTICLES !== "undefined" && Array.isArray(BLOG_ARTICLES) ? BLOG_ARTICLES : [];
    }
  }

  loadArticles().then((articles) => {
    if (articles.length === 0) {
      blogTrack.innerHTML = '<p class="admin-empty">Статьи временно недоступны.</p>';
      prevBtn.disabled = true;
      nextBtn.disabled = true;
      return;
    }

    const sortedArticles = [...articles].sort(
      (firstArticle, secondArticle) =>
        new Date(secondArticle.publishedAt).getTime() - new Date(firstArticle.publishedAt).getTime()
    );

    blogTrack.innerHTML = sortedArticles
      .slice(0, 12)
      .map((article) => {
        const safeId = encodeURIComponent(String(article.id || ""));
        const safeTitle = escapeHtml(article.title || "Статья");
        const safeExcerpt = escapeHtml(article.excerpt || "");
        const safeCategory = escapeHtml(article.category || "Блог");
        const safeReadTime = escapeHtml(article.readTime || "5 мин");

        return `
          <article class="card blog-card">
            <a class="blog-card-link" href="article.html?id=${safeId}">
              <div class="blog-card-head">
                <span class="blog-chip">${safeCategory}</span>
                <span class="blog-read-time">${safeReadTime}</span>
              </div>
              <h2>${safeTitle}</h2>
              <p>${safeExcerpt}</p>
              <span class="text-link blog-read-link">Открыть статью</span>
            </a>
          </article>
        `;
      })
      .join("");

    const blogCards = Array.from(blogTrack.querySelectorAll(".blog-card"));
    if (blogCards.length === 0) {
      prevBtn.disabled = true;
      nextBtn.disabled = true;
      return;
    }

    let activeIndex = 0;

    function updateSlider() {
      const maxIndex = blogCards.length - 1;
      activeIndex = Math.max(0, Math.min(maxIndex, activeIndex));
      const targetCard = blogCards[activeIndex];

      if (targetCard instanceof HTMLElement) {
        targetCard.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "start" });
      }
    }

    prevBtn.addEventListener("click", () => {
      activeIndex -= 1;
      updateSlider();
    });

    nextBtn.addEventListener("click", () => {
      activeIndex += 1;
      updateSlider();
    });
  });
})();