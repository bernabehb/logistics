import { cookies } from "next/headers";
import { API_HEADERS, EXTERNAL_API_BASE_URL } from "@/lib/apiConfig";

type FrontendSession = {
  id?: string;
  name?: string;
  username?: string;
  role?: string;
  backendToken?: string;
};

export async function getServerSession(): Promise<FrontendSession | null> {
  const cookieStore = await cookies();
  const rawSession = cookieStore.get("auth_token")?.value;
  if (!rawSession) return null;

  try {
    return JSON.parse(rawSession) as FrontendSession;
  } catch {
    return null;
  }
}

export async function getServerApiHeaders(extraHeaders: Record<string, string> = {}) {
  const session = await getServerSession();
  return {
    ...API_HEADERS,
    ...(session?.backendToken ? { Authorization: `Bearer ${session.backendToken}` } : {}),
    ...(session?.id ? { 'X-Compers-User-Id': session.id } : {}),
    ...extraHeaders,
  };
}

export async function getResolvedServerApiHeaders(extraHeaders: Record<string, string> = {}) {
  const session = await getServerSession();
  let userId = session?.id;

  if (session?.backendToken && (!userId || !/^\d+$/.test(userId))) {
    try {
      const response = await fetch(`${EXTERNAL_API_BASE_URL}/User/GetUsuarioActual`, {
        method: "GET",
        headers: {
          ...API_HEADERS,
          Authorization: `Bearer ${session.backendToken}`,
        },
        cache: "no-store",
      });

      if (response.ok) {
        const user = await response.json();
        const resolvedUserId = user?.iIdUser ?? user?.iId;
        if (resolvedUserId) userId = String(resolvedUserId);
      }
    } catch {
      // Si no se puede resolver, el backend usara sus claims o el valor por defecto.
    }
  }

  return {
    ...API_HEADERS,
    ...(session?.backendToken ? { Authorization: `Bearer ${session.backendToken}` } : {}),
    ...(userId ? { 'X-Compers-User-Id': userId } : {}),
    ...extraHeaders,
  };
}



