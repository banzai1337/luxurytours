(function initAdminReviews() {
  if (typeof getAdminSession === "function" && !getAdminSession()) {
    return;
  }

  const reviewForm = document.getElementById("reviewForm");
  const reviewName = document.getElementById("reviewName");
  const reviewStars = document.getElementById("reviewStars");
  const reviewText = document.getElementById("reviewText");
  const reviewHint = document.getElementById("reviewHint");
  const reviewsAdminList = document.getElementById("reviewsAdminList");

  if (!reviewForm || !reviewName || !reviewStars || !reviewText || !reviewHint || !reviewsAdminList) {
    return;
  }

  let reviews = readReviewsFromStorage();

  function setHint(text) {
    reviewHint.textContent = text;
  }

  function resetForm() {
    reviewForm.reset();
    reviewStars.value = "5";
  }

  function renderList() {
    if (reviews.length === 0) {
      reviewsAdminList.innerHTML = '<p class="admin-empty">Отзывов пока нет.</p>';
      return;
    }

    reviewsAdminList.innerHTML = reviews
      .map((review) => {
        const safeId = escapeHtml(review.id);
        const safeName = escapeHtml(review.name);
        const safeText = escapeHtml(review.text);
        const safeStars = renderStars(review.stars);

        return `
          <article class="admin-review-item" data-id="${safeId}">
            <p class="admin-review-stars">${safeStars}</p>
            <h3>${safeName}</h3>
            <p>${safeText}</p>
            <button type="button" class="btn btn-secondary js-delete-review">Удалить</button>
          </article>
        `;
      })
      .join("");
  }

  function saveAndRender(message) {
    saveReviewsToStorage(reviews);
    renderList();
    setHint(message);
  }

  reviewForm.addEventListener("submit", (event) => {
    event.preventDefault();

    const name = reviewName.value.trim();
    const stars = Number(reviewStars.value);
    const text = reviewText.value.trim();

    if (!name) {
      setHint("Введите имя.");
      return;
    }

    if (!text) {
      setHint("Введите текст отзыва.");
      return;
    }

    const newReview = {
      id: `r-${Date.now()}`,
      name,
      stars: Math.min(5, Math.max(1, stars)),
      text
    };

    reviews.unshift(newReview);
    saveAndRender("Отзыв добавлен.");
    resetForm();
  });

  reviewsAdminList.addEventListener("click", (event) => {
    const target = event.target;
    if (!(target instanceof HTMLElement)) {
      return;
    }

    const deleteBtn = target.closest(".js-delete-review");
    if (!deleteBtn) {
      return;
    }

    const item = target.closest(".admin-review-item");
    if (!item) {
      return;
    }

    const id = item.getAttribute("data-id");
    if (!id) {
      return;
    }

    reviews = reviews.filter((review) => review.id !== id);
    saveAndRender("Отзыв удалён.");
  });

  renderList();
  resetForm();
})();
