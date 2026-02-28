(function renderArticlePage() {
  const articleRoot = document.getElementById("articleRoot");
  const articleRelatedWrap = document.getElementById("articleRelatedWrap");

  if (!articleRoot || !articleRelatedWrap) {
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

  function escapeHtml(value) {
    return String(value || "")
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#39;");
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

  function getParagraphs(text) {
    return String(text || "")
      .split(". ")
      .map((part) => part.trim())
      .filter(Boolean)
      .map((part) => (part.endsWith(".") ? part : `${part}.`));
  }

  const params = new URLSearchParams(window.location.search);
  const articleId = params.get("id");

  loadArticles().then((articlesData) => {
    const article = articlesData.find((item) => String(item.id) === String(articleId));

    if (!article) {
      articleRoot.innerHTML = '<p class="admin-empty">Статья не найдена. Вернитесь в блог.</p>';
      articleRelatedWrap.innerHTML = "";
      return;
    }

  const safeTitle = escapeHtml(article.title);
  const safeCategory = escapeHtml(article.category);
  const safeAuthor = escapeHtml(article.author || "Редакция LuxuryTours");
  const safeReadTime = escapeHtml(article.readTime || "5 мин");
  const safeImage = getArticleImage(article);
  const paragraphsMarkup = getParagraphs(article.content)
    .map((paragraph) => `<p>${escapeHtml(paragraph)}</p>`)
    .join("");

    articleRoot.innerHTML = `
    <article class="card article-card">
      <img class="article-cover" src="${safeImage}" alt="${safeTitle}" loading="lazy" />
      <div class="article-content-wrap">
        <span class="blog-chip">${safeCategory}</span>
        <h1 class="section-title">${safeTitle}</h1>
        <p class="article-meta">${safeAuthor} · ${safeReadTime}</p>
        <div class="article-content">${paragraphsMarkup}</div>
      </div>
    </article>
  `;

    const related = articlesData
      .filter((item) => item.id !== article.id && item.category === article.category)
      .slice(0, 3);

    articleRelatedWrap.innerHTML = `
    <div class="section-head-row">
      <h2 class="section-title">Похожие статьи</h2>
      <a class="text-link" href="blog.html?category=${encodeURIComponent(article.category)}">Все по теме</a>
    </div>
    <div class="blog-grid">
      ${
        related.length > 0
          ? related
              .map((item) => {
                const image = getArticleImage(item);
                return `
                  <article class="card blog-card">
                    <a class="blog-card-link" href="article.html?id=${encodeURIComponent(item.id)}">
                      <img class="blog-cover" src="${image}" alt="${escapeHtml(item.title)}" loading="lazy" />
                      <div class="blog-card-head">
                        <span class="blog-chip">${escapeHtml(item.category)}</span>
                        <span class="blog-read-time">${escapeHtml(item.readTime)}</span>
                      </div>
                      <h2>${escapeHtml(item.title)}</h2>
                      <p>${escapeHtml(item.excerpt)}</p>
                      <span class="text-link blog-read-link">Открыть статью</span>
                    </a>
                  </article>
                `;
              })
              .join("")
          : '<p class="admin-empty">Пока нет похожих статей в этой теме.</p>'
      }
    </div>
  `;
  });
})();
