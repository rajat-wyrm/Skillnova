import { request } from "./request";

/**
 * Fetches starter prompt suggestions for the AI assistant UI.
 */
export const getAiSuggestions = () => {
  return request("/ai/suggestions");
};

/**
 * Fetches the current list of assistant capabilities shown in the sidebar.
 */
export const getAiCapabilities = () => {
  return request("/ai/capabilities");
};

/**
 * Fetches the welcome message shown when the assistant initializes.
 */
export const getAiWelcomeMessage = () => {
  return request("/ai/welcome-message");
};

/**
 * Sends a user message to the assistant endpoint and returns the assistant reply payload.
 */
export const sendAiChatMessage = message => {
  return request("/ai/chat", {
    method: "POST",
    body: JSON.stringify({ message }),
  });
};

/**
 * Bootstraps the assistant UI by aggregating suggestions, capabilities, and welcome copy.
 */
export const getAiAssistantBootstrap = async () => {
  const [suggestionsResult, capabilitiesResult, welcomeResult] = await Promise.allSettled([
    getAiSuggestions(),
    getAiCapabilities(),
    getAiWelcomeMessage(),
  ]);

  if (
    suggestionsResult.status === "rejected" &&
    capabilitiesResult.status === "rejected" &&
    welcomeResult.status === "rejected"
  ) {
    throw new Error("AI assistant bootstrap unavailable");
  }

  return {
    suggestions:
      suggestionsResult.status === "fulfilled"
        ? suggestionsResult.value?.data ?? suggestionsResult.value ?? []
        : [],
    capabilities:
      capabilitiesResult.status === "fulfilled"
        ? capabilitiesResult.value?.data ?? capabilitiesResult.value ?? []
        : [],
    welcomeMessage:
      welcomeResult.status === "fulfilled"
        ? welcomeResult.value?.message || "Hello! How can I help you today?"
        : "Hello! How can I help you today?",
    partialData:
      suggestionsResult.status === "rejected" ||
      capabilitiesResult.status === "rejected" ||
      welcomeResult.status === "rejected",
  };
};
