(function initPublicAuthUi() {
  const userAuthArea = document.getElementById("userAuthArea");
  if (!userAuthArea) {
    return;
  }

  const session = getUserSession();

  if (!session) {
    userAuthArea.innerHTML = `
      <a href="login.html" class="profile-trigger profile-trigger-link" aria-label="Открыть авторизацию">
        <span class="profile-avatar" aria-hidden="true">?</span>
        <span>Профиль</span>
      </a>
    `;
    return;
  }

  const initials = String(session.username || "П")
    .trim()
    .slice(0, 2)
    .toUpperCase();

  userAuthArea.innerHTML = `
    <div class="profile-menu" id="profileMenu">
      <button type="button" class="profile-trigger" id="profileTrigger" aria-haspopup="menu" aria-expanded="false">
        <span class="profile-avatar" aria-hidden="true">${initials}</span>
        <span>Профиль</span>
      </button>
      <div class="profile-dropdown" id="profileDropdown" role="menu">
        <a href="profile.html" class="profile-dropdown-link" role="menuitem">Профиль</a>
        <a href="profile.html#favoritesTitle" class="profile-dropdown-link" role="menuitem">Избранное</a>
        <button type="button" class="profile-dropdown-link" id="userLogoutBtn" role="menuitem">Выйти</button>
      </div>
    </div>
  `;

  const profileMenu = document.getElementById("profileMenu");
  const profileTrigger = document.getElementById("profileTrigger");
  const profileDropdown = document.getElementById("profileDropdown");
  const userLogoutBtn = document.getElementById("userLogoutBtn");

  if (!profileMenu || !profileTrigger || !profileDropdown || !userLogoutBtn) {
    return;
  }

  function closeProfileMenu() {
    profileMenu.classList.remove("is-open");
    profileTrigger.setAttribute("aria-expanded", "false");
  }

  profileTrigger.addEventListener("click", () => {
    const isOpen = profileMenu.classList.toggle("is-open");
    profileTrigger.setAttribute("aria-expanded", String(isOpen));
  });

  document.addEventListener("click", (event) => {
    const target = event.target;
    if (!(target instanceof Node)) {
      return;
    }

    if (!profileMenu.contains(target)) {
      closeProfileMenu();
    }
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
      closeProfileMenu();
    }
  });

  userLogoutBtn.addEventListener("click", () => {
    logoutUserSession();
    window.location.href = "index.html";
  });
})();