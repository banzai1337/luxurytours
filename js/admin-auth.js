(function initAdminAuth() {
  const isAllowed = requireAdminAuth("admin-login.html");
  if (!isAllowed) {
    return;
  }

  const logoutBtn = document.getElementById("logoutBtn");
  if (!logoutBtn) {
    return;
  }

  logoutBtn.addEventListener("click", () => {
    logoutAdminSession();
    window.location.href = "admin-login.html";
  });
})();