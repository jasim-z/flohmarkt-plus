export async function loginUser(email: string, password: string) {
  const res = await fetch("http://localhost:3950/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({ email, password }),
  });
  if (!res.ok) {
    const data = await res.json();
    throw new Error(data.message || "Login fehlgeschlagen");
  }
  return res;
}

export async function signupUser({
  email,
  password,
  displayName,
}: {
  email: string;
  password: string;
  displayName: string;
}) {
  const res = await fetch("http://localhost:3950/auth/users", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({ email, password, displayName }),
  });
  if (!res.ok) {
    const data = await res.json();
    throw new Error(data.message || "Registrierung fehlgeschlagen");
  }
  return res;
}

export async function getCurrentUser() {
  try {
    const res = await fetch("http://localhost:3950/auth/me", {
      method: "GET",
      credentials: "include",
    });
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
} 

export async function logoutUser() {
  const res = await fetch("http://localhost:3950/auth/logout", {
    method: "POST",
    credentials: "include",
  });
  return res;
}