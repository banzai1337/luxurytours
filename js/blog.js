(function renderBlogPage() {
  function escapeHtml(value) {
    return String(value || "")
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#39;");
  }

  const blogList = document.getElementById("blogList");
  const blogSearch = document.getElementById("blogSearch");
  const blogCategory = document.getElementById("blogCategory");
  const directionsSlider = document.getElementById("directionsSlider");
  const directionPrevBtn = document.getElementById("directionPrevBtn");
  const directionNextBtn = document.getElementById("directionNextBtn");
  let articlesData = [];

  if (
    !blogList ||
    !blogSearch ||
    !blogCategory ||
    !directionsSlider ||
    !directionPrevBtn ||
    !directionNextBtn
  ) {
    return;
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

  const params = new URLSearchParams(window.location.search);
  const categoryFromQuery = params.get("category");
  if (categoryFromQuery && Array.from(blogCategory.options).some((option) => option.value === categoryFromQuery)) {
    blogCategory.value = categoryFromQuery;
  }

  function sanitizeUrl(url, fallback) {
    try {
      const parsed = new URL(String(url || ""));
      if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
        return fallback;
      }

      return parsed.href;
    } catch (error) {
      return fallback;
    }
  }

  function getArticleImage(article) {
    const category = String(article?.category || "");
    const byCategory = {
      "Бюджет": "https://images.unsplash.com/photo-1563013544-824ae1b704d3?auto=format&fit=crop&w=1400&q=80",
      "Подготовка": "https://images.unsplash.com/photo-1488646953014-85cb44e25828?auto=format&fit=crop&w=1400&q=80",
      "Безопасность": "https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?auto=format&fit=crop&w=1400&q=80",
      "Семейный отдых": "https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=1400&q=80",
      "Маршруты": "https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?auto=format&fit=crop&w=1400&q=80",
      "Пляжные направления": "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1400&q=80",
      "Горные маршруты": "https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=1400&q=80",
      "Визы": "https://images.unsplash.com/photo-1436491865332-7a61a109cc05?auto=format&fit=crop&w=1400&q=80",
      "Перелеты": "https://images.unsplash.com/photo-1474302770737-173ee21bab63?auto=format&fit=crop&w=1400&q=80",
      "Релакс": "https://images.unsplash.com/photo-1519823551278-64ac92734fb1?auto=format&fit=crop&w=1400&q=80",
      "Романтические поездки": "https://images.unsplash.com/photo-1520854221256-17451cc331bf?auto=format&fit=crop&w=1400&q=80"
    };

    return sanitizeUrl(byCategory[category], "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1400&q=80");
  }

  function getFilteredArticles() {
    const query = String(blogSearch.value || "").trim().toLowerCase();
    const selectedCategory = String(blogCategory.value || "all");

    return articlesData.filter((article) => {
      const fullText = `${article.title} ${article.excerpt} ${article.content}`.toLowerCase();
      const searchMatch = !query || fullText.includes(query);
      const categoryMatch = selectedCategory === "all" || String(article.category) === selectedCategory;
      return searchMatch && categoryMatch;
    });
  }

  function getDirectionCollections() {
    const grouped = new Map();

    articlesData.forEach((article) => {
      const category = String(article.category || "Разное");
      if (!grouped.has(category)) {
        grouped.set(category, []);
      }

      grouped.get(category).push(article);
    });

    return Array.from(grouped.entries())
      .map(([category, articles]) => {
        const sorted = [...articles].sort(
          (firstArticle, secondArticle) =>
            new Date(secondArticle.publishedAt).getTime() - new Date(firstArticle.publishedAt).getTime()
        );

        return {
          category,
          total: sorted.length,
          latest: sorted[0],
          image: getArticleImage(sorted[0])
        };
      })
      .sort((first, second) =>
        new Date(second.latest?.publishedAt || 0).getTime() - new Date(first.latest?.publishedAt || 0).getTime()
      );
  }

  let directionCollections = [];
  let directionIndex = 0;

  function renderDirectionSlide(direction = 1) {
    if (directionCollections.length === 0) {
      directionsSlider.innerHTML = '<p class="admin-empty">Подборки появятся после добавления статей.</p>';
      return;
    }

    const item = directionCollections[directionIndex];
    const directionClass = direction < 0 ? "is-from-left" : "is-from-right";
    const safeCategory = escapeHtml(item.category);
    const safeTitle = escapeHtml(item.latest?.title || "Новая статья");
    const safeExcerpt = escapeHtml(item.latest?.excerpt || "");
    const safeImage = item.image;
    const safeCount = escapeHtml(String(item.total || 0));
    const categoryLink = `blog.html?category=${encodeURIComponent(item.category)}`;

    directionsSlider.innerHTML = `
      <article class="card direction-slide ${directionClass}">
        <img class="direction-slide-cover" src="${safeImage}" alt="${safeCategory}" loading="lazy" />
        <div class="direction-slide-content">
          <span class="blog-chip">${safeCategory}</span>
          <h3>${safeTitle}</h3>
          <p>${safeExcerpt}</p>
          <p class="direction-slide-meta">Статей в теме: ${safeCount}</p>
          <a class="text-link" href="${categoryLink}">Смотреть все статьи</a>
        </div>
      </article>
    `;
  }

  function moveDirection(step) {
    if (directionCollections.length <= 1) {
      return;
    }

    const nextIndex = (directionIndex + step + directionCollections.length) % directionCollections.length;
    directionIndex = nextIndex;
    renderDirectionSlide(step);
  }

  function render() {
    const articles = getFilteredArticles();

    if (articles.length === 0) {
      blogList.innerHTML = '<p class="admin-empty">По вашему запросу статьи не найдены.</p>';
      return;
    }

    blogList.innerHTML = articles
      .map((article) => {
        const safeTitle = escapeHtml(article.title);
        const safeCategory = escapeHtml(article.category);
        const safeReadTime = escapeHtml(article.readTime);
        const safeExcerpt = escapeHtml(article.excerpt);
        const safeImage = getArticleImage(article);
        const safeId = encodeURIComponent(String(article.id || ""));

        return `
          <article class="card blog-card">
            <a class="blog-card-link" href="article.html?id=${safeId}">
              <img class="blog-cover" src="${safeImage}" alt="${safeTitle}" loading="lazy" />
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
  }

  blogSearch.addEventListener("input", render);
  blogCategory.addEventListener("change", render);
  directionPrevBtn.addEventListener("click", () => moveDirection(-1));
  directionNextBtn.addEventListener("click", () => moveDirection(1));

  loadArticles().then((articles) => {
    articlesData = Array.isArray(articles) ? articles : [];

    if (articlesData.length === 0) {
      directionsSlider.innerHTML = '<p class="admin-empty">Статьи временно недоступны.</p>';
      blogList.innerHTML = '<p class="admin-empty">Статьи временно недоступны.</p>';
      return;
    }

    directionCollections = getDirectionCollections();
    directionIndex = 0;
    renderDirectionSlide(1);
    render();
  });
})();
