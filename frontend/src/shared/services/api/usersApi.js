import { getCollection, updateCollection } from "../mockDatabase";
import { request } from "./request";

const wait = (ms = 250) => new Promise(resolve => setTimeout(resolve, ms));

const toAvatar = name =>
  name
    .split(" ")
    .map(part => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

const sortUsers = users =>
  [...users].sort((left, right) => Number(right.id) - Number(left.id));

/**
 * Fetches the current authenticated user's profile details.
 */
export const getCurrentUser = () => {
  return request("/users/me");
};

/**
 * Updates the current authenticated user's profile fields.
 */
export const updateCurrentUser = profile => {
  return request("/users/me", {
    method: "PUT",
    body: JSON.stringify(profile),
  });
};

/**
 * Fetches the admin-managed user list from the backend.
 */
export const getAdminUsers = () => {
  return request("/users");
};

/**
 * Creates a new admin-managed user record.
 */
export const createAdminUser = user => {
  return request("/users", {
    method: "POST",
    body: JSON.stringify(user),
  });
};

/**
 * Updates an existing admin-managed user record.
 */
export const updateAdminUser = (id, updates) => {
  return request(`/users/${id}`, {
    method: "PATCH",
    body: JSON.stringify(updates),
  });
};

/**
 * Revokes access for a user while preserving their record.
 */
export const terminateAdminUser = id => {
  return request(`/users/${id}/terminate`, {
    method: "PATCH",
  });
};

/**
 * Permanently deletes a user record from the backend.
 */
export const deleteAdminUser = id => {
  return request(`/users/${id}`, {
    method: "DELETE",
  });
};

/**
 * Fetches user-facing preference settings for the current account.
 */
export const getUserSettings = () => {
  return request("/users/settings");
};

/**
 * Persists user-facing preference settings for the current account.
 */
export const updateUserSettings = settings => {
  return request("/users/settings", {
    method: "PATCH",
    body: JSON.stringify(settings),
  });
};

/**
 * Deactivates the current account without fully deleting its record.
 */
export const deactivateCurrentUser = () => {
  return request("/users/me/deactivate", {
    method: "POST",
  });
};

/**
 * Permanently deletes the current account, optionally including a reason payload.
 */
export const deleteCurrentUser = (payload = {}) => {
  return request("/users/me", {
    method: "DELETE",
    body: JSON.stringify(payload),
  });
};

export const createMockUsersApi = () => ({
  async list() {
    await wait();
    return {
      items: sortUsers(getCollection("users")),
    };
  },

  async create(payload) {
    await wait();

    const user = {
      id: Date.now(),
      name: payload.name.trim(),
      email: payload.email.trim().toLowerCase(),
      dept: payload.dept.trim(),
      role: payload.role,
      status: "Active",
      avatar: toAvatar(payload.name.trim()),
      rating: 5.0,
    };

    updateCollection("users", users => [user, ...users]);
    return user;
  },

  async updateRole(id) {
    await wait();

    let updatedUser = null;
    updateCollection("users", users =>
      users.map(user => {
        if (user.id !== id) return user;
        updatedUser = {
          ...user,
          role: user.role === "Admin" ? "Intern" : "Admin",
        };
        return updatedUser;
      })
    );

    return updatedUser;
  },

  async updateStatus(id) {
    await wait();

    let updatedUser = null;
    updateCollection("users", users =>
      users.map(user => {
        if (user.id !== id) return user;
        updatedUser = {
          ...user,
          status: user.status === "Active" ? "Inactive" : "Active",
        };
        return updatedUser;
      })
    );

    return updatedUser;
  },

  async deactivate(id) {
    await wait();

    let updatedUser = null;
    updateCollection("users", users =>
      users.map(user => {
        if (user.id !== id) return user;
        updatedUser = {
          ...user,
          status: "Inactive",
        };
        return updatedUser;
      })
    );

    return updatedUser;
  },

  async remove(id) {
    await wait();
    updateCollection("users", users => users.filter(user => user.id !== id));
    return { success: true };
  },
});
