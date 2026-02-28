(function renderToursPage() {
  const toursGrid = document.getElementById("toursGrid");
  const catalogSearch = document.getElementById("catalogSearch");
  const catalogCategory = document.getElementById("catalogCategory");
  const catalogBudget = document.getElementById("catalogBudget");
  const catalogSeason = document.getElementById("catalogSeason");
  const catalogSort = document.getElementById("catalogSort");
  const catalogCompare = document.getElementById("catalogCompare");
  const aiTourPrompt = document.getElementById("aiTourPrompt");
  const aiSuggestToursBtn = document.getElementById("aiSuggestToursBtn");
  const aiTourHint = document.getElementById("aiTourHint");

  if (
    !toursGrid ||
    !catalogSearch ||
    !catalogCategory ||
    !catalogBudget ||
    !catalogSeason ||
    !catalogSort ||
    !catalogCompare
  ) {
    return;
  }

  const tours = readToursFromStorage();
  let compareIds = [];

  function renderCategoryOptions() {
    const options = getTourCategoryOptions();
    const currentValue = String(catalogCategory.value || "all");

    catalogCategory.innerHTML = [
      '<option value="all">Все категории</option>',
      ...options.map((category) => `<option value="${escapeHtml(category)}">${escapeHtml(category)}</option>`)
    ].join("");

    if (options.includes(currentValue)) {
      catalogCategory.value = currentValue;
    }
  }

  function renderComparePanel() {
    const selectedTours = compareIds
      .map((id) => tours.find((tour) => String(tour.id) === String(id)))
      .filter(Boolean);

    if (selectedTours.length === 0) {
      catalogCompare.innerHTML = '<p class="admin-empty">Сравнение: выберите до 2 туров кнопкой «Сравнить».</p>';
      return;
    }

    catalogCompare.innerHTML = `
      <div class="catalog-compare-grid">
        ${selectedTours
          .map(
            (tour) => `
          <article class="catalog-compare-item">
            <h3>${escapeHtml(tour.title)}</h3>
            <p><strong>Категория:</strong> ${escapeHtml(getTourCategory(tour))}</p>
            <p><strong>Цена:</strong> ${escapeHtml(formatEuro(tour.price))}</p>
            <p><strong>Длительность:</strong> ${escapeHtml(formatDurationLabel(tour.duration))}</p>
            <p><strong>Просмотры:</strong> ${escapeHtml(String(tour.views || 0))}</p>
          </article>
        `
          )
          .join("")}
      </div>
      <button type="button" class="btn btn-secondary" id="clearCompareBtn">Очистить сравнение</button>
    `;

    const clearCompareBtn = document.getElementById("clearCompareBtn");
    if (clearCompareBtn) {
      clearCompareBtn.addEventListener("click", () => {
        compareIds = [];
        renderComparePanel();
      });
    }
  }

  function getFilteredTours() {
    const query = String(catalogSearch.value || "").trim().toLowerCase();
    const selectedCategory = String(catalogCategory.value || "all");
    const selectedBudget = String(catalogBudget.value || "all");
    const selectedSeason = String(catalogSeason.value || "all");
    const sortMode = String(catalogSort.value || "popular");

    const seasonCategoryMap = {
      winter: ["Горные маршруты", "Релакс и SPA", "Городские уикенды"],
      spring: ["Экскурсионные туры", "Эко-туры", "Гастрономические"],
      summer: ["Пляжные направления", "Круизы", "Активные приключения"],
      autumn: ["Гастрономические", "Романтические", "Экскурсионные туры"]
    };

    let filteredTours = tours.filter((tour) => {
      const fullText = `${tour.title} ${tour.description}`.toLowerCase();
      const searchMatch = !query || fullText.includes(query);
      const categoryMatch =
        selectedCategory === "all" || getTourCategories(tour).includes(selectedCategory);
      const budgetMatch = selectedBudget === "all" || Number(tour.price || 0) <= Number(selectedBudget);
      const seasonCategories = seasonCategoryMap[selectedSeason] || [];
      const seasonMatch =
        selectedSeason === "all" || getTourCategories(tour).some((category) => seasonCategories.includes(category));
      return searchMatch && categoryMatch && budgetMatch && seasonMatch;
    });

    filteredTours = [...filteredTours].sort((firstTour, secondTour) => {
      if (sortMode === "new") {
        return String(secondTour.id).localeCompare(String(firstTour.id));
      }

      if (sortMode === "price-asc") {
        return Number(firstTour.price || 0) - Number(secondTour.price || 0);
      }

      if (sortMode === "price-desc") {
        return Number(secondTour.price || 0) - Number(firstTour.price || 0);
      }

      return Number(secondTour.views || 0) - Number(firstTour.views || 0);
    });

    return filteredTours;
  }

  function renderCatalog() {
    const visibleTours = getFilteredTours();

    if (visibleTours.length === 0) {
      toursGrid.innerHTML = '<p class="admin-empty">По вашему запросу туры не найдены.</p>';
      return;
    }

    toursGrid.innerHTML = visibleTours
      .map((tour) => renderTourCardMarkup(tour, "Открыть тур"))
      .join("");
  }

  function renderAISuggestions() {
    if (!(aiTourPrompt instanceof HTMLInputElement) || !(aiTourHint instanceof HTMLElement)) {
      return;
    }

    const prompt = aiTourPrompt.value.trim();
    if (!prompt) {
      aiTourHint.textContent = "Опишите пожелания к поездке, чтобы AI-консьерж подобрал туры.";
      return;
    }

    const suggested = getAIAssistantTourSuggestions(prompt, { tours });
    if (suggested.length === 0) {
      aiTourHint.textContent = "Не удалось подобрать варианты. Уточните бюджет, сезон или формат отдыха.";
      return;
    }

    toursGrid.innerHTML = suggested.map((tour) => renderTourCardMarkup(tour, "Открыть тур")).join("");
    aiTourHint.textContent = `AI-консьерж подобрал ${suggested.length} варианта(ов) по вашему описанию.`;
    trackAnalyticsEvent("ai_suggest_used", { promptLength: prompt.length, results: suggested.length });
  }

  if (tours.length === 0) {
    toursGrid.innerHTML = '<p class="admin-empty">Туры пока не добавлены.</p>';
    catalogCompare.innerHTML = "";
    return;
  }

  renderCategoryOptions();
  renderCatalog();
  renderComparePanel();

  catalogSearch.addEventListener("input", renderCatalog);
  catalogCategory.addEventListener("change", renderCatalog);
  catalogBudget.addEventListener("change", renderCatalog);
  catalogSeason.addEventListener("change", renderCatalog);
  catalogSort.addEventListener("change", renderCatalog);

  if (aiSuggestToursBtn instanceof HTMLButtonElement) {
    aiSuggestToursBtn.addEventListener("click", renderAISuggestions);
  }

  toursGrid.addEventListener("click", (event) => {
    const target = event.target;
    if (!(target instanceof HTMLElement)) {
      return;
    }

    const favBtn = target.closest(".js-favorite-btn");
    if (favBtn) {
      const tourId = favBtn.getAttribute("data-tour-id");
      if (!tourId) {
        return;
      }

      const session = getCurrentUserForFavorites();
      if (!session) {
        window.location.href = "login.html?mode=login";
        return;
      }

      const isFavorite = toggleTourFavorite(tourId);
      favBtn.classList.toggle("is-active", isFavorite);
      favBtn.textContent = isFavorite ? "★ В избранном" : "☆ В избранное";
      return;
    }

    const compareBtn = target.closest(".js-compare-btn");
    if (!compareBtn) {
      return;
    }

    const tourId = compareBtn.getAttribute("data-tour-id");
    if (!tourId) {
      return;
    }

    if (compareIds.includes(tourId)) {
      compareIds = compareIds.filter((id) => id !== tourId);
    } else {
      compareIds = [...compareIds, tourId].slice(-2);
    }

    renderComparePanel();
    trackAnalyticsEvent("tour_compared", { comparedIds: compareIds });
  });
})();
