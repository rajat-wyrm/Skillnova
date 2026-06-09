import { env } from "./env";

export const APP_CONFIG = {
  appName: env.appName,
  demoAuth: {
    admin: {
      email: "admin@skillnova.com",
      password: "admin",
      verificationCode: "123456",
    },
    intern: {
      email: "user@skillnova.com",
      password: "user",
      verificationCode: "654321",
    },
  },
};

