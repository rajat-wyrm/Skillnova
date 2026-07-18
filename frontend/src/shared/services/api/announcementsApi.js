import { request } from "./request";

const USER_ANNOUNCEMENT_PINS_STORAGE_KEY = "user-announcement-pins";

const readAnnouncementPins = () => {
  try {
    const raw = localStorage.getItem(USER_ANNOUNCEMENT_PINS_STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};

const writeAnnouncementPins = ids => {
  localStorage.setItem(USER_ANNOUNCEMENT_PINS_STORAGE_KEY, JSON.stringify(ids));
};

/**
 * Fetches the announcement feed for both admin and user-facing screens.
 */
export const getAnnouncements = () => {
  return request("/announcements");
};

/**
 * Creates a new announcement record from the admin panel.
 */
export const createAnnouncement = announcement => {
  return request("/announcements", {
    method: "POST",
    body: JSON.stringify(announcement),
  });
};

/**
 * Updates editable announcement fields such as title, content, priority, or pin state.
 */
export const updateAnnouncement = (id, payload) => {
  return request(`/announcements/${id}`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
};

/**
 * Permanently removes an announcement from the backend.
 */
export const deleteAnnouncement = id => {
  return request(`/announcements/${id}`, {
    method: "DELETE",
  });
};

/**
 * Reads the current user's pinned announcement ids from local fallback storage.
 */
export const getUserAnnouncementPins = async () => {
  return readAnnouncementPins();
};

/**
 * Adds or removes an announcement pin in local fallback storage until a backend endpoint exists.
 */
export const setUserAnnouncementPin = async (id, pinned) => {
  const currentPins = readAnnouncementPins();
  const nextPins = pinned
    ? Array.from(new Set([...currentPins, id]))
    : currentPins.filter(item => item !== id);

  writeAnnouncementPins(nextPins);
  return nextPins;
};

