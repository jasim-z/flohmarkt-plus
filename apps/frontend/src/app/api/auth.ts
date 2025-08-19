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
  
  // Store the token in localStorage for cross-origin requests
  const responseData = await res.json();
  if (responseData.access_token) {
    localStorage.setItem('auth_token', responseData.access_token);
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
    // Get token from localStorage
    const token = localStorage.getItem('auth_token');
    
    if (!token) {
      return null;
    }
    
    const res = await fetch("http://localhost:3950/auth/me", {
      method: "GET",
      headers: {
        "Authorization": `Bearer ${token}`
      },
    });
    if (res.ok) {
      return await res.json();
    } else if (res.status === 401) {
      // Token expired or invalid, remove it
      localStorage.removeItem('auth_token');
      return null;
    }
    return null;
  } catch {
    return null;
  }
} 

export async function logoutUser() {
  // Remove token from localStorage
  localStorage.removeItem('auth_token');
  
  const res = await fetch("http://localhost:3950/auth/logout", {
    method: "POST",
    credentials: "include",
  });
  return res;
}