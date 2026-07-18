import { env } from "../../config/env";

const BASE_URL = env.apiBaseUrl || "http://localhost:5000/api";

/**
 * Executes a backend request with JSON parsing and token injection.
 * This helper also surfaces common frontend/backend integration issues
 * such as HTML fallback responses or malformed JSON payloads.
 */
export const request = async (url, options = {}) => {
  const token = localStorage.getItem("token");
  const headers = {
    Accept: "application/json",
    "Content-Type": "application/json",
    ...options.headers,
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  let response;
  try {
    response = await fetch(`${BASE_URL}${url}`, {
      ...options,
      headers,
    });
  } catch (error) {
    throw new Error(
      error?.message || "Unable to reach the backend. Check that the API server is running."
    );
  }

  const text = await response.text();
  const contentType = response.headers.get("content-type") || "";
  const isJsonResponse = contentType.includes("application/json");

  let data = null;
  if (text) {
    if (isJsonResponse) {
      try {
        data = JSON.parse(text);
      } catch {
        throw new Error("The server returned invalid JSON.");
      }
    } else if (text.trim().startsWith("<!DOCTYPE") || text.trim().startsWith("<html")) {
      throw new Error(
        "Received an HTML page instead of API JSON. Check VITE_API_BASE_URL or your frontend proxy configuration."
      );
    } else {
      data = text;
    }
  }

  if (!response.ok) {
    const error = new Error(
      data?.message || data?.error || `Request failed with status ${response.status}`
    );
    error.status = response.status;
    error.data = data;
    throw error;
  }

  if (data && typeof data === "object" && data.success === false) {
    const error = new Error(data.message || "The server returned an unsuccessful response.");
    error.status = response.status;
    error.data = data;
    throw error;
  }

  if (response.status === 204) return null;
  return data;
};
