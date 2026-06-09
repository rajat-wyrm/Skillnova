import { request } from "./request";

const QA_STORAGE_KEY = "qa-questions";
const DEFAULT_QA_QUESTIONS = [
  {
    id: 1,
    title: "How do I submit my weekly internship report?",
    category: "Reports",
    votes: 14,
    answers: 4,
    author: "Rahul Sharma",
    time: "2h ago",
  },
  {
    id: 2,
    title: "Where can I find project documentation?",
    category: "Knowledge Base",
    votes: 9,
    answers: 3,
    author: "Priya Patel",
    time: "5h ago",
  },
  {
    id: 3,
    title: "How do I schedule a meeting with my mentor?",
    category: "Meetings",
    votes: 6,
    answers: 2,
    author: "Amit Verma",
    time: "1d ago",
  },
  {
    id: 4,
    title: "What format should my weekly report be in?",
    category: "Reports",
    votes: 4,
    answers: 1,
    author: "Sneha Reddy",
    time: "2d ago",
  },
];

const readQaQuestions = () => {
  try {
    const raw = localStorage.getItem(QA_STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : null;
    return Array.isArray(parsed) && parsed.length > 0 ? parsed : DEFAULT_QA_QUESTIONS;
  } catch {
    return DEFAULT_QA_QUESTIONS;
  }
};

const writeQaQuestions = questions => {
  localStorage.setItem(QA_STORAGE_KEY, JSON.stringify(questions));
};

/**
 * Returns the discussion question list from local fallback storage until a backend exists.
 */
export const getQaQuestions = async () => {
  return readQaQuestions();
};

/**
 * Creates a new local fallback QA post so the forum remains usable offline.
 */
export const createQaQuestion = async payload => {
  const nextQuestion = {
    id: Date.now(),
    title: payload.title,
    category: payload.category || "Projects",
    votes: 0,
    answers: 0,
    author: payload.author || "You",
    time: "Just now",
  };

  const nextQuestions = [nextQuestion, ...readQaQuestions()];
  writeQaQuestions(nextQuestions);
  return nextQuestion;
};

/**
 * Increments the vote count for a locally stored QA post.
 */
export const upvoteQaQuestion = async id => {
  let updatedQuestion = null;

  const nextQuestions = readQaQuestions().map(question => {
    if (question.id !== id) {
      return question;
    }

    updatedQuestion = { ...question, votes: question.votes + 1 };
    return updatedQuestion;
  });

  writeQaQuestions(nextQuestions);
  return updatedQuestion;
};

/**
 * Reserved helper for future backend QA endpoints while keeping request wiring consistent.
 */
export const getQaEndpointHealth = () => request("/qa");

