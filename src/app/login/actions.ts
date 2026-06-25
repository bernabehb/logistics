"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { EXTERNAL_API_BASE_URL } from "@/lib/apiConfig";

export async function loginAction(formData: FormData) {
  const username = formData.get("username")?.toString().trim();
  const password = formData.get("password")?.toString().trim();

  if (!username || !password) {
    return { error: "Por favor, ingresa usuario y contraseña" };
  }

  const apiBases = [
    EXTERNAL_API_BASE_URL,
    "https://localhost:5151",
    "http://localhost:5151",
  ];

  let serverWasReached = false;
  let authenticated = false;

  for (const apiBase of apiBases) {
    const loginUrl = new URL(`${apiBase}/User/GetLogin`);
    loginUrl.searchParams.set("sUser", username);
    loginUrl.searchParams.set("sPassword", password);

    try {
      const response = await fetch(loginUrl.toString(), {
        method: "GET",
        headers: {
          Accept: "application/json",
          "X-Tunnel-Skip-Anti-Phishing-Page": "true",
        },
        cache: "no-store",
      });

      serverWasReached = true;

      if (response.ok) {
        authenticated = true;
        break;
      }
    } catch {
      if (apiBase === apiBases[apiBases.length - 1] && !serverWasReached) {
        return { error: "No se pudo conectar con el servidor de autenticación" };
      }
    }
  }

  if (!authenticated) {
    return {
      error: serverWasReached
        ? "Usuario o contraseña incorrectos"
        : "No se pudo conectar con el servidor de autenticación",
    };
  }

  const sessionData = {
    id: username,
    name: username,
    role: "Logistica",
  };

  const cookieStore = await cookies();
  cookieStore.set("auth_token", JSON.stringify(sessionData), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    maxAge: 60 * 60 * 24 * 7,
    path: "/",
  });

  redirect("/logistics/rutas");
}

export async function logoutAction() {
  const cookieStore = await cookies();
  cookieStore.delete("auth_token");
  redirect("/login");
}

export async function getUserSession() {
  const cookieStore = await cookies();
  const token = cookieStore.get("auth_token")?.value;
  if (!token) return null;
  try {
    return JSON.parse(token);
  } catch {
    return null;
  }
}
