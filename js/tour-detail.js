(function renderTourDetailPage() {
  const detailRoot = document.getElementById("tourDetail");
  if (!detailRoot) {
    return;
  }

  const params = new URLSearchParams(window.location.search);
  const id = params.get("id");

  if (!id) {
    detailRoot.innerHTML = '<p class="admin-empty">Тур не найден. Вернитесь в каталог туров.</p>';
    return;
  }

  const tour = getTourById(id);
  if (!tour) {
    detailRoot.innerHTML = '<p class="admin-empty">Тур не найден. Возможно, он был удалён.</p>';
    return;
  }

  incrementTourViews(tour.id);
  addTourToViewedHistory(tour.id);
  trackAnalyticsEvent("tour_opened", { tourId: tour.id, category: getTourCategory(tour) });

  const safeTitle = escapeHtml(tour.title);
  const safeDescription = escapeHtml(tour.description);
  const safeImage = sanitizeImageUrl(tour.image, TOUR_FALLBACK_IMAGE);
  const safeFallbackImage = sanitizeImageUrl(TOUR_FALLBACK_IMAGE, TOUR_FALLBACK_IMAGE);
  const galleryImages = Array.isArray(tour.images) && tour.images.length > 0 ? tour.images : [tour.image];
  const safeGallery = galleryImages
    .map((item) => sanitizeImageUrl(item, ""))
    .filter(Boolean)
    .slice(0, 12);
  const galleryMarkup = safeGallery
    .map(
      (item, index) => `
        <button type="button" class="detail-thumb-btn${index === 0 ? " is-active" : ""}" data-image="${escapeHtml(
        item
      )}" aria-label="Фото ${index + 1}">
          <img src="${item}" alt="${safeTitle}" loading="lazy" />
        </button>
      `
    )
    .join("");
  const safeDuration = escapeHtml(formatDurationLabel(tour.duration));
  const safePrice = escapeHtml(formatEuro(tour.price));
  const safeTelegram = sanitizeUrl(getTelegramLink(), "https://t.me");
  const isFavorite = isTourFavorite(tour.id);
  const safeCategory = escapeHtml(getTourCategory(tour));

  detailRoot.innerHTML = `
    <article class="card detail-card">
      <div class="detail-main-media">
        <img id="detailMainImage" src="${safeImage}" alt="${safeTitle}" class="detail-image" loading="lazy" onerror="this.onerror=null;this.src='${safeFallbackImage}';" />
        ${
          safeGallery.length > 1
            ? `
          <button type="button" class="detail-inline-nav prev" id="detailInlinePrev" aria-label="Предыдущее фото">
            <span class="detail-nav-icon" aria-hidden="true"></span>
          </button>
          <button type="button" class="detail-inline-nav next" id="detailInlineNext" aria-label="Следующее фото">
            <span class="detail-nav-icon" aria-hidden="true"></span>
          </button>
        `
            : ""
        }
      </div>
      ${safeGallery.length > 1 ? `<div class="detail-gallery">${galleryMarkup}</div>` : ""}
      <div class="detail-content">
        <h1 class="section-title">${safeTitle}</h1>
        <p class="section-subtitle detail-description">${safeDescription}</p>
        <div class="detail-meta">
          <p><strong>Категория:</strong> ${safeCategory}</p>
          <p><strong>Длительность:</strong> ${safeDuration}</p>
          <p><strong>Цена:</strong> от ${safePrice}</p>
        </div>
        <div class="detail-actions">
          <a class="btn btn-accent" href="${safeTelegram}" target="_blank" rel="noopener noreferrer">Связаться с менеджером</a>
          <button type="button" class="btn btn-secondary tour-fav-btn js-detail-favorite-btn ${
            isFavorite ? "is-active" : ""
          }" id="detailFavoriteBtn">${isFavorite ? "★ В избранном" : "☆ В избранное"}</button>
        </div>
      </div>
    </article>

    <section class="card detail-booking-wrap">
      <h2>Оставить заявку</h2>
      <form id="tourBookingForm" class="detail-booking-form" novalidate>
        <label for="bookingName">Ваше имя</label>
        <input id="bookingName" type="text" required />
        <label for="bookingPhone">Телефон</label>
        <input id="bookingPhone" type="tel" required placeholder="+7..." />
        <label for="bookingMonth">Месяц поездки</label>
        <select id="bookingMonth" required>
          <option value="">Выберите месяц</option>
          <option value="Январь">Январь</option>
          <option value="Февраль">Февраль</option>
          <option value="Март">Март</option>
          <option value="Апрель">Апрель</option>
          <option value="Май">Май</option>
          <option value="Июнь">Июнь</option>
          <option value="Июль">Июль</option>
          <option value="Август">Август</option>
          <option value="Сентябрь">Сентябрь</option>
          <option value="Октябрь">Октябрь</option>
          <option value="Ноябрь">Ноябрь</option>
          <option value="Декабрь">Декабрь</option>
        </select>
        <div class="detail-booking-grid">
          <div>
            <label for="bookingAdults">Взрослых</label>
            <input id="bookingAdults" type="number" min="1" value="2" required />
          </div>
          <div>
            <label for="bookingChildren">Детей</label>
            <input id="bookingChildren" type="number" min="0" value="0" />
          </div>
        </div>
        <label for="bookingBudget">Планируемый бюджет (€)</label>
        <input id="bookingBudget" type="number" min="1" placeholder="Например, 90000" />
        <fieldset class="detail-booking-extras">
          <legend>Доп. услуги</legend>
          <label><input type="checkbox" value="VIP-трансфер" /> VIP-трансфер</label>
          <label><input type="checkbox" value="Страховка расширенная" /> Страховка расширенная</label>
          <label><input type="checkbox" value="Индивидуальные экскурсии" /> Индивидуальные экскурсии</label>
        </fieldset>
        <label for="bookingComment">Комментарий</label>
        <textarea id="bookingComment" rows="3" placeholder="Удобные даты и пожелания"></textarea>
        <button class="btn btn-accent" type="submit">Отправить заявку</button>
        <p class="form-hint" id="bookingHint" aria-live="polite"></p>
      </form>

      <h2>Календарь цен</h2>
      <div class="detail-price-tools">
        <label for="seasonMonth">Месяц поездки</label>
        <select id="seasonMonth">
          <option value="0">Январь</option>
          <option value="1">Февраль</option>
          <option value="2">Март</option>
          <option value="3">Апрель</option>
          <option value="4">Май</option>
          <option value="5">Июнь</option>
          <option value="6">Июль</option>
          <option value="7">Август</option>
          <option value="8">Сентябрь</option>
          <option value="9">Октябрь</option>
          <option value="10">Ноябрь</option>
          <option value="11">Декабрь</option>
        </select>
        <p class="form-hint" id="seasonPriceHint" aria-live="polite"></p>
      </div>

      <form id="priceAlertForm" class="detail-booking-form" novalidate>
        <label for="targetPrice">Уведомить, когда цена станет ниже (€)</label>
        <input id="targetPrice" type="number" min="1" required />
        <button class="btn btn-secondary" type="submit">Создать уведомление</button>
        <p class="form-hint" id="priceAlertHint" aria-live="polite"></p>
      </form>
    </section>

    <section class="detail-related-wrap">
      <div class="section-head-row">
        <h2 class="section-title">Похожие туры</h2>
      </div>
      <div class="tours-grid" id="relatedToursGrid" aria-live="polite"></div>
    </section>

    <div class="detail-lightbox is-hidden" id="detailLightbox" aria-modal="true" role="dialog">
      <button type="button" class="detail-lightbox-close" id="detailLightboxClose" aria-label="Закрыть">✕</button>
      <button type="button" class="detail-lightbox-nav prev" id="detailLightboxPrev" aria-label="Предыдущее фото">
        <span class="detail-lightbox-nav-icon" aria-hidden="true"></span>
      </button>
      <img id="detailLightboxImage" class="detail-lightbox-image" src="${safeImage}" alt="${safeTitle}" />
      <button type="button" class="detail-lightbox-nav next" id="detailLightboxNext" aria-label="Следующее фото">
        <span class="detail-lightbox-nav-icon" aria-hidden="true"></span>
      </button>
    </div>
  `;

  const detailFavoriteBtn = document.getElementById("detailFavoriteBtn");
  const detailMainImage = document.getElementById("detailMainImage");
  const detailLightbox = document.getElementById("detailLightbox");
  const detailLightboxImage = document.getElementById("detailLightboxImage");
  const detailLightboxClose = document.getElementById("detailLightboxClose");
  const detailLightboxPrev = document.getElementById("detailLightboxPrev");
  const detailLightboxNext = document.getElementById("detailLightboxNext");
  const detailInlinePrev = document.getElementById("detailInlinePrev");
  const detailInlineNext = document.getElementById("detailInlineNext");
  let activeImageIndex = Math.max(0, safeGallery.findIndex((item) => item === safeImage));

  function setActiveImage(index) {
    if (safeGallery.length === 0) {
      return;
    }

    const normalizedIndex = (index + safeGallery.length) % safeGallery.length;
    activeImageIndex = normalizedIndex;
    const activeUrl = safeGallery[normalizedIndex];

    if (detailMainImage instanceof HTMLImageElement) {
      detailMainImage.src = activeUrl;
    }

    if (detailLightboxImage instanceof HTMLImageElement) {
      detailLightboxImage.src = activeUrl;
    }

    detailRoot.querySelectorAll(".detail-thumb-btn").forEach((item, itemIndex) => {
      item.classList.toggle("is-active", itemIndex === normalizedIndex);
    });
  }

  function openLightbox(index) {
    if (!(detailLightbox instanceof HTMLElement)) {
      return;
    }

    setActiveImage(index);
    detailLightbox.classList.remove("is-hidden");
    document.body.style.overflow = "hidden";
  }

  function closeLightbox() {
    if (!(detailLightbox instanceof HTMLElement)) {
      return;
    }

    detailLightbox.classList.add("is-hidden");
    document.body.style.overflow = "";
  }

  if (!detailFavoriteBtn) {
    return;
  }

  if (detailMainImage instanceof HTMLImageElement) {
    detailMainImage.addEventListener("click", () => {
      openLightbox(activeImageIndex);
    });

    detailRoot.querySelectorAll(".detail-thumb-btn").forEach((button) => {
      button.addEventListener("click", () => {
        const imageUrl = button.getAttribute("data-image");
        if (!imageUrl) {
          return;
        }

        const nextIndex = safeGallery.findIndex((item) => item === imageUrl);
        setActiveImage(nextIndex >= 0 ? nextIndex : 0);
      });

      button.addEventListener("dblclick", () => {
        const imageUrl = button.getAttribute("data-image");
        const nextIndex = safeGallery.findIndex((item) => item === imageUrl);
        openLightbox(nextIndex >= 0 ? nextIndex : 0);
      });
    });
  }

  if (detailInlinePrev instanceof HTMLButtonElement) {
    detailInlinePrev.addEventListener("click", () => setActiveImage(activeImageIndex - 1));
  }

  if (detailInlineNext instanceof HTMLButtonElement) {
    detailInlineNext.addEventListener("click", () => setActiveImage(activeImageIndex + 1));
  }

  if (
    detailLightbox instanceof HTMLElement &&
    detailLightboxClose instanceof HTMLButtonElement &&
    detailLightboxPrev instanceof HTMLButtonElement &&
    detailLightboxNext instanceof HTMLButtonElement
  ) {
    detailLightboxClose.addEventListener("click", closeLightbox);
    detailLightboxPrev.addEventListener("click", () => setActiveImage(activeImageIndex - 1));
    detailLightboxNext.addEventListener("click", () => setActiveImage(activeImageIndex + 1));

    detailLightbox.addEventListener("click", (event) => {
      const target = event.target;
      if (target === detailLightbox) {
        closeLightbox();
      }
    });

    document.addEventListener("keydown", (event) => {
      if (detailLightbox.classList.contains("is-hidden")) {
        return;
      }

      if (event.key === "Escape") {
        closeLightbox();
        return;
      }

      if (event.key === "ArrowLeft") {
        setActiveImage(activeImageIndex - 1);
        return;
      }

      if (event.key === "ArrowRight") {
        setActiveImage(activeImageIndex + 1);
      }
    });
  }

  detailFavoriteBtn.addEventListener("click", () => {
    const session = getCurrentUserForFavorites();
    if (!session) {
      window.location.href = "login.html?mode=login";
      return;
    }

    const favoriteState = toggleTourFavorite(tour.id);
    detailFavoriteBtn.classList.toggle("is-active", favoriteState);
    detailFavoriteBtn.textContent = favoriteState ? "★ В избранном" : "☆ В избранное";
  });

  const bookingForm = document.getElementById("tourBookingForm");
  const bookingName = document.getElementById("bookingName");
  const bookingPhone = document.getElementById("bookingPhone");
  const bookingComment = document.getElementById("bookingComment");
  const bookingMonth = document.getElementById("bookingMonth");
  const bookingAdults = document.getElementById("bookingAdults");
  const bookingChildren = document.getElementById("bookingChildren");
  const bookingBudget = document.getElementById("bookingBudget");
  const bookingHint = document.getElementById("bookingHint");

  if (
    bookingForm instanceof HTMLFormElement &&
    bookingName instanceof HTMLInputElement &&
    bookingPhone instanceof HTMLInputElement &&
    bookingComment instanceof HTMLTextAreaElement &&
    bookingMonth instanceof HTMLSelectElement &&
    bookingAdults instanceof HTMLInputElement &&
    bookingChildren instanceof HTMLInputElement &&
    bookingBudget instanceof HTMLInputElement &&
    bookingHint instanceof HTMLElement
  ) {
    bookingForm.addEventListener("submit", (event) => {
      event.preventDefault();

      const nameValue = bookingName.value.trim();
      const phoneValue = bookingPhone.value.trim();

      if (!nameValue || !phoneValue || !bookingMonth.value) {
        bookingHint.textContent = "Введите имя, телефон и месяц поездки для отправки заявки.";
        return;
      }

      const adults = Math.max(1, Number(bookingAdults.value || 1));
      const children = Math.max(0, Number(bookingChildren.value || 0));
      const extras = Array.from(bookingForm.querySelectorAll('.detail-booking-extras input[type="checkbox"]:checked')).map(
        (node) => String(node.value || "")
      );

      createBookingRequest({
        tourId: tour.id,
        name: nameValue,
        phone: phoneValue,
        comment: bookingComment.value.trim(),
        travelMonth: bookingMonth.value,
        adults,
        children,
        extras,
        estimatedBudget: Number(bookingBudget.value || 0)
      });

      bookingHint.textContent = "Заявка отправлена. Менеджер свяжется с вами в ближайшее время.";
      bookingForm.reset();
    });
  }

  const seasonMonth = document.getElementById("seasonMonth");
  const seasonPriceHint = document.getElementById("seasonPriceHint");
  const monthFactors = [1.05, 1.03, 1, 0.98, 1, 1.12, 1.2, 1.18, 1.02, 0.95, 0.93, 1.08];

  function updateSeasonPrice() {
    if (!(seasonMonth instanceof HTMLSelectElement) || !(seasonPriceHint instanceof HTMLElement)) {
      return;
    }

    const monthIndex = Math.min(11, Math.max(0, Number(seasonMonth.value || 0)));
    const factor = monthFactors[monthIndex] || 1;
    const seasonalPrice = Math.round(Number(tour.price || 0) * factor);
    seasonPriceHint.textContent = `Ориентировочная цена в выбранный месяц: ${formatEuro(seasonalPrice)}.`;
  }

  if (seasonMonth instanceof HTMLSelectElement) {
    seasonMonth.value = String(new Date().getMonth());
    seasonMonth.addEventListener("change", updateSeasonPrice);
    updateSeasonPrice();
  }

  const priceAlertForm = document.getElementById("priceAlertForm");
  const targetPrice = document.getElementById("targetPrice");
  const priceAlertHint = document.getElementById("priceAlertHint");

  if (
    priceAlertForm instanceof HTMLFormElement &&
    targetPrice instanceof HTMLInputElement &&
    priceAlertHint instanceof HTMLElement
  ) {
    priceAlertForm.addEventListener("submit", (event) => {
      event.preventDefault();

      const value = Number(targetPrice.value);
      if (!Number.isFinite(value) || value <= 0) {
        priceAlertHint.textContent = "Укажите корректную целевую цену.";
        return;
      }

      createPriceAlert(tour.id, value);
      priceAlertHint.textContent = "Уведомление сохранено. Мы сообщим при снижении цены.";
      priceAlertForm.reset();
    });
  }

  const relatedToursGrid = document.getElementById("relatedToursGrid");
  if (relatedToursGrid) {
    const relatedTours = readToursFromStorage()
      .filter((item) => item.id !== tour.id)
      .filter((item) => getTourCategory(item) === getTourCategory(tour))
      .slice(0, 3);

    relatedToursGrid.innerHTML =
      relatedTours.length > 0
        ? relatedTours.map((item) => renderTourCardMarkup(item, "Открыть тур")).join("")
        : '<p class="admin-empty">Пока нет похожих туров в этой категории.</p>';
  }
})();