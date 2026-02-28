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

(function initMobileHeaderMenu() {
  const header = document.querySelector(".site-header");
  if (!header) {
    return;
  }

  const mainNav = header.querySelector(".main-nav");
  const logo = header.querySelector(".logo");
  if (!mainNav || !logo) {
    return;
  }

  if (!mainNav.id) {
    mainNav.id = "siteMainNav";
  }

  logo.classList.add("is-menu-trigger");
  logo.setAttribute("aria-expanded", "false");
  logo.setAttribute("aria-controls", mainNav.id);

  function closeMenu() {
    header.classList.remove("is-menu-open");
    logo.setAttribute("aria-expanded", "false");
  }

  logo.addEventListener("click", (event) => {
    if (!window.matchMedia("(max-width: 760px)").matches) {
      return;
    }

    event.preventDefault();
    const isOpen = header.classList.toggle("is-menu-open");
    logo.setAttribute("aria-expanded", String(isOpen));
  });

  mainNav.querySelectorAll("a").forEach((link) => {
    link.addEventListener("click", closeMenu);
  });

  document.addEventListener("click", (event) => {
    const target = event.target;
    if (!(target instanceof Node)) {
      return;
    }

    if (!header.contains(target)) {
      closeMenu();
    }
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
      closeMenu();
    }
  });

  const mediaQuery = window.matchMedia("(min-width: 761px)");
  const handleDesktopView = (event) => {
    if (event.matches) {
      closeMenu();
    }
  };

  if (typeof mediaQuery.addEventListener === "function") {
    mediaQuery.addEventListener("change", handleDesktopView);
  } else {
    mediaQuery.addListener(handleDesktopView);
  }
})();