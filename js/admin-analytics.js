(function renderAdminAnalytics() {
  if (typeof getAdminSession === "function" && !getAdminSession()) {
    return;
  }

  const adminAnalyticsGrid = document.getElementById("adminAnalyticsGrid");
  const adminSegmentsList = document.getElementById("adminSegmentsList");
  const adminBookingsPipeline = document.getElementById("adminBookingsPipeline");

  if (!adminAnalyticsGrid || !adminSegmentsList || !adminBookingsPipeline) {
    return;
  }

  function getTopTourByViews(tours) {
    if (!Array.isArray(tours) || tours.length === 0) {
      return null;
    }

    return [...tours].sort((firstTour, secondTour) => Number(secondTour.views || 0) - Number(firstTour.views || 0))[0];
  }

  function getUsersSegments(bookings) {
    const byUserMap = new Map();

    bookings.forEach((booking) => {
      const username = String(booking.username || "guest");
      const currentValue = byUserMap.get(username) || 0;
      byUserMap.set(username, currentValue + 1);
    });

    const users = Array.from(byUserMap.entries()).map(([username, bookingsCount]) => ({ username, bookingsCount }));

    const hotUsers = users.filter((item) => item.bookingsCount >= 2);
    const newUsers = users.filter((item) => item.bookingsCount === 1);

    return {
      hotUsers,
      newUsers
    };
  }

  function render() {
    const tours = readToursFromStorage();
    const bookings = readBookingsFromStorage();
    const alerts = readPriceAlertsFromStorage();
    const reviews = typeof readReviewsFromStorage === "function" ? readReviewsFromStorage() : [];
    const topTour = getTopTourByViews(tours);
    const funnel = getFunnelAnalytics();
    const totalViews = tours.reduce((sum, tour) => sum + Number(tour.views || 0), 0);
    const favoriteCounts = tours.reduce((sum, tour) => {
      const allKeys = Object.keys(localStorage).filter((key) => key.startsWith("agencyFavorites:"));
      return (
        sum +
        allKeys.reduce((tourFavs, key) => {
          try {
            const ids = JSON.parse(localStorage.getItem(key) || "[]");
            return tourFavs + (Array.isArray(ids) && ids.includes(String(tour.id)) ? 1 : 0);
          } catch (error) {
            return tourFavs;
          }
        }, 0)
      );
    }, 0);

    adminAnalyticsGrid.innerHTML = `
      <article class="admin-analytics-item">
        <h3>Всего туров</h3>
        <p>${tours.length}</p>
      </article>
      <article class="admin-analytics-item">
        <h3>Всего просмотров</h3>
        <p>${totalViews}</p>
      </article>
      <article class="admin-analytics-item">
        <h3>Заявок</h3>
        <p>${bookings.length}</p>
      </article>
      <article class="admin-analytics-item">
        <h3>Уведомлений о цене</h3>
        <p>${alerts.length}</p>
      </article>
      <article class="admin-analytics-item">
        <h3>Отзывов</h3>
        <p>${reviews.length}</p>
      </article>
      <article class="admin-analytics-item">
        <h3>Избранных добавлений</h3>
        <p>${favoriteCounts}</p>
      </article>
      <article class="admin-analytics-item">
        <h3>Топ тур</h3>
        <p>${escapeHtml(topTour ? topTour.title : "—")}</p>
      </article>
      <article class="admin-analytics-item">
        <h3>Воронка: просмотры → заявки</h3>
        <p>${funnel.viewCount} → ${funnel.bookingCount} (${funnel.conversionToBooking}%)</p>
      </article>
      <article class="admin-analytics-item">
        <h3>Воронка: заявки → оплаты</h3>
        <p>${funnel.bookingCount} → ${funnel.paidCount} (${funnel.conversionToPaid}%)</p>
      </article>
    `;

    const segments = getUsersSegments(bookings);
    const hotUsersMarkup =
      segments.hotUsers.length === 0
        ? "<p class=\"admin-empty\">Пока нет активных клиентов.</p>"
        : segments.hotUsers
            .map((item) => `<p><strong>${escapeHtml(item.username)}</strong> — ${item.bookingsCount} заявок</p>`)
            .join("");

    const newUsersMarkup =
      segments.newUsers.length === 0
        ? "<p class=\"admin-empty\">Новых клиентов пока нет.</p>"
        : segments.newUsers
            .map((item) => `<p><strong>${escapeHtml(item.username)}</strong> — первый запрос</p>`)
            .join("");

    adminSegmentsList.innerHTML = `
      <article class="admin-segment-item">
        <h3>Сегмент: Высокий интерес</h3>
        ${hotUsersMarkup}
      </article>
      <article class="admin-segment-item">
        <h3>Сегмент: Новые пользователи</h3>
        ${newUsersMarkup}
      </article>
    `;

    const statusLabel = {
      new: "Новая",
      "in-progress": "В обработке",
      confirmed: "Подтверждена",
      paid: "Оплачена",
      cancelled: "Отменена"
    };

    const bookingsMarkup = bookings
      .slice(0, 8)
      .map((booking) => {
        const tourTitle = getTourById(booking.tourId)?.title || "Удаленный тур";
        const safeCurrentStatus = String(booking.status || "new");

        return `
          <article class="admin-booking-item" data-booking-id="${escapeHtml(booking.id)}">
            <div>
              <h3>${escapeHtml(tourTitle)}</h3>
              <p>${escapeHtml(String(booking.name || booking.username || "Клиент"))} · ${escapeHtml(
                String(booking.phone || "—")
              )}</p>
            </div>
            <select class="admin-booking-status-select" data-booking-id="${escapeHtml(booking.id)}">
              <option value="new"${safeCurrentStatus === "new" ? " selected" : ""}>${statusLabel.new}</option>
              <option value="in-progress"${safeCurrentStatus === "in-progress" ? " selected" : ""}>${
          statusLabel["in-progress"]
        }</option>
              <option value="confirmed"${safeCurrentStatus === "confirmed" ? " selected" : ""}>${
          statusLabel.confirmed
        }</option>
              <option value="paid"${safeCurrentStatus === "paid" ? " selected" : ""}>${statusLabel.paid}</option>
              <option value="cancelled"${safeCurrentStatus === "cancelled" ? " selected" : ""}>${
          statusLabel.cancelled
        }</option>
            </select>
          </article>
        `;
      })
      .join("");

    adminBookingsPipeline.innerHTML = `
      <h3>Заявки и статусы</h3>
      ${bookings.length === 0 ? '<p class="admin-empty">Заявок пока нет.</p>' : bookingsMarkup}
    `;

    adminBookingsPipeline.querySelectorAll(".admin-booking-status-select").forEach((node) => {
      node.addEventListener("change", (event) => {
        const target = event.target;
        if (!(target instanceof HTMLSelectElement)) {
          return;
        }

        const bookingId = target.getAttribute("data-booking-id");
        if (!bookingId) {
          return;
        }

        updateBookingStatus(bookingId, target.value);
        render();
      });
    });
  }

  render();
  window.addEventListener("storage", render);
})();
