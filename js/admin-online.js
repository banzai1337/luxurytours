(function initAdminOnlinePanel() {
  if (typeof getAdminSession === "function" && !getAdminSession()) {
    return;
  }

  const onlineUsersList = document.getElementById("onlineUsersList");
  const onlineUsersHint = document.getElementById("onlineUsersHint");
  const presenceHistoryList = document.getElementById("presenceHistoryList");
  const presenceHistoryHint = document.getElementById("presenceHistoryHint");
  const presenceLoginSearch = document.getElementById("presenceLoginSearch");
  const presenceShowIp = document.getElementById("presenceShowIp");
  const presenceSearchInfo = document.getElementById("presenceSearchInfo");

  if (
    !onlineUsersList ||
    !onlineUsersHint ||
    !presenceHistoryList ||
    !presenceHistoryHint ||
    !presenceLoginSearch ||
    !presenceShowIp ||
    !presenceSearchInfo
  ) {
    return;
  }

  const showIpStorageKey = "agencyAdminShowIp";
  const fallbackStaleMs = 45000;
  const staleMs = typeof PRESENCE_STALE_MS === "number" ? PRESENCE_STALE_MS : fallbackStaleMs;
  const key = typeof PRESENCE_STORAGE_KEY === "string" ? PRESENCE_STORAGE_KEY : "agencyPresenceState";
  const historyKey =
    typeof PRESENCE_HISTORY_STORAGE_KEY === "string" ? PRESENCE_HISTORY_STORAGE_KEY : "agencyPresenceHistory";
  let currentSearchQuery = "";
  let showIp = localStorage.getItem(showIpStorageKey) === "1";
  presenceShowIp.checked = showIp;

  function readPresenceEntries() {
    const raw = localStorage.getItem(key);
    if (!raw) {
      return [];
    }

    try {
      const parsed = JSON.parse(raw);
      if (!parsed || typeof parsed !== "object") {
        return [];
      }

      return Object.values(parsed).filter((entry) => entry && typeof entry === "object");
    } catch (error) {
      return [];
    }
  }

  function readPresenceHistory() {
    const raw = localStorage.getItem(historyKey);
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

  function formatTimeSince(timestamp) {
    const diffSec = Math.max(0, Math.floor((Date.now() - Number(timestamp || 0)) / 1000));

    if (diffSec < 60) {
      return `${diffSec} сек назад`;
    }

    const diffMin = Math.floor(diffSec / 60);
    if (diffMin < 60) {
      return `${diffMin} мин назад`;
    }

    const diffHours = Math.floor(diffMin / 60);
    return `${diffHours} ч назад`;
  }

  function getRoleLabel(role) {
    if (role === "admin") {
      return "Админ";
    }
    if (role === "user") {
      return "Пользователь";
    }
    return "Гость";
  }

  function formatDateTime(timestamp) {
    const date = new Date(Number(timestamp || 0));
    if (Number.isNaN(date.getTime())) {
      return "Неизвестно";
    }

    return date.toLocaleString("ru-RU");
  }

  function getSearchUsername(username, displayName) {
    const normalizedUsername = String(username || "").trim();
    if (normalizedUsername && normalizedUsername !== "Гость") {
      return normalizedUsername;
    }

    return String(displayName || "Гость").trim() || "Гость";
  }

  function normalizeQuery(value) {
    return String(value || "").trim().toLowerCase();
  }

  function getDisplayIdentity(entry) {
    return {
      name: String(entry.displayName || entry.username || "Гость"),
      origin: String(entry.origin || "Неизвестно")
    };
  }

  function formatOrigin(origin) {
    const rawOrigin = String(origin || "Неизвестно");
    if (showIp) {
      return rawOrigin;
    }

    return rawOrigin.replace(/IP\s+[0-9a-fA-F:.]+/g, "IP скрыт");
  }

  function getRegisteredUsers() {
    if (typeof withStore !== "function") {
      return Promise.resolve([]);
    }

    return withStore("readonly", (store, resolve, reject) => {
      const request = store.getAll();
      request.onsuccess = () => resolve(Array.isArray(request.result) ? request.result : []);
      request.onerror = () => reject(request.error);
    }).catch(() => []);
  }

  async function renderSearchInfo() {
    const query = normalizeQuery(currentSearchQuery);
    if (!query) {
      presenceSearchInfo.textContent = "Введите логин, чтобы отфильтровать историю и получить данные по пользователю.";
      return;
    }

    const historyItems = readPresenceHistory();
    const presenceItems = readPresenceEntries();
    const combined = [...presenceItems, ...historyItems];
    const matchedEntry = combined.find((item) => {
      const searchLogin = normalizeQuery(getSearchUsername(item.username, item.displayName));
      return searchLogin.includes(query);
    });

    const users = await getRegisteredUsers();
    const isRegistered = users.some((user) => {
      const login = normalizeQuery(user.username);
      const email = normalizeQuery(user.email);
      return login === query || email === query;
    });

    if (isRegistered) {
      presenceSearchInfo.textContent = "Пользователь зарегистрирован на сайте.";
      return;
    }

    if (!matchedEntry) {
      presenceSearchInfo.textContent = "Пользователь не найден в истории и онлайн-списке.";
      return;
    }

    const identity = getDisplayIdentity(matchedEntry);
    const name = identity.name || "Гость";
    const origin = formatOrigin(identity.origin || "Неизвестно");
    presenceSearchInfo.textContent = `Не зарегистрирован. Имя: ${name}. Откуда: ${origin}.`;
  }

  function renderOnlineUsers() {
    const now = Date.now();
    const entries = readPresenceEntries()
      .filter((entry) => now - Number(entry.updatedAt || 0) <= staleMs)
      .sort((firstEntry, secondEntry) => Number(secondEntry.updatedAt || 0) - Number(firstEntry.updatedAt || 0));

    onlineUsersHint.textContent = `Онлайн: ${entries.length}`;

    if (entries.length === 0) {
      onlineUsersList.innerHTML = '<p class="admin-empty">Сейчас на сайте никого нет.</p>';
      return;
    }

    onlineUsersList.innerHTML = entries
      .map((entry) => {
        const safeUsername = escapeHtml(String(entry.username || "Гость"));
        const safeRole = escapeHtml(getRoleLabel(String(entry.role || "guest")));
        const safePage = escapeHtml(String(entry.pageLabel || "Неизвестная страница"));
        const safeTourTitle = escapeHtml(String(entry.tourTitle || ""));
        const safeOrigin = escapeHtml(formatOrigin(String(entry.origin || "Неизвестно")));
        const pageText = safeTourTitle ? `${safePage}: ${safeTourTitle}` : safePage;
        const safeUpdated = escapeHtml(formatTimeSince(entry.updatedAt));

        return `
          <article class="admin-online-item">
            <div>
              <h3>${safeUsername}</h3>
              <p class="admin-description">${safeRole}</p>
            </div>
            <div>
              <p><strong>Смотрит:</strong> ${pageText}</p>
              <p class="admin-description"><strong>Откуда:</strong> ${safeOrigin}</p>
              <p class="admin-description">Обновлено: ${safeUpdated}</p>
            </div>
          </article>
        `;
      })
      .join("");
  }

  function renderPresenceHistory() {
    const historyItems = readPresenceHistory().slice(0, 200);
    const groupedHistory = new Map();
    const query = normalizeQuery(currentSearchQuery);

    historyItems.forEach((item) => {
      const username = getSearchUsername(item.username, item.displayName);
      const role = String(item.role || "guest");

      if (query && !normalizeQuery(username).includes(query)) {
        return;
      }

      const key = `${role}:${username}`;

      if (!groupedHistory.has(key)) {
        groupedHistory.set(key, {
          username,
          role,
          actions: []
        });
      }

      groupedHistory.get(key).actions.push(item);
    });

    const groups = Array.from(groupedHistory.values()).sort((firstGroup, secondGroup) => {
      const firstTime = Number(firstGroup.actions[0]?.enteredAt || 0);
      const secondTime = Number(secondGroup.actions[0]?.enteredAt || 0);
      return secondTime - firstTime;
    });

    presenceHistoryHint.textContent = `Логинов: ${groups.length} · Записей: ${historyItems.length}`;

    if (groups.length === 0) {
      presenceHistoryList.innerHTML = '<p class="admin-empty">История пока пуста.</p>';
      return;
    }

    presenceHistoryList.innerHTML = groups
      .map((group) => {
        const safeUsername = escapeHtml(group.username);
        const safeRole = escapeHtml(getRoleLabel(group.role));
        const latestActionTime = escapeHtml(formatDateTime(group.actions[0]?.enteredAt));
        const actionsMarkup = group.actions
          .slice(0, 40)
          .map((item) => {
            const safePage = escapeHtml(String(item.pageLabel || "Неизвестная страница"));
            const safeTourTitle = escapeHtml(String(item.tourTitle || ""));
            const safeOrigin = escapeHtml(formatOrigin(String(item.origin || "Неизвестно")));
            const pageText = safeTourTitle ? `${safePage}: ${safeTourTitle}` : safePage;
            const safeEnteredAt = escapeHtml(formatDateTime(item.enteredAt));

            return `
              <article class="admin-history-action">
                <p><strong>Действие:</strong> ${pageText}</p>
                <p class="admin-description"><strong>Откуда:</strong> ${safeOrigin}</p>
                <p class="admin-description">Время: ${safeEnteredAt}</p>
              </article>
            `;
          })
          .join("");

        return `
          <details class="admin-history-group">
            <summary>
              <span><strong>${safeUsername}</strong> · ${safeRole}</span>
              <span class="admin-description">действий: ${group.actions.length} · последнее: ${latestActionTime}</span>
            </summary>
            <div class="admin-history-body">${actionsMarkup}</div>
          </details>
        `;
      })
      .join("");
  }

  renderOnlineUsers();
  renderPresenceHistory();
  renderSearchInfo();

  presenceLoginSearch.addEventListener("input", (event) => {
    const target = event.target;
    if (!(target instanceof HTMLInputElement)) {
      return;
    }

    currentSearchQuery = target.value;
    renderPresenceHistory();
    renderSearchInfo();
  });

  presenceShowIp.addEventListener("change", (event) => {
    const target = event.target;
    if (!(target instanceof HTMLInputElement)) {
      return;
    }

    showIp = target.checked;
    localStorage.setItem(showIpStorageKey, showIp ? "1" : "0");
    renderOnlineUsers();
    renderPresenceHistory();
    renderSearchInfo();
  });

  window.setInterval(renderOnlineUsers, 5000);
  window.setInterval(renderPresenceHistory, 7000);
  window.addEventListener("storage", (event) => {
    if (event.key === key) {
      renderOnlineUsers();
      renderSearchInfo();
    }
    if (event.key === historyKey) {
      renderPresenceHistory();
      renderSearchInfo();
    }
  });
})();
