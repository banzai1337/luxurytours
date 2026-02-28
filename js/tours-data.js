const TOUR_STORAGE_KEY = "agencyTours";
const TELEGRAM_USERNAME = "LuxuryToursPL";
const TOUR_FALLBACK_IMAGE =
  "https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?auto=format&fit=crop&w=900&q=80";
const FAVORITES_STORAGE_PREFIX = "agencyFavorites";
const VIEW_HISTORY_STORAGE_PREFIX = "agencyViewedTours";
const BOOKING_STORAGE_KEY = "agencyBookings";
const PRICE_ALERTS_STORAGE_KEY = "agencyPriceAlerts";
const ANALYTICS_EVENTS_STORAGE_KEY = "agencyAnalyticsEvents";
const TOURS_API_ENDPOINT = "/api/tours";
const TOUR_CATEGORY_OPTIONS = [
  "Пляжные направления",
  "Горные маршруты",
  "Семейный отдых",
  "Экскурсионные туры",
  "Релакс и SPA",
  "Гастрономические",
  "Романтические",
  "Активные приключения",
  "Круизы",
  "Городские уикенды",
  "Эко-туры",
  "Премиум отдых"
];

const TOUR_CATEGORY_KEYWORDS = {
  "Пляжные направления": ["пляж", "море", "океан", "побереж", "остров", "лагун", "дайв"],
  "Горные маршруты": ["гор", "альп", "трек", "поход", "вершин", "каньон"],
  "Семейный отдых": ["семь", "дет", "ребен", "семейн", "family"],
  "Экскурсионные туры": ["экскурс", "музей", "истор", "город", "архитектур", "достопримеч"],
  "Релакс и SPA": ["relax", "релакс", "spa", "спа", "велнес", "йога", "массаж"],
  "Гастрономические": ["гастро", "кухн", "дегустац", "вино", "ресторан", "food"],
  "Романтические": ["романт", "медов", "пара", "свад", "love"],
  "Активные приключения": ["рафт", "сафари", "джип", "актив", "приключ", "квадро", "серф"],
  "Круизы": ["круиз", "лайнер", "палуб", "порт", "морской переход"],
  "Городские уикенды": ["уикенд", "weekend", "city break", "городской", "короткий"],
  "Эко-туры": ["эко", "природ", "нацпарк", "заповед", "устойчив", "green"],
  "Премиум отдых": ["премиум", "vip", "люкс", "5*", "бутик-отель", "private"]
};

const DEFAULT_TOURS = [
  {
    id: "t1",
    title: "Альпийский уикенд",
    description: "Шале, прогулки по горным тропам и панорамные виды на рассвете.",
    price: 58000,
    duration: "5 + 1",
    views: 0,
    categories: ["Горные маршруты", "Активные приключения"],
    image:
      "https://images.unsplash.com/photo-1469474968028-56623f02e42e?auto=format&fit=crop&w=900&q=80"
  },
  {
    id: "t2",
    title: "Средиземноморское побережье",
    description: "Тёплое море, старинные кварталы и расслабленный ритм отдыха.",
    price: 74000,
    duration: "7 + 1",
    views: 0,
    categories: ["Пляжные направления", "Экскурсионные туры"],
    image:
      "https://images.unsplash.com/photo-1493558103817-58b2924bce98?auto=format&fit=crop&w=900&q=80"
  },
  {
    id: "t3",
    title: "Марокканские маршруты",
    description: "Восточный колорит, рынки специй, пустыня и уютные риады.",
    price: 81000,
    duration: "8 + 2",
    views: 0,
    categories: ["Экскурсионные туры", "Гастрономические"],
    image:
      "https://images.unsplash.com/photo-1501785888041-af3ef285b470?auto=format&fit=crop&w=900&q=80"
  },
  {
    id: "t4",
    title: "Островной ретрит",
    description: "Спокойный отдых у воды, йога на рассвете и эко-отели.",
    price: 69000,
    duration: "6 + 1",
    views: 0,
    categories: ["Релакс и SPA", "Эко-туры"],
    image:
      "https://images.unsplash.com/photo-1483683804023-6ccdb62f86ef?auto=format&fit=crop&w=900&q=80"
  }
];

