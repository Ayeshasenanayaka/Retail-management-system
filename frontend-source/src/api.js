export const API_URL = import.meta.env.VITE_API_URL || "/api";

export function getSession() {
  try {
    const saved = JSON.parse(localStorage.getItem("retailSession") || "null");
    if (!saved?.token || !saved?.user || !saved.user.role) {
      localStorage.removeItem("retailSession");
      return null;
    }
    return saved;
  } catch {
    localStorage.removeItem("retailSession");
    return null;
  }
}

export function saveSession(session) {
  localStorage.setItem("retailSession", JSON.stringify(session));
}

export function clearSession() {
  localStorage.removeItem("retailSession");
}

export async function apiFetch(path, options = {}) {
  const session = getSession();
  const headers = {
    "Content-Type": "application/json",
    ...(options.headers || {})
  };
  if (session?.token) {
    headers.Authorization = `Bearer ${session.token}`;
  }
  let response;
  try {
    response = await fetch(`${API_URL}${path}`, {
      ...options,
      headers
    });
  } catch {
    throw new Error("Backend connection failed. Please check that the NetBeans Spring Boot server is running on port 8080.");
  }
  if (response.status === 204) {
    return null;
  }
  const text = await response.text();
  let data = null;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = { message: text || "Request failed" };
  }
  if (response.status === 401 || response.status === 403) {
    if (response.status === 401) {
      clearSession();
      window.dispatchEvent(new Event("retail-session-expired"));
    }
    throw new Error(data?.message || (response.status === 403 ? "Access denied for this user role" : "Session expired. Please login again."));
  }
  if (!response.ok) {
    throw new Error(data?.message || "Request failed");
  }
  return data;
}
