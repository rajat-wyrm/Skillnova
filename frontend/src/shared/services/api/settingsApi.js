import { request } from "./request";

/**
 * Fetches platform-level branding or naming settings used across the UI shell.
 */
export const getPlatformSettings = () => {
  return request("/platform/settings");
};

/**
 * Fetches admin system settings such as maintenance mode and platform limits.
 */
export const getAdminSettings = () => {
  return request("/admin/settings");
};

/**
 * Persists admin system settings changes back to the backend.
 */
export const updateAdminSettings = settings => {
  return request("/admin/settings", {
    method: "PUT",
    body: JSON.stringify(settings),
  });
};

/**
 * Triggers the admin endpoint that resets seeded or user-linked platform data.
 */
export const resetAdminUserData = () => {
  return request("/admin/reset-user-data", {
    method: "POST",
  });
};

/**
 * Triggers the admin endpoint that deletes the platform instance.
 */
export const deleteAdminPlatform = () => {
  return request("/admin/platform", {
    method: "DELETE",
  });
};

