"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { EXTERNAL_API_BASE_URL } from "@/lib/apiConfig";

type LoginTokenPayload = {
  iIdUser?: string;
  sUser?: string;
  sub?: string;
  unique_name?: string;
  nameid?: string;
  name?: string;
  [key: string]: unknown;
};

type BackendUser = {
  iId?: number;
  iIdUser?: number;
  sUser?: string;
  sName?: string;
  iIdRol?: number;
  [key: string]: unknown;
};

function decodeJwtPayload(token: string): LoginTokenPayload | null {
  const [, payload] = token.split(".");
  if (!payload) return null;

  try {
    const normalized = payload.replace(/-/g, "+").replace(/_/g, "/");
    const padded = normalized.padEnd(normalized.length + ((4 - (normalized.length % 4)) % 4), "=");
    return JSON.parse(Buffer.from(padded, "base64").toString("utf8"));
  } catch {
    return null;
  }
}

function getClaimValue(payload: LoginTokenPayload | null, claim: string) {
  if (!payload) return undefined;
  const directValue = payload[claim];
  if (typeof directValue === "string" && directValue.trim()) return directValue.trim();

  const matchingKey = Object.keys(payload).find((key) => key.endsWith(`/${claim}`));
  const matchingValue = matchingKey ? payload[matchingKey] : undefined;
  return typeof matchingValue === "string" && matchingValue.trim() ? matchingValue.trim() : undefined;
}

async function getBackendUser(apiBase: string, backendToken: string): Promise<BackendUser | null> {
  try {
    const response = await fetch(`${apiBase}/User/GetUsuarioActual`, {
      method: "GET",
      headers: {
        Accept: "application/json",
        Authorization: `Bearer ${backendToken}`,
        "X-Tunnel-Skip-Anti-Phishing-Page": "true",
      },
      cache: "no-store",
    });

    if (!response.ok) return null;
    return await response.json();
  } catch {
    return null;
  }
}

export async function loginAction(formData: FormData) {
  const username = formData.get("username")?.toString().trim();
  const password = formData.get("password")?.toString().trim();

  if (!username || !password) {
    return { error: "Por favor, ingresa usuario y contrasena" };
  }

  const apiBases = [
    EXTERNAL_API_BASE_URL,
    "https://localhost:5151",
    "http://localhost:5151",
  ];

  let serverWasReached = false;
  let authenticated = false;
  let backendToken = "";
  let authenticatedApiBase = EXTERNAL_API_BASE_URL;

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
        const data = await response.json().catch(() => null);
        backendToken = typeof data?.message === "string" ? data.message : "";
        authenticated = Boolean(backendToken);
        authenticatedApiBase = apiBase;
        if (authenticated) break;
      }
    } catch {
      if (apiBase === apiBases[apiBases.length - 1] && !serverWasReached) {
        return { error: "No se pudo conectar con el servidor de autenticacion" };
      }
    }
  }

  if (!authenticated) {
    return {
      error: serverWasReached
        ? "Usuario o contrasena incorrectos"
        : "No se pudo conectar con el servidor de autenticacion",
    };
  }

  const backendUser = await getBackendUser(authenticatedApiBase, backendToken);
  const tokenPayload = decodeJwtPayload(backendToken);
  const userId = backendUser?.iIdUser?.toString()
    ?? backendUser?.iId?.toString()
    ?? getClaimValue(tokenPayload, "iIdUser")
    ?? getClaimValue(tokenPayload, "nameidentifier")
    ?? getClaimValue(tokenPayload, "nameid")
    ?? getClaimValue(tokenPayload, "sub");
  const userName = backendUser?.sUser
    ?? backendUser?.sName
    ?? getClaimValue(tokenPayload, "sUser")
    ?? getClaimValue(tokenPayload, "unique_name")
    ?? getClaimValue(tokenPayload, "name")
    ?? username;

  const sessionData = {
    id: userId,
    name: userName,
    username,
    role: "Logistica",
    backendToken,
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
