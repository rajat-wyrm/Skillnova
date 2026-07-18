import { request } from "./request";

/**
 * Fetches intern tracking data for attendance, status, and workload monitoring.
 */
export const getInterns = () => {
  return request("/interns");
};

/**
 * Creates a new intern record from the admin management screen.
 */
export const createIntern = payload => {
  return request("/interns", {
    method: "POST",
    body: JSON.stringify(payload),
  });
};

/**
 * Toggles or updates attendance for a specific intern record.
 */
export const updateInternAttendance = id => {
  return request(`/interns/${id}/attendance`, {
    method: "PATCH",
  });
};

/**
 * Toggles or updates the active status of a specific intern record.
 */
export const updateInternStatus = id => {
  return request(`/interns/${id}/status`, {
    method: "PATCH",
  });
};
