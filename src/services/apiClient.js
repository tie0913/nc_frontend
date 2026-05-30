const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "/api";

const TOKEN_KEY = "nutrition_coach_token";

export function getToken() {
  return localStorage.getItem(TOKEN_KEY);
}

export function setToken(token) {
  localStorage.setItem(TOKEN_KEY, token);
}

export function clearToken() {
  localStorage.removeItem(TOKEN_KEY);
}

export function getClientTimezone() {
  const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
  return timezone || "America/Regina";
}

export function getClientTimezoneOffset() {
  return String(new Date().getTimezoneOffset());
}
export function getClientLocalDate() {
  const date = new Date();

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}
export async function apiRequest(path, options = {}) {
  const token = getToken();

  const clientTimezone = getClientTimezone();
  const clientTimezoneOffset = getClientTimezoneOffset();

  const headers = {
    "Content-Type": "application/json",
    "Timezone": clientTimezone,
    // "Timezone-Offset": clientTimezoneOffset,
    ...(options.headers || {}),
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

    console.log("[API] Request:", path);
  console.log("[API] Timezone:", clientTimezone);
  console.log("[API] Timezone Offset:", clientTimezoneOffset);

  try {
    const response = await fetch(`${API_BASE_URL}${path}`, {
      ...options,
      headers,
    });

    const result = await response.json();

    return result;
  } catch (error) {
    return {
      code: 1,
      message: "Cannot connect to backend server.",
      data: null,
    };
  }
}