"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import users from "@/lib/users.json";

export async function loginAction(formData: FormData) {
  const username = formData.get("username")?.toString().trim();
  const password = formData.get("password")?.toString().trim();

  if (!username || !password) {
    return { error: "Por favor, ingresa usuario y contraseña" };
  }

  const user = users.find(
    (u) => u.username === username && u.password === password
  );

  if (!user) {
    return { error: "Usuario o contraseña incorrectos" };
  }

  const sessionData = {
    id: user.id,
    name: user.name,
    role: user.role,
  };

  const cookieStore = await cookies();
  cookieStore.set("auth_token", JSON.stringify(sessionData), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    maxAge: 60 * 60 * 24 * 7, // 1 week
    path: "/",
  });

  if (user.role === "Chofer") {
    redirect("/chofer");
  } else if (user.role === "Cajas") {
    redirect("/cajas");
  } else if (user.role === "Admin") {
    redirect("/admin");
  } else {
    redirect("/logistics/rutas");
  }
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
