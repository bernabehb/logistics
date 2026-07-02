"use client";

import { useEffect } from "react";

export function SessionExpiredHandler() {
  useEffect(() => {
    const originalFetch = window.fetch.bind(window);
    let redirecting = false;

    window.fetch = async (input, init) => {
      const response = await originalFetch(input, init);
      const url = typeof input === "string" ? input : input instanceof URL ? input.pathname : input.url;
      const isLocalApiRequest = url.startsWith("/api") || url.includes("/api/");

      if (response.status === 401 && isLocalApiRequest && !redirecting) {
        redirecting = true;
        window.location.href = "/login?session=expired";
      }

      return response;
    };

    return () => {
      window.fetch = originalFetch;
    };
  }, []);

  return null;
}
