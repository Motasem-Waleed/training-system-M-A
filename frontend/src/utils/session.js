export function readStoredUser() {
  try {
    return JSON.parse(localStorage.getItem("user") || "{}");
  } catch {
    return {};
  }
}

export function writeStoredUser(user) {
  localStorage.setItem("user", JSON.stringify(user || {}));
}

export function clearStoredUser() {
  localStorage.removeItem("user");
}

export function readStoredToken() {
  return localStorage.getItem("access_token");
}

export function clearStoredToken() {
  localStorage.removeItem("access_token");
}