function getTourCategoryOptions() {
  return [...TOUR_CATEGORY_OPTIONS];
}

function getTelegramLink() {
  return `https://t.me/${TELEGRAM_USERNAME}`;
}

function escapeHtml(value) {
  return String(value || "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function sanitizeUrl(url, fallback = "") {
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

function sanitizeImageUrl(url, fallback = TOUR_FALLBACK_IMAGE) {
  const raw = String(url || "").trim();
  if (!raw) {
    return fallback;
  }

  if (/^data:image\/[a-zA-Z0-9.+-]+;base64,/.test(raw)) {
    return raw;
  }

  return sanitizeUrl(raw, fallback);
}

function normalizeTourImages(images, image) {
  const source = [];

  if (Array.isArray(images)) {
    source.push(...images);
  }

  if (image) {
    source.unshift(image);
  }

  const normalized = source
    .map((item) => sanitizeImageUrl(item, ""))
    .filter(Boolean);

  if (normalized.length === 0) {
    return [TOUR_FALLBACK_IMAGE];
  }

  return Array.from(new Set(normalized));
}

function getCurrentUserForFavorites() {
  if (typeof getUserSession !== "function") {
    return null;
  }

  return getUserSession();
}

function getFavoritesStorageKey() {
  const session = getCurrentUserForFavorites();
  if (!session || !session.username) {
    return null;
  }

  return `${FAVORITES_STORAGE_PREFIX}:${session.username}`;
}

function getCurrentUsername() {
  const session = getCurrentUserForFavorites();
  return session && session.username ? String(session.username) : "";
}

function getViewHistoryStorageKey() {
  const username = getCurrentUsername();
  if (!username) {
    return null;
  }

  return `${VIEW_HISTORY_STORAGE_PREFIX}:${username}`;
}

function readFavoriteTourIds() {
  const key = getFavoritesStorageKey();
  if (!key) {
    return [];
  }

  const raw = localStorage.getItem(key);
  if (!raw) {
    return [];
  }

  try {
    const ids = JSON.parse(raw);
    return Array.isArray(ids) ? ids.map((id) => String(id)) : [];
  } catch (error) {
    return [];
  }
}

function saveFavoriteTourIds(ids) {
  const key = getFavoritesStorageKey();
  if (!key) {
    return;
  }

  localStorage.setItem(key, JSON.stringify(ids));
}

function isTourFavorite(tourId) {
  return readFavoriteTourIds().includes(String(tourId));
}

function toggleTourFavorite(tourId) {
  const targetId = String(tourId || "");
  const ids = readFavoriteTourIds();
  const exists = ids.includes(targetId);

  if (exists) {
    const nextIds = ids.filter((id) => id !== targetId);
    saveFavoriteTourIds(nextIds);
    return false;
  }

  ids.unshift(targetId);
  saveFavoriteTourIds(ids);
  return true;
}

function renderFavoriteButtonMarkup(tourId) {
  const safeTourId = escapeHtml(tourId);
  const session = getCurrentUserForFavorites();
  const isFavorite = session ? isTourFavorite(tourId) : false;
  const label = isFavorite ? "★ В избранном" : "☆ В избранное";
  const activeClass = isFavorite ? " is-active" : "";

  return `<button type="button" class="btn btn-secondary tour-fav-btn js-favorite-btn${activeClass}" data-tour-id="${safeTourId}">${label}</button>`;
}

function formatEuro(price) {
  return `${Number(price || 0).toLocaleString("ru-RU")} €`;
}

function normalizeDuration(value) {
  const raw = String(value || "").trim();
  const strictMatch = raw.match(/^(\d+)\s*\+\s*(\d+)$/);

  if (strictMatch) {
    return `${Number(strictMatch[1])} + ${Number(strictMatch[2])}`;
  }

  const fallbackMatch = raw.match(/^(\d+)/);
  if (fallbackMatch) {
    return `${Number(fallbackMatch[1])} + 0`;
  }

  return "0 + 0";
}

function formatDurationLabel(value) {
  const normalized = normalizeDuration(value);
  const [days, travelDays] = normalized.split(" + ");
  return `${days} дней + ${travelDays} в дороге`;
}

function normalizeViews(value) {
  const numericValue = Number(value);
  if (!Number.isFinite(numericValue) || numericValue < 0) {
    return 0;
  }

  return Math.floor(numericValue);
}

function normalizeCategories(categories, tour) {
  const source = Array.isArray(categories) ? categories : [];
  const normalized = source
    .map((item) => String(item || "").trim())
    .filter((item) => item && TOUR_CATEGORY_OPTIONS.includes(item));

  if (normalized.length > 0) {
    return Array.from(new Set(normalized));
  }

  const fallback = getTourCategoryByText(tour);
  return fallback ? [fallback] : ["Экскурсионные туры"];
}

function getTourCategoryByText(tour) {
  const text = `${tour?.title || ""} ${tour?.description || ""}`.toLowerCase();

  if (text.includes("остров") || text.includes("море") || text.includes("побереж") || text.includes("пляж")) {
    return "Пляжные направления";
  }

  if (text.includes("альп") || text.includes("гор") || text.includes("трек") || text.includes("маршрут")) {
    return "Горные маршруты";
  }

  if (text.includes("ретрит") || text.includes("йога") || text.includes("спокой") || text.includes("spa")) {
    return "Релакс и SPA";
  }

  if (text.includes("семь") || text.includes("дет") || text.includes("family")) {
    return "Семейный отдых";
  }

  return "Экскурсионные туры";
}

function normalizeTour(tour, index) {
  const images = normalizeTourImages(tour.images, tour.image);

  return {
    id: String(tour.id || `t${Date.now()}-${index}`),
    title: String(tour.title || ""),
    description: String(tour.description || ""),
    price: Number(tour.price || 0),
    duration: normalizeDuration(tour.duration),
    views: normalizeViews(tour.views),
    categories: normalizeCategories(tour.categories, tour),
    image: images[0],
    images
  };
}

function readToursFromStorage() {
  const raw = localStorage.getItem(TOUR_STORAGE_KEY);
  if (!raw) {
    localStorage.setItem(TOUR_STORAGE_KEY, JSON.stringify(DEFAULT_TOURS));
    return [...DEFAULT_TOURS];
  }

  try {
    const tours = JSON.parse(raw);
    if (!Array.isArray(tours)) {
      throw new Error("Invalid tours format");
    }

    return tours.map((tour, index) => normalizeTour(tour, index));
  } catch (error) {
    localStorage.setItem(TOUR_STORAGE_KEY, JSON.stringify(DEFAULT_TOURS));
    return [...DEFAULT_TOURS];
  }
}

async function hydrateToursFromApi() {
  try {
    const response = await fetch(TOURS_API_ENDPOINT);
    if (!response.ok) {
      return;
    }

    const payload = await response.json();
    if (!Array.isArray(payload)) {
      return;
    }

    const normalized = payload.map((tour, index) => normalizeTour(tour, index));
    if (normalized.length === 0) {
      return;
    }

    localStorage.setItem(TOUR_STORAGE_KEY, JSON.stringify(normalized));
    window.dispatchEvent(new CustomEvent("agency:tours-updated", { detail: { source: "api" } }));
  } catch (error) {
  }
}

function saveToursToStorage(tours) {
  localStorage.setItem(TOUR_STORAGE_KEY, JSON.stringify(tours));
}

function getTourById(id) {
  return readToursFromStorage().find((tour) => tour.id === id);
}

function incrementTourViews(id) {
  const tours = readToursFromStorage();
  const tourIndex = tours.findIndex((tour) => tour.id === id);

  if (tourIndex === -1) {
    return 0;
  }

  const currentViews = normalizeViews(tours[tourIndex].views);
  tours[tourIndex].views = currentViews + 1;
  saveToursToStorage(tours);
  return tours[tourIndex].views;
}

function getTourCategory(tour) {
  const categories = Array.isArray(tour?.categories) ? tour.categories : [];
  if (categories.length > 0) {
    return String(categories[0]);
  }

  return getTourCategoryByText(tour);
}

function getTourCategories(tour) {
  return normalizeCategories(tour?.categories, tour);
}

function suggestTourCategoriesByText(title, description, maxCount = 4) {
  const combinedText = `${String(title || "")} ${String(description || "")}`.toLowerCase().trim();
  if (!combinedText) {
    return [];
  }

  const scored = TOUR_CATEGORY_OPTIONS.map((category) => {
    const keywords = TOUR_CATEGORY_KEYWORDS[category] || [];
    const score = keywords.reduce((total, keyword) => {
      if (!keyword) {
        return total;
      }

      return combinedText.includes(keyword) ? total + 1 : total;
    }, 0);

    return { category, score };
  });

  const sorted = scored
    .filter((item) => item.score > 0)
    .sort((firstItem, secondItem) => secondItem.score - firstItem.score)
    .slice(0, Math.max(1, Number(maxCount) || 4))
    .map((item) => item.category);

  if (sorted.length > 0) {
    return sorted;
  }

  const fallback = getTourCategoryByText({ title, description });
  return fallback ? [fallback] : [];
}

function readViewedTourIds() {
  const key = getViewHistoryStorageKey();
  if (!key) {
    return [];
  }

  const raw = localStorage.getItem(key);
  if (!raw) {
    return [];
  }

  try {
    const ids = JSON.parse(raw);
    return Array.isArray(ids) ? ids.map((id) => String(id)) : [];
  } catch (error) {
    return [];
  }
}

function saveViewedTourIds(ids) {
  const key = getViewHistoryStorageKey();
  if (!key) {
    return;
  }

  localStorage.setItem(key, JSON.stringify(ids));
}

function addTourToViewedHistory(tourId) {
  const targetId = String(tourId || "");
  if (!targetId) {
    return;
  }

  const ids = readViewedTourIds().filter((id) => id !== targetId);
  ids.unshift(targetId);
  saveViewedTourIds(ids.slice(0, 30));
}

function readBookingsFromStorage() {
  const raw = localStorage.getItem(BOOKING_STORAGE_KEY);
  if (!raw) {
    return [];
  }

  try {
    const bookings = JSON.parse(raw);
    return Array.isArray(bookings) ? bookings : [];
  } catch (error) {
    return [];
  }
}

function saveBookingsToStorage(bookings) {
  localStorage.setItem(BOOKING_STORAGE_KEY, JSON.stringify(bookings));
}

function createBookingRequest({
  tourId,
  name,
  phone,
  comment,
  travelMonth,
  adults,
  children,
  extras,
  estimatedBudget
}) {
  const normalizedAdults = Math.max(1, Number(adults || 1));
  const normalizedChildren = Math.max(0, Number(children || 0));
  const normalizedExtras = Array.isArray(extras)
    ? extras.map((item) => String(item || "").trim()).filter(Boolean)
    : [];

  const username = getCurrentUsername();
  const newBooking = {
    id: `b-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    tourId: String(tourId || ""),
    username: username || "guest",
    name: String(name || "").trim(),
    phone: String(phone || "").trim(),
    comment: String(comment || "").trim(),
    travelMonth: String(travelMonth || ""),
    adults: normalizedAdults,
    children: normalizedChildren,
    extras: normalizedExtras,
    estimatedBudget: Number(estimatedBudget || 0),
    createdAt: Date.now(),
    status: "new",
    statusHistory: [{ status: "new", date: Date.now() }]
  };

  const bookings = readBookingsFromStorage();
  bookings.unshift(newBooking);
  saveBookingsToStorage(bookings.slice(0, 500));
  trackAnalyticsEvent("booking_created", {
    tourId: newBooking.tourId,
    username: newBooking.username,
    adults: newBooking.adults,
    children: newBooking.children
  });
  return newBooking;
}

function updateBookingStatus(bookingId, status) {
  const normalizedStatus = ["new", "in-progress", "confirmed", "paid", "cancelled"].includes(status)
    ? status
    : "new";

  const bookings = readBookingsFromStorage();
  let updatedBooking = null;
  const nextBookings = bookings.map((booking) => {
    if (String(booking.id) !== String(bookingId)) {
      return booking;
    }

    updatedBooking = {
      ...booking,
      status: normalizedStatus,
      statusHistory: [
        ...(Array.isArray(booking.statusHistory) ? booking.statusHistory : []),
        { status: normalizedStatus, date: Date.now() }
      ].slice(-20)
    };

    return updatedBooking;
  });

  saveBookingsToStorage(nextBookings);
  if (updatedBooking) {
    trackAnalyticsEvent("booking_status_changed", {
      bookingId: updatedBooking.id,
      status: normalizedStatus,
      tourId: updatedBooking.tourId
    });
  }

  return updatedBooking;
}

function readBookingsForCurrentUser() {
  const username = getCurrentUsername();
  if (!username) {
    return [];
  }

  return readBookingsFromStorage().filter((booking) => booking.username === username);
}

function readPriceAlertsFromStorage() {
  const raw = localStorage.getItem(PRICE_ALERTS_STORAGE_KEY);
  if (!raw) {
    return [];
  }

  try {
    const alerts = JSON.parse(raw);
    return Array.isArray(alerts) ? alerts : [];
  } catch (error) {
    return [];
  }
}

function savePriceAlertsToStorage(alerts) {
  localStorage.setItem(PRICE_ALERTS_STORAGE_KEY, JSON.stringify(alerts));
}

function createPriceAlert(tourId, targetPrice) {
  const username = getCurrentUsername() || "guest";
  const alerts = readPriceAlertsFromStorage();
  alerts.unshift({
    id: `a-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    username,
    tourId: String(tourId || ""),
    targetPrice: Number(targetPrice || 0),
    createdAt: Date.now()
  });

  savePriceAlertsToStorage(alerts.slice(0, 500));
  trackAnalyticsEvent("price_alert_created", {
    tourId: String(tourId || ""),
    username
  });
}

function readAnalyticsEvents() {
  const raw = localStorage.getItem(ANALYTICS_EVENTS_STORAGE_KEY);
  if (!raw) {
    return [];
  }

  try {
    const events = JSON.parse(raw);
    return Array.isArray(events) ? events : [];
  } catch (error) {
    return [];
  }
}

function saveAnalyticsEvents(events) {
  localStorage.setItem(ANALYTICS_EVENTS_STORAGE_KEY, JSON.stringify(events));
}

function trackAnalyticsEvent(type, payload = {}) {
  const normalizedType = String(type || "unknown").trim() || "unknown";
  const username = getCurrentUsername() || "guest";
  const events = readAnalyticsEvents();
  events.unshift({
    id: `e-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    type: normalizedType,
    username,
    payload,
    createdAt: Date.now()
  });
  saveAnalyticsEvents(events.slice(0, 2000));
}

function getFunnelAnalytics() {
  const events = readAnalyticsEvents();
  const viewCount = events.filter((item) => item.type === "tour_opened").length;
  const compareCount = events.filter((item) => item.type === "tour_compared").length;
  const bookingCount = events.filter((item) => item.type === "booking_created").length;
  const paidCount = events.filter(
    (item) => item.type === "booking_status_changed" && item.payload?.status === "paid"
  ).length;

  return {
    viewCount,
    compareCount,
    bookingCount,
    paidCount,
    conversionToBooking: viewCount > 0 ? Math.round((bookingCount / viewCount) * 100) : 0,
    conversionToPaid: bookingCount > 0 ? Math.round((paidCount / bookingCount) * 100) : 0
  };
}

function getAIAssistantTourSuggestions(prompt, options = {}) {
  const sourceTours = Array.isArray(options.tours) ? options.tours : readToursFromStorage();
  const rawPrompt = String(prompt || "").toLowerCase().trim();
  if (!rawPrompt) {
    return sourceTours.slice(0, 3);
  }

  const budgetMatch = rawPrompt.match(/(\d{2,7})/);
  const budget = budgetMatch ? Number(budgetMatch[1]) : null;
  const categoriesFromPrompt = suggestTourCategoriesByText(rawPrompt, rawPrompt, 3);

  const scored = sourceTours.map((tour) => {
    let score = 0;
    const categories = getTourCategories(tour);
    const text = `${tour.title} ${tour.description}`.toLowerCase();

    categoriesFromPrompt.forEach((category) => {
      if (categories.includes(category)) {
        score += 4;
      }
    });

    if (budget && Number(tour.price || 0) <= budget) {
      score += 3;
    }

    rawPrompt.split(/\s+/).forEach((token) => {
      if (token.length > 2 && text.includes(token)) {
        score += 1;
      }
    });

    score += Math.min(3, Math.floor(Number(tour.views || 0) / 5));
    return { tour, score };
  });

  return scored
    .sort((firstItem, secondItem) => secondItem.score - firstItem.score)
    .map((item) => item.tour)
    .slice(0, 3);
}

function getRecommendedTours(limit = 3) {
  const tours = readToursFromStorage();
  if (tours.length === 0) {
    return [];
  }

  const favoriteIds = new Set(readFavoriteTourIds());
  const viewedIds = readViewedTourIds();
  const categoryScoreMap = new Map();

  viewedIds.forEach((tourId, index) => {
    const tour = tours.find((item) => String(item.id) === String(tourId));
    if (!tour) {
      return;
    }

    const category = getTourCategory(tour);
    const current = categoryScoreMap.get(category) || 0;
    categoryScoreMap.set(category, current + Math.max(1, 10 - index));
  });

  tours.forEach((tour) => {
    if (favoriteIds.has(String(tour.id))) {
      const category = getTourCategory(tour);
      const current = categoryScoreMap.get(category) || 0;
      categoryScoreMap.set(category, current + 8);
    }
  });

  return tours
    .filter((tour) => !favoriteIds.has(String(tour.id)))
    .sort((firstTour, secondTour) => {
      const firstCategoryScore = categoryScoreMap.get(getTourCategory(firstTour)) || 0;
      const secondCategoryScore = categoryScoreMap.get(getTourCategory(secondTour)) || 0;
      if (secondCategoryScore !== firstCategoryScore) {
        return secondCategoryScore - firstCategoryScore;
      }

      return Number(secondTour.views || 0) - Number(firstTour.views || 0);
    })
    .slice(0, Math.max(1, Number(limit) || 3));
}

function getTourPreviewText(description, maxLength = 78) {
  const text = String(description || "");
  if (text.length <= maxLength) {
    return text;
  }

  return `${text.slice(0, maxLength)}...`;
}

function getTourVisualScore(tour) {
  const source = String(tour?.id || "") + String(tour?.title || "");
  const hash = source.split("").reduce((total, char) => total + char.charCodeAt(0), 0);
  const rating = 4.6 + ((hash % 5) / 10);
  return rating.toFixed(1);
}

function getTourSlotsLeft(tour) {
  const source = String(tour?.id || "") + String(tour?.duration || "");
  const hash = source.split("").reduce((total, char) => total + char.charCodeAt(0), 0);
  return 4 + (hash % 7);
}

function renderTourCardMarkup(tour, actionLabel = "Открыть тур") {
  const safeTitle = escapeHtml(tour.title);
  const safeDescription = escapeHtml(getTourPreviewText(tour.description));
  const safeDuration = escapeHtml(formatDurationLabel(tour.duration));
  const safeImage = sanitizeImageUrl(tour.image, TOUR_FALLBACK_IMAGE);
  const safeFallbackImage = sanitizeImageUrl(TOUR_FALLBACK_IMAGE, TOUR_FALLBACK_IMAGE);
  const safePrice = escapeHtml(formatEuro(tour.price));
  const safeTourId = encodeURIComponent(String(tour.id || ""));
  const safeRating = escapeHtml(getTourVisualScore(tour));
  const safeSlots = escapeHtml(String(getTourSlotsLeft(tour)));

  return `
    <article class="card tour-card">
      <div class="tour-media-wrap">
        <img src="${safeImage}" alt="${safeTitle}" loading="lazy" onerror="this.onerror=null;this.src='${safeFallbackImage}';" />
        <span class="tour-rating-badge" aria-label="Рейтинг ${safeRating}">☆ ${safeRating}</span>
      </div>
      <div class="tour-content">
        <h3 class="tour-title">${safeTitle}</h3>
        <p class="tour-duration">◷ ${safeDuration}</p>
        <p class="tour-description">${safeDescription}</p>

        <div class="tour-card-footer">
          <div class="tour-price-wrap">
            <span class="tour-price-label">от</span>
            <strong class="tour-price-value">${safePrice}</strong>
          </div>
          <a class="btn btn-primary tour-action" href="tour.html?id=${safeTourId}">${escapeHtml(actionLabel === "Открыть тур" ? "Подробнее" : actionLabel)}</a>
        </div>

        <p class="tour-slots">◷ Осталось ${safeSlots} мест</p>
      </div>
    </article>
  `;
}

hydrateToursFromApi();
