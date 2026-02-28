const USER_SESSION_KEY = "agencyUserSession";
const ADMIN_SESSION_KEY = "agencyAdminSession";
const AUTH_TOKEN_KEY = "agencyAuthToken";
const LOCAL_USERS_KEY = "agencyLocalUsers";
const API_BASE_URL = "";

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(email || "").trim());
}

function normalizeErrorMessage(error, fallback) {
  if (error && typeof error.message === "string" && error.message.trim()) {
    return error.message;
  }

  return fallback;
}

function isGithubPagesHost() {
  const hostname = String(window.location.hostname || "").toLowerCase();
  return hostname.endsWith("github.io");
}

function shouldPreferLocalAuth() {
  return window.location.protocol === "file:" || isGithubPagesHost();
}

async function apiRequest(path, options = {}) {
  const token = localStorage.getItem(AUTH_TOKEN_KEY);
  const headers = {
    "Content-Type": "application/json",
    ...(options.headers || {})
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers
  });

  if (response.status === 204) {
    return null;
  }

  let payload = null;
  try {
    payload = await response.json();
  } catch (error) {
    payload = null;
  }

  if (!response.ok) {
    throw new Error(payload?.error || `Ошибка запроса (${response.status}).`);
  }

  return payload;
}

function setUserSession(user) {
  const session = {
    username: String(user?.username || ""),
    email: String(user?.email || ""),
    role: String(user?.role || "user"),
    loginAt: Date.now()
  };

  localStorage.setItem(USER_SESSION_KEY, JSON.stringify(session));
  return session;
}

function setAdminSession(user) {
  const session = {
    username: String(user?.username || ""),
    role: "admin",
    loginAt: Date.now()
  };

  localStorage.setItem(ADMIN_SESSION_KEY, JSON.stringify(session));
  return session;
}

function getUserSession() {
  const raw = localStorage.getItem(USER_SESSION_KEY);
  if (!raw) {
    return null;
  }

  try {
    return JSON.parse(raw);
  } catch (error) {
    localStorage.removeItem(USER_SESSION_KEY);
    return null;
  }
}

function getAdminSession() {
  const raw = localStorage.getItem(ADMIN_SESSION_KEY);
  if (!raw) {
    return null;
  }

  try {
    return JSON.parse(raw);
  } catch (error) {
    localStorage.removeItem(ADMIN_SESSION_KEY);
    return null;
  }
}

function readLocalUsers() {
  const raw = localStorage.getItem(LOCAL_USERS_KEY);
  if (!raw) {
    return [];
  }

  try {
    const users = JSON.parse(raw);
    return Array.isArray(users) ? users : [];
  } catch (error) {
    return [];
  }
}

function saveLocalUsers(users) {
  localStorage.setItem(LOCAL_USERS_KEY, JSON.stringify(users));
}

function seedLocalAdminUser() {
  const users = readLocalUsers();
  const adminUsername = "symmetric1g41vbh4";
  const adminEmail = "admin@warmroutes.local";
  const adminPassword = "plesenb1f1kk12of1";

  const existing = users.find((item) => String(item.username || "") === adminUsername);
  if (existing) {
    const nextUsers = users.map((item) =>
      String(item.username || "") === adminUsername
        ? {
            ...item,
            email: adminEmail,
            password: adminPassword,
            role: "admin"
          }
        : item
    );
    saveLocalUsers(nextUsers);
    return;
  }

  users.push({
    username: adminUsername,
    email: adminEmail,
    password: adminPassword,
    role: "admin",
    createdAt: Date.now()
  });
  saveLocalUsers(users);
}

async function registerUserLocal(username, email, password) {
  const normalizedUsername = String(username || "").trim();
  const normalizedEmail = String(email || "").trim().toLowerCase();
  const normalizedPassword = String(password || "");

  if (!isValidEmail(normalizedEmail)) {
    throw new Error("Введите корректный email.");
  }

  const users = readLocalUsers();
  if (users.some((item) => String(item.username || "").toLowerCase() === normalizedUsername.toLowerCase())) {
    throw new Error("Пользователь с таким логином уже существует.");
  }

  if (users.some((item) => String(item.email || "").toLowerCase() === normalizedEmail)) {
    throw new Error("Пользователь с таким email уже существует.");
  }

  const newUser = {
    username: normalizedUsername,
    email: normalizedEmail,
    password: normalizedPassword,
    role: "user",
    createdAt: Date.now()
  };

  users.push(newUser);
  saveLocalUsers(users);

  return {
    username: newUser.username,
    email: newUser.email,
    role: newUser.role
  };
}

async function loginUserLocal(identifier, password) {
  const normalizedIdentifier = String(identifier || "").trim().toLowerCase();
  const normalizedPassword = String(password || "");

  seedLocalAdminUser();
  const users = readLocalUsers();

  const user = users.find((item) => {
    const byUsername = String(item.username || "").toLowerCase() === normalizedIdentifier;
    const byEmail = String(item.email || "").toLowerCase() === normalizedIdentifier;
    return (byUsername || byEmail) && String(item.password || "") === normalizedPassword;
  });

  if (!user) {
    throw new Error("Неверный логин или пароль.");
  }

  setUserSession(user);
  if (user.role === "admin") {
    setAdminSession(user);
  } else {
    localStorage.removeItem(ADMIN_SESSION_KEY);
  }

  return {
    username: user.username,
    email: user.email,
    role: user.role
  };
}

