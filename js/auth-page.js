(function initAuthPage() {
  const loginForm = document.getElementById("loginForm");
  const registerForm = document.getElementById("registerForm");
  const sideSwitchBtn = document.getElementById("showLogin");
  const authShell = document.querySelector(".auth-shell");
  const authSideTitle = document.getElementById("authSideTitle");
  const authSideText = document.getElementById("authSideText");

  const loginUsernameInput = document.getElementById("loginUsername");
  const loginPasswordInput = document.getElementById("loginPassword");
  const loginHint = document.getElementById("loginHint");

  const registerUsernameInput = document.getElementById("registerUsername");
  const registerPasswordInput = document.getElementById("registerPassword");
  const registerEmailInput = document.getElementById("registerEmail");
  const confirmPasswordInput = document.getElementById("confirmPassword");
  const registerHint = document.getElementById("registerHint");

  if (
    !loginForm ||
    !registerForm ||
    !sideSwitchBtn ||
    !authShell ||
    !authSideTitle ||
    !authSideText ||
    !loginUsernameInput ||
    !loginPasswordInput ||
    !loginHint ||
    !registerUsernameInput ||
    !registerPasswordInput ||
    !registerEmailInput ||
    !confirmPasswordInput ||
    !registerHint
  ) {
    return;
  }

  if (getUserSession()) {
    window.location.href = "index.html";
    return;
  }

  let modeAnimationTimer = null;
  let isSwitchingMode = false;

  function applyModeMeta(isLogin) {
    authShell.classList.add("auth-animating");
    authShell.classList.toggle("is-login", isLogin);

    if (isLogin) {
      authSideTitle.textContent = "Рады видеть вас снова";
      authSideText.textContent = "Войдите в аккаунт, чтобы продолжить планировать идеальное путешествие.";
      sideSwitchBtn.textContent = "Зарегистрироваться";
      sideSwitchBtn.setAttribute("data-target-mode", "register");
    } else {
      authSideTitle.textContent = "Начните своё путешествие уже сегодня";
      authSideText.textContent = "Создайте аккаунт за минуту и откройте доступ к выгодным турам и персональным предложениям.";
      sideSwitchBtn.textContent = "У меня уже есть аккаунт";
      sideSwitchBtn.setAttribute("data-target-mode", "login");
    }

    sideSwitchBtn.classList.toggle("active", !isLogin);

    const targetMode = isLogin ? "login" : "register";
    const currentParams = new URLSearchParams(window.location.search);
    currentParams.set("mode", targetMode);
    const nextUrl = `${window.location.pathname}?${currentParams.toString()}`;
    window.history.replaceState({}, "", nextUrl);

    window.clearTimeout(modeAnimationTimer);
    modeAnimationTimer = window.setTimeout(() => {
      authShell.classList.remove("auth-animating");
    }, 340);
  }

  function switchMode(mode, { animate = true } = {}) {
    if (isSwitchingMode && animate) {
      return;
    }

    const isLogin = mode === "login";
    const targetForm = isLogin ? loginForm : registerForm;
    const currentForm = isLogin ? registerForm : loginForm;

    applyModeMeta(isLogin);

    if (!animate) {
      loginForm.classList.toggle("auth-hidden", !isLogin);
      registerForm.classList.toggle("auth-hidden", isLogin);
      loginForm.classList.remove("is-entering", "is-leaving");
      registerForm.classList.remove("is-entering", "is-leaving");
      return;
    }

    if (currentForm.classList.contains("auth-hidden")) {
      targetForm.classList.remove("auth-hidden");
      targetForm.classList.add("is-entering");
      requestAnimationFrame(() => {
        targetForm.classList.remove("is-entering");
      });
      return;
    }

    isSwitchingMode = true;
    currentForm.classList.add("is-leaving");

    window.setTimeout(() => {
      currentForm.classList.add("auth-hidden");
      currentForm.classList.remove("is-leaving");

      targetForm.classList.remove("auth-hidden");
      targetForm.classList.add("is-entering");
      requestAnimationFrame(() => {
        targetForm.classList.remove("is-entering");
      });

      window.setTimeout(() => {
        isSwitchingMode = false;
      }, 230);
    }, 180);
  }

  const params = new URLSearchParams(window.location.search);
  switchMode(params.get("mode") === "login" ? "login" : "register", { animate: false });

  sideSwitchBtn.addEventListener("click", () => {
    const nextMode = sideSwitchBtn.getAttribute("data-target-mode") === "register" ? "register" : "login";
    switchMode(nextMode);
  });

  loginForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const username = loginUsernameInput.value.trim();
    const password = loginPasswordInput.value;

    if (!username || !password) {
      loginHint.textContent = "Введите логин и пароль.";
      return;
    }

    try {
      await loginUser(username, password);
      loginHint.textContent = "Успешный вход. Переход на сайт...";
      window.location.href = "index.html";
    } catch (error) {
      loginHint.textContent = error.message || "Ошибка авторизации.";
    }
  });

  registerForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const username = registerUsernameInput.value.trim();
    const email = registerEmailInput.value.trim().toLowerCase();
    const password = registerPasswordInput.value;
    const confirmPassword = confirmPasswordInput.value;

    if (username.length < 3) {
      registerHint.textContent = "Логин должен содержать минимум 3 символа.";
      return;
    }

    if (!isValidEmail(email)) {
      registerHint.textContent = "Введите корректный email.";
      return;
    }

    if (password.length < 8 || !/[A-Za-z]/.test(password) || !/\d/.test(password)) {
      registerHint.textContent = "Пароль: минимум 8 символов, буквы и цифры.";
      return;
    }

    if (password !== confirmPassword) {
      registerHint.textContent = "Пароли не совпадают.";
      return;
    }

    try {
      await registerUser(username, email, password);
      await loginUser(username, password);
      registerHint.textContent = "Аккаунт создан. Переход на сайт...";
      window.location.href = "index.html";
    } catch (error) {
      registerHint.textContent = error.message || "Ошибка регистрации.";
    }
  });
})();