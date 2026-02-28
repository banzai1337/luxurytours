const PRESENCE_STORAGE_KEY = "agencyPresenceState";
const PRESENCE_HISTORY_STORAGE_KEY = "agencyPresenceHistory";
const PRESENCE_TAB_ID_KEY = "agencyPresenceTabId";
const PRESENCE_HEARTBEAT_MS = 15000;
const PRESENCE_STALE_MS = 45000;
const PRESENCE_HISTORY_LIMIT = 300;
const PRESENCE_GEO_CACHE_KEY = "agencyPresenceGeoCache";
const PRESENCE_GEO_CACHE_TTL_MS = 24 * 60 * 60 * 1000;

(function initPresenceTracker() {
  function buildFallbackVisitorIdentity() {
    const browserLocale = String(navigator.language || "").trim();
    const localeParts = browserLocale.split("-");
    const region = localeParts.length > 1 ? localeParts[1].toUpperCase() : "";
    const timeZone = String(Intl.DateTimeFormat().resolvedOptions().timeZone || "").trim();
    const originParts = [];

    if (region) {
      originParts.push(region);
    }
    if (timeZone) {
      originParts.push(timeZone);
    }

    return {
      displayName: region ? `Гость ${region}` : "Гость",
      origin: originParts.join(" · ") || "Неизвестно"
    };
  }

  function readGeoCache() {
    const raw = localStorage.getItem(PRESENCE_GEO_CACHE_KEY);
    if (!raw) {
      return null;
    }

    try {
      const parsed = JSON.parse(raw);
      const cachedAt = Number(parsed && parsed.cachedAt);
      if (!parsed || !Number.isFinite(cachedAt) || Date.now() - cachedAt > PRESENCE_GEO_CACHE_TTL_MS) {
        return null;
      }

      if (!parsed.identity || typeof parsed.identity !== "object") {
        return null;
      }

      return parsed.identity;
    } catch (error) {
      return null;
    }
  }

  function writeGeoCache(identity) {
    localStorage.setItem(
      PRESENCE_GEO_CACHE_KEY,
      JSON.stringify({
        cachedAt: Date.now(),
        identity
      })
    );
  }

  function getVisitorIdentityFromGeo(data) {
    const city = String(data.city || "").trim();
    const country = String(data.country_name || "").trim();
    const countryCode = String(data.country_code || "").trim().toUpperCase();
    const timeZone = String(data.timezone || "").trim();
    const ip = String(data.ip || "").trim();
    const originParts = [];

    if (city) {
      originParts.push(city);
    }
    if (country) {
      originParts.push(country);
    }
    if (timeZone) {
      originParts.push(timeZone);
    }
    if (ip) {
      originParts.push(`IP ${ip}`);
    }

    return {
      displayName: countryCode ? `Гость ${countryCode}` : "Гость",
      origin: originParts.join(" · ") || "Неизвестно"
    };
  }

  let guestIdentity = readGeoCache() || buildFallbackVisitorIdentity();

  function getVisitorIdentity() {
    return guestIdentity;
  }

  function getTabId() {
    const existing = sessionStorage.getItem(PRESENCE_TAB_ID_KEY);
    if (existing) {
      return existing;
    }

    const newId = `tab-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    sessionStorage.setItem(PRESENCE_TAB_ID_KEY, newId);
    return newId;
  }

  function getSessionInfo() {
    const guestIdentity = getVisitorIdentity();
    if (typeof getUserSession === "function") {
      const userSession = getUserSession();
      if (userSession && userSession.username) {
        return {
          role: "user",
          username: String(userSession.username),
          email: String(userSession.email || ""),
          displayName: String(userSession.username),
          origin: "Аккаунт сайта"
        };
      }
    }

    if (typeof getAdminSession === "function") {
      const adminSession = getAdminSession();
      if (adminSession && adminSession.username) {
        return {
          role: "admin",
          username: String(adminSession.username),
          email: "",
          displayName: String(adminSession.username),
          origin: "Админ-панель"
        };
      }
    }

    return {
      role: "guest",
      username: "Гость",
      email: "",
      displayName: guestIdentity.displayName,
      origin: guestIdentity.origin
    };
  }

  function getPageData() {
    const path = String(window.location.pathname || "").toLowerCase();
    const params = new URLSearchParams(window.location.search);
    const tourId = params.get("id");

    if (path.endsWith("/tour.html") || path.endsWith("tour.html")) {
      let tourTitle = "Тур";
      if (tourId && typeof getTourById === "function") {
        const tour = getTourById(tourId);
        if (tour && tour.title) {
          tourTitle = String(tour.title);
        }
      }

      return {
        page: "tour",
        pageLabel: "Страница тура",
        tourId: String(tourId || ""),
        tourTitle
      };
    }

    if (path.endsWith("/tours.html") || path.endsWith("tours.html")) {
      return { page: "tours", pageLabel: "Каталог туров", tourId: "", tourTitle: "" };
    }

    if (path.endsWith("/profile.html") || path.endsWith("profile.html")) {
      return { page: "profile", pageLabel: "Профиль", tourId: "", tourTitle: "" };
    }

    if (path.endsWith("/login.html") || path.endsWith("login.html")) {
      return { page: "login", pageLabel: "Авторизация", tourId: "", tourTitle: "" };
    }

    if (path.endsWith("/admin-login.html") || path.endsWith("admin-login.html")) {
      return { page: "admin-login", pageLabel: "Вход администратора", tourId: "", tourTitle: "" };
    }

    if (path.endsWith("/admin.html") || path.endsWith("admin.html")) {
      return { page: "admin", pageLabel: "Админ-панель", tourId: "", tourTitle: "" };
    }

    if (path.endsWith("/article.html") || path.endsWith("article.html")) {
      return { page: "article", pageLabel: "Статья блога", tourId: "", tourTitle: "" };
    }

    if (path.endsWith("/blog.html") || path.endsWith("blog.html")) {
      return { page: "blog", pageLabel: "Блог", tourId: "", tourTitle: "" };
    }

    return { page: "home", pageLabel: "Главная", tourId: "", tourTitle: "" };
  }

  function readPresenceState() {
    const raw = localStorage.getItem(PRESENCE_STORAGE_KEY);
    if (!raw) {
      return {};
    }

    try {
      const parsed = JSON.parse(raw);
      return parsed && typeof parsed === "object" ? parsed : {};
    } catch (error) {
      return {};
    }
  }

  function writePresenceState(nextState) {
    localStorage.setItem(PRESENCE_STORAGE_KEY, JSON.stringify(nextState));
  }

  function readPresenceHistory() {
    const raw = localStorage.getItem(PRESENCE_HISTORY_STORAGE_KEY);
    if (!raw) {
      return [];
    }

    try {
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed : [];
    } catch (error) {
      return [];
    }
  }

  function writePresenceHistory(history) {
    localStorage.setItem(PRESENCE_HISTORY_STORAGE_KEY, JSON.stringify(history));
  }

  function pruneStale(state) {
    const now = Date.now();
    const nextState = { ...state };

    Object.keys(nextState).forEach((key) => {
      const item = nextState[key];
      const updatedAt = Number(item && item.updatedAt);
      if (!Number.isFinite(updatedAt) || now - updatedAt > PRESENCE_STALE_MS) {
        delete nextState[key];
      }
    });

    return nextState;
  }

  const tabId = getTabId();
  const startedAt = Date.now();

  function updateCurrentHistoryGuestIdentity() {
    const history = readPresenceHistory();
    const itemIndex = history.findIndex((item) => item && item.id === `${tabId}-${startedAt}`);
    if (itemIndex === -1) {
      return;
    }

    if (history[itemIndex].role !== "guest") {
      return;
    }

    history[itemIndex] = {
      ...history[itemIndex],
      displayName: guestIdentity.displayName,
      origin: guestIdentity.origin
    };

    writePresenceHistory(history.slice(0, PRESENCE_HISTORY_LIMIT));
  }

  async function refreshGuestGeoIdentity() {
    try {
      const controller = new AbortController();
      const timeoutId = window.setTimeout(() => controller.abort(), 4000);
      const response = await fetch("https://ipapi.co/json/", {
        method: "GET",
        signal: controller.signal
      });
      window.clearTimeout(timeoutId);

      if (!response.ok) {
        return;
      }

      const data = await response.json();
      const nextIdentity = getVisitorIdentityFromGeo(data || {});

      if (!nextIdentity.origin || nextIdentity.origin === "Неизвестно") {
        return;
      }

      guestIdentity = nextIdentity;
      writeGeoCache(nextIdentity);
      updateCurrentHistoryGuestIdentity();
      updatePresence();
    } catch (error) {
      // ignore geo lookup errors
    }
  }

  function appendPresenceHistory() {
    const sessionInfo = getSessionInfo();
    const pageData = getPageData();
    const history = readPresenceHistory();

    history.unshift({
      id: `${tabId}-${startedAt}`,
      tabId,
      role: sessionInfo.role,
      username: sessionInfo.username,
      email: sessionInfo.email,
      displayName: sessionInfo.displayName,
      origin: sessionInfo.origin,
      page: pageData.page,
      pageLabel: pageData.pageLabel,
      tourId: pageData.tourId,
      tourTitle: pageData.tourTitle,
      enteredAt: startedAt
    });

    writePresenceHistory(history.slice(0, PRESENCE_HISTORY_LIMIT));
  }

  function updatePresence() {
    const sessionInfo = getSessionInfo();
    const pageData = getPageData();
    const currentState = readPresenceState();
    const cleanedState = pruneStale(currentState);

    cleanedState[tabId] = {
      tabId,
      role: sessionInfo.role,
      username: sessionInfo.username,
      email: sessionInfo.email,
      displayName: sessionInfo.displayName,
      origin: sessionInfo.origin,
      page: pageData.page,
      pageLabel: pageData.pageLabel,
      tourId: pageData.tourId,
      tourTitle: pageData.tourTitle,
      enteredAt: startedAt,
      updatedAt: Date.now()
    };

    writePresenceState(cleanedState);
  }

  function removePresence() {
    const currentState = readPresenceState();
    if (!currentState[tabId]) {
      return;
    }

    const nextState = { ...currentState };
    delete nextState[tabId];
    writePresenceState(nextState);
  }

  appendPresenceHistory();
  updatePresence();
  refreshGuestGeoIdentity();

  const heartbeatId = window.setInterval(updatePresence, PRESENCE_HEARTBEAT_MS);

  window.addEventListener("focus", updatePresence);
  window.addEventListener("visibilitychange", () => {
    if (!document.hidden) {
      updatePresence();
    }
  });

  window.addEventListener("beforeunload", () => {
    window.clearInterval(heartbeatId);
    removePresence();
  });
})();
