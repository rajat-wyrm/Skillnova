import { env } from "../../config/env";
import { createHttpClient } from "../httpClient";
import { createMockAuthApi } from "./authApi";
import { createMockUsersApi } from "./usersApi";
export * from "./announcementsApi";
export * from "./assistantApi";
export * from "./analyticsApi";
export * from "./authApi";
export * from "./dashboardApi";
export * from "./internsApi";
export * from "./knowledgeApi";
export * from "./mockAuthUsers";
export * from "./qaApi";
export * from "./reportsApi";
export * from "./request";
export * from "./settingsApi";
export * from "./usersApi";

const httpClient = createHttpClient({
  baseUrl: env.apiBaseUrl,
});

const createHttpPlaceholder = resourceName => ({
  async list() {
    return httpClient.get(`/${resourceName}`);
  },
});

export const api = {
  auth: env.useMockApi ? createMockAuthApi() : createHttpPlaceholder("auth"),
  users: env.useMockApi ? createMockUsersApi() : createHttpPlaceholder("users"),
};