async function registerUser(username, email, password) {
  if (shouldPreferLocalAuth()) {
    return registerUserLocal(username, email, password);
  }

  const normalizedUsername = String(username || "").trim();
  const normalizedEmail = String(email || "").trim().toLowerCase();
  const normalizedPassword = String(password || "");

  if (!isValidEmail(normalizedEmail)) {
    throw new Error("Введите корректный email.");
  }

  try {
    return await apiRequest("/api/auth/register", {
      method: "POST",
      body: JSON.stringify({
        username: normalizedUsername,
        email: normalizedEmail,
        password: normalizedPassword
      })
    });
  } catch (error) {
    return registerUserLocal(normalizedUsername, normalizedEmail, normalizedPassword);
  }
}

async function loginUser(identifier, password) {
  if (shouldPreferLocalAuth()) {
    return loginUserLocal(identifier, password);
  }

  try {
    const payload = await apiRequest("/api/auth/login", {
      method: "POST",
      body: JSON.stringify({
        identifier: String(identifier || "").trim(),
        password: String(password || "")
      })
    });

    if (!payload?.token || !payload?.user) {
      throw new Error("Сервер вернул некорректный ответ авторизации.");
    }

    localStorage.setItem(AUTH_TOKEN_KEY, payload.token);
    setUserSession(payload.user);
    if (payload.user.role === "admin") {
      setAdminSession(payload.user);
    } else {
      localStorage.removeItem(ADMIN_SESSION_KEY);
    }

    return payload.user;
  } catch (error) {
    return loginUserLocal(identifier, password).catch(() => {
      throw new Error(normalizeErrorMessage(error, "Неверный логин или пароль."));
    });
  }
}

async function loginAdmin(username, password) {
  const user = await loginUser(username, password);

  if (String(user?.role || "") !== "admin") {
    logoutUserSession();
    throw new Error("Доступ разрешен только администратору.");
  }

  setAdminSession(user);
  return user;
}

async function getUserByUsername(username) {
  const normalizedUsername = String(username || "").trim();
  if (!normalizedUsername) {
    return null;
  }

  if (shouldPreferLocalAuth()) {
    const users = readLocalUsers();
    const user = users.find((item) => String(item.username || "") === normalizedUsername);
    if (!user) {
      const session = getUserSession();
      if (!session || String(session.username || "") !== normalizedUsername) {
        return null;
      }

      return {
        username: session.username,
        email: session.email || "",
        role: session.role || "user",
        password: ""
      };
    }

    return {
      username: user.username,
      email: user.email || "",
      role: user.role || "user",
      password: ""
    };
  }

  try {
    const me = await apiRequest("/api/auth/me");
    if (!me || String(me.username || "") !== normalizedUsername) {
      return null;
    }

    return {
      username: me.username,
      email: me.email || "",
      role: me.role || "user",
      password: ""
    };
  } catch (error) {
    const users = readLocalUsers();
    const user = users.find((item) => String(item.username || "") === normalizedUsername);
    if (user) {
      return {
        username: user.username,
        email: user.email || "",
        role: user.role || "user",
        password: ""
      };
    }

    const session = getUserSession();
    if (!session || String(session.username || "") !== normalizedUsername) {
      return null;
    }

    return {
      username: session.username,
      email: session.email || "",
      role: session.role || "user",
      password: ""
    };
  }
}

function logoutUserSession() {
  const token = localStorage.getItem(AUTH_TOKEN_KEY);
  if (token && !shouldPreferLocalAuth()) {
    apiRequest("/api/auth/logout", { method: "POST" }).catch(() => {});
  }

  localStorage.removeItem(USER_SESSION_KEY);
  localStorage.removeItem(ADMIN_SESSION_KEY);
  localStorage.removeItem(AUTH_TOKEN_KEY);
}

function logoutAdminSession() {
  const token = localStorage.getItem(AUTH_TOKEN_KEY);
  if (token && !shouldPreferLocalAuth()) {
    apiRequest("/api/auth/logout", { method: "POST" }).catch(() => {});
  }

  localStorage.removeItem(ADMIN_SESSION_KEY);
  localStorage.removeItem(USER_SESSION_KEY);
  localStorage.removeItem(AUTH_TOKEN_KEY);
}

function requireUserAuth(redirectUrl = "login.html") {
  if (!getUserSession()) {
    window.location.href = redirectUrl;
    return false;
  }

  return true;
}

function requireAdminAuth(redirectUrl = "admin-login.html") {
  if (!getAdminSession()) {
    window.location.href = redirectUrl;
    return false;
  }

  return true;
}

function seedAdminUser() {
  seedLocalAdminUser();
  return Promise.resolve();
}

seedLocalAdminUser();
