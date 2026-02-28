const REVIEWS_STORAGE_KEY = "agencyReviews";

const DEFAULT_REVIEWS = [
  {
    id: "r1",
    name: "Анна",
    stars: 5,
    text: "Очень бережный подход. Подобрали тур за один вечер, всё прошло идеально."
  },
  {
    id: "r2",
    name: "Михаил",
    stars: 5,
    text: "Понравилось внимание к деталям и честные рекомендации по бюджету."
  },
  {
    id: "r3",
    name: "Елена",
    stars: 4,
    text: "Уютный сервис и быстрая связь с менеджером. Отдых получился отличным."
  }
];

function normalizeReview(review, index) {
  return {
    id: String(review.id || `r-${Date.now()}-${index}`),
    name: String(review.name || "Гость").trim() || "Гость",
    stars: Math.min(5, Math.max(1, Number(review.stars || 5))),
    text: String(review.text || "").trim()
  };
}

function readReviewsFromStorage() {
  const raw = localStorage.getItem(REVIEWS_STORAGE_KEY);
  if (!raw) {
    localStorage.setItem(REVIEWS_STORAGE_KEY, JSON.stringify(DEFAULT_REVIEWS));
    return [...DEFAULT_REVIEWS];
  }

  try {
    const reviews = JSON.parse(raw);
    if (!Array.isArray(reviews)) {
      throw new Error("Invalid reviews format");
    }

    return reviews.map((review, index) => normalizeReview(review, index));
  } catch (error) {
    localStorage.setItem(REVIEWS_STORAGE_KEY, JSON.stringify(DEFAULT_REVIEWS));
    return [...DEFAULT_REVIEWS];
  }
}

function saveReviewsToStorage(reviews) {
  localStorage.setItem(REVIEWS_STORAGE_KEY, JSON.stringify(reviews.map(normalizeReview)));
}

function renderStars(stars) {
  const safeStars = Math.min(5, Math.max(1, Number(stars || 5)));
  return "★".repeat(safeStars) + "☆".repeat(5 - safeStars);
}
