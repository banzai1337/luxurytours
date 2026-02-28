(function initAdminLoginPage() {
  const adminLoginForm = document.getElementById("adminLoginForm");
  const usernameInput = document.getElementById("username");
  const passwordInput = document.getElementById("password");
  const adminLoginHint = document.getElementById("adminLoginHint");

  if (!adminLoginForm || !usernameInput || !passwordInput || !adminLoginHint) {
    return;
  }

  if (getAdminSession()) {
    window.location.href = "admin.html";
    return;
  }

  adminLoginForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const username = usernameInput.value.trim();
    const password = passwordInput.value;

    if (!username || !password) {
      adminLoginHint.textContent = "Введите логин и пароль администратора.";
      return;
    }

    try {
      await seedAdminUser();
      await loginAdmin(username, password);
      adminLoginHint.textContent = "Успешный вход. Переход в админ-панель...";
      window.location.href = "admin.html";
    } catch (error) {
      adminLoginHint.textContent = error.message || "Ошибка авторизации.";
    }
  });
})();