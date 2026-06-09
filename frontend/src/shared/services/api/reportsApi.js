import { request } from "./request";

/**
 * Fetches project flow and reporting data used by the user task journey.
 */
export const getReports = () => {
  return request("/reports");
};

/**
 * Fetches reports submitted by all users for the admin review surface.
 */
export const getAdminReports = () => {
  return request("/admin/reports");
};

/**
 * Approves or scores an admin-facing report review item.
 */
export const approveAdminReport = (id, payload = {}) => {
  return request(`/admin/reports/${id}/approve`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
};

/**
 * Fetches the currently logged-in user's report submissions.
 */
export const getUserReports = () => {
  return request("/users/reports");
};

/**
 * Creates a new report submission on behalf of the current user.
 */
export const createUserReport = report => {
  return request("/users/reports", {
    method: "POST",
    body: JSON.stringify(report),
  });
};

