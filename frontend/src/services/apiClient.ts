import { getEnvApiUrl, LOCAL_API_URL } from "../config/api";

const SESSION_KEY = "guessword-session-v1";

export const apiClient = {
  /**
   * Resolves the current base API URL based on localStorage state
   */
  getApiBaseUrl(): string {
    if (typeof window !== "undefined") {
      const isLocal = window.localStorage.getItem("guessword-is-local") === "true";
      if (isLocal) {
        return LOCAL_API_URL;
      }
    }
    return getEnvApiUrl();
  },

  /**
   * Shared request method wrapping fetch
   */
  async request<T>(path: string, options: RequestInit = {}): Promise<T> {
    const baseUrl = this.getApiBaseUrl();
    // Normalize path slashes
    const normalizedPath = path.startsWith("/") ? path : `/${path}`;
    const url = `${baseUrl}${normalizedPath}`;

    const headers = new Headers(options.headers || {});
    if (!headers.has("Content-Type") && !(options.body instanceof FormData)) {
      headers.set("Content-Type", "application/json");
    }

    // Auto-inject Authorization header if logged in
    if (typeof window !== "undefined" && !headers.has("Authorization")) {
      const savedSession = window.localStorage.getItem(SESSION_KEY);
      if (savedSession) {
        try {
          const session = JSON.parse(savedSession);
          if (session?.sessionToken) {
            headers.set("Authorization", `Bearer ${session.sessionToken}`);
          }
        } catch (e) {
          console.error("apiClient failed to parse session token:", e);
        }
      }
    }

    const response = await fetch(url, {
      ...options,
      headers,
    });

    if (!response.ok) {
      let errorMessage = `Erro na requisição API (${response.status})`;
      try {
        const text = await response.text();
        const payload = JSON.parse(text);
        
        // Handle Laravel validation errors or messages
        if (payload.errors) {
          const firstError = Object.values(payload.errors).flat()[0];
          errorMessage = typeof firstError === "string" ? firstError : payload.message || errorMessage;
        } else if (payload.message) {
          errorMessage = payload.message;
        }
      } catch {
        // Response wasn't JSON, fallback to standard error status
      }
      throw new Error(errorMessage);
    }

    // Handle 204 No Content or empty responses
    const contentType = response.headers.get("content-type");
    if (response.status === 204 || (contentType && !contentType.includes("application/json"))) {
      return {} as T;
    }

    return response.json() as Promise<T>;
  },

  /**
   * HTTP GET convenience method
   */
  get<T>(path: string, options?: RequestInit): Promise<T> {
    return this.request<T>(path, { ...options, method: "GET" });
  },

  /**
   * HTTP POST convenience method
   */
  post<T>(path: string, body?: unknown, options?: RequestInit): Promise<T> {
    return this.request<T>(path, {
      ...options,
      method: "POST",
      body: body !== undefined && !(body instanceof FormData) ? JSON.stringify(body) : body,
    });
  },
};
