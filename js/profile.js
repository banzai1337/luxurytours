(function initProfilePage() {
  const profileInfo = document.getElementById("profileInfo");
  const profileLogoutBtn = document.getElementById("profileLogoutBtn");
  const profileFavoritesGrid = document.getElementById("profileFavoritesGrid");
  const profileViewedGrid = document.getElementById("profileViewedGrid");
  const profileBookingsList = document.getElementById("profileBookingsList");
  const profileRecommendedGrid = document.getElementById("profileRecommendedGrid");
  const profileLogin = document.getElementById("profileLogin");
  const profileEmail = document.getElementById("profileEmail");
  const profilePassword = document.getElementById("profilePassword");
  const togglePasswordBtn = document.getElementById("togglePasswordBtn");

  if (
    !profileInfo ||
    !profileLogoutBtn ||
    !profileFavoritesGrid ||
    !profileViewedGrid ||
    !profileBookingsList ||
    !profileRecommendedGrid ||
    !profileLogin ||
    !profileEmail ||
    !profilePassword ||
    !togglePasswordBtn
  ) {
    return;
  }

  const session = getUserSession();
  if (!session) {
    window.location.href = "login.html?mode=login";
    return;
  }

  const loginDate = new Date(session.loginAt || Date.now()).toLocaleString("ru-RU");

  getUserByUsername(session.username)
    .then((user) => {
      profileInfo.textContent = `Последний вход: ${loginDate}.`;
      profileLogin.textContent = user?.username || session.username || "—";
      profileEmail.textContent = user?.email || session.email || "—";
      profilePassword.value = user?.password || "";
    })
    .catch(() => {
      profileInfo.textContent = `Последний вход: ${loginDate}.`;
      profileLogin.textContent = session.username || "—";
      profileEmail.textContent = session.email || "—";
      profilePassword.value = "";
    });

  togglePasswordBtn.addEventListener("click", () => {
    const isHidden = profilePassword.type === "password";
    profilePassword.type = isHidden ? "text" : "password";
    togglePasswordBtn.textContent = isHidden ? "🙈" : "👁";
    togglePasswordBtn.setAttribute("aria-label", isHidden ? "Скрыть пароль" : "Показать пароль");
  });

  function renderFavorites() {
    const allTours = readToursFromStorage();
    const favoriteIds = readFavoriteTourIds();

    const favorites = favoriteIds
      .map((id) => allTours.find((tour) => String(tour.id) === String(id)))
      .filter(Boolean);

    if (favorites.length === 0) {
      profileFavoritesGrid.innerHTML = '<p class="admin-empty">Пока нет избранных туров.</p>';
      return;
    }

    profileFavoritesGrid.innerHTML = favorites.map((tour) => renderTourCardMarkup(tour, "Открыть тур")).join("");
  }

  function renderViewedTours() {
    const allTours = readToursFromStorage();
    const viewedIds = readViewedTourIds();
    const viewedTours = viewedIds
      .map((id) => allTours.find((tour) => String(tour.id) === String(id)))
      .filter(Boolean)
      .slice(0, 6);

    if (viewedTours.length === 0) {
      profileViewedGrid.innerHTML = '<p class="admin-empty">Вы еще не открывали туры.</p>';
      return;
    }

    profileViewedGrid.innerHTML = viewedTours.map((tour) => renderTourCardMarkup(tour, "Открыть тур")).join("");
  }

  function renderBookings() {
    const bookings = readBookingsForCurrentUser();
    if (bookings.length === 0) {
      profileBookingsList.innerHTML = '<p class="admin-empty">Заявок пока нет.</p>';
      return;
    }

    const activeCount = bookings.filter((booking) => ["new", "in-progress", "confirmed"].includes(booking.status)).length;
    const paidCount = bookings.filter((booking) => booking.status === "paid").length;

    const statusLabelMap = {
      new: "Новая",
      "in-progress": "В обработке",
      confirmed: "Подтверждена",
      paid: "Оплачена",
      cancelled: "Отменена"
    };

    profileBookingsList.innerHTML = bookings
      .slice(0, 10)
      .map((booking) => {
        const tour = getTourById(booking.tourId);
        const safeTourTitle = escapeHtml(tour?.title || "Удаленный тур");
        const safeCreatedAt = escapeHtml(new Date(booking.createdAt || Date.now()).toLocaleString("ru-RU"));
        const safePhone = escapeHtml(String(booking.phone || "—"));
        const safeStatus = escapeHtml(statusLabelMap[booking.status] || "Новая");
        const travelers = `${Number(booking.adults || 1)} взр. + ${Number(booking.children || 0)} дет.`;
        const extras = Array.isArray(booking.extras) && booking.extras.length > 0 ? booking.extras.join(", ") : "—";
        const month = escapeHtml(String(booking.travelMonth || "—"));

        return `
          <article class="profile-booking-item">
            <h3>${safeTourTitle}</h3>
            <p>Дата: ${safeCreatedAt}</p>
            <p>Телефон: ${safePhone}</p>
            <p>Месяц поездки: ${month}</p>
            <p>Туристы: ${escapeHtml(travelers)}</p>
            <p>Доп. услуги: ${escapeHtml(extras)}</p>
            <p>Статус: ${safeStatus}</p>
          </article>
        `;
      })
      .join("");

    profileBookingsList.innerHTML = `
      <article class="profile-booking-summary card">
        <p><strong>Активных заявок:</strong> ${activeCount}</p>
        <p><strong>Оплачено:</strong> ${paidCount}</p>
      </article>
      ${profileBookingsList.innerHTML}
    `;
  }

  function renderRecommendations() {
    const recommended = getRecommendedTours(3);
    if (recommended.length === 0) {
      profileRecommendedGrid.innerHTML = '<p class="admin-empty">Рекомендации появятся после активности в каталоге.</p>';
      return;
    }

    profileRecommendedGrid.innerHTML = recommended
      .map((tour) => renderTourCardMarkup(tour, "Открыть тур"))
      .join("");
  }

  profileFavoritesGrid.addEventListener("click", (event) => {
    const target = event.target;
    if (!(target instanceof HTMLElement)) {
      return;
    }

    const favBtn = target.closest(".js-favorite-btn");
    if (!favBtn) {
      return;
    }

    const tourId = favBtn.getAttribute("data-tour-id");
    if (!tourId) {
      return;
    }

    toggleTourFavorite(tourId);
    renderFavorites();
  });

  renderFavorites();
  renderViewedTours();
  renderBookings();
  renderRecommendations();

  profileLogoutBtn.addEventListener("click", () => {
    logoutUserSession();
    window.location.href = "login.html?mode=login";
  });
})();