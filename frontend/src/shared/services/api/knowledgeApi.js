import { request } from "./request";

const formatArticleDate = value => {
  if (!value) {
    return "Recently added";
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
};

/**
 * Normalizes a raw knowledge article into the richer frontend shape expected by
 * both admin and user pages while keeping the API contract flexible.
 */
export const normalizeKnowledgeArticle = article => ({
  id: article?.id,
  title: article?.title || "Untitled article",
  category: article?.category || "General",
  views: Number(article?.views) || 0,
  helpful: Number(article?.helpful) || 0,
  author: article?.author || "Admin",
  date: formatArticleDate(article?.date || article?.createdAt),
  tags: Array.isArray(article?.tags) ? article.tags : [],
  verified: Boolean(article?.verified),
  content: article?.content || "",
  preview:
    article?.preview ||
    article?.summary ||
    (article?.content || "").replace(/\s+/g, " ").trim().slice(0, 160),
});

/**
 * Extracts and normalizes article arrays from the common frontend API envelope.
 */
export const normalizeKnowledgeArticlesResponse = response => {
  const items = response?.data || response || [];
  return Array.isArray(items) ? items.map(normalizeKnowledgeArticle) : [];
};

/**
 * Fetches knowledge base articles for admin moderation and editing.
 */
export const getAdminKnowledgeArticles = () => {
  return request("/admin/knowledge/articles");
};

/**
 * Creates a new knowledge article draft from the admin panel.
 */
export const createAdminKnowledgeArticle = article => {
  return request("/admin/knowledge/articles", {
    method: "POST",
    body: JSON.stringify(article),
  });
};

/**
 * Updates article metadata, verification state, or content from the admin panel.
 */
export const updateAdminKnowledgeArticle = (id, payload) => {
  return request(`/admin/knowledge/articles/${id}`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
};

/**
 * Deletes an article from the admin knowledge management area.
 */
export const deleteAdminKnowledgeArticle = id => {
  return request(`/admin/knowledge/articles/${id}`, {
    method: "DELETE",
  });
};

/**
 * Fetches published knowledge articles for user-facing browsing screens.
 */
export const getKnowledgeArticles = () => {
  return request("/knowledge/articles");
};

/**
 * Submits a helpful or not-helpful feedback action for a knowledge article.
 */
export const submitKnowledgeArticleFeedback = (id, payload) => {
  return request(`/knowledge/articles/${id}/feedback`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
};
