import { MOCK_USERS } from "../utils/constants";
import { readJSON, writeJSON, STORAGE_KEYS } from "./storage";

const clone = value => JSON.parse(JSON.stringify(value));

const defaultDatabase = {
  users: MOCK_USERS,
};

const readDatabase = () => {
  const database = readJSON(STORAGE_KEYS.mockDatabase, null);

  if (database) {
    return {
      ...defaultDatabase,
      ...database,
    };
  }

  writeJSON(STORAGE_KEYS.mockDatabase, defaultDatabase);
  return clone(defaultDatabase);
};

const writeDatabase = database => {
  writeJSON(STORAGE_KEYS.mockDatabase, database);
};

export const getCollection = key => {
  const database = readDatabase();
  return clone(database[key] || []);
};

export const updateCollection = (key, updater) => {
  const database = readDatabase();
  const nextValue = updater(clone(database[key] || []));
  const nextDatabase = {
    ...database,
    [key]: nextValue,
  };

  writeDatabase(nextDatabase);
  return clone(nextValue);
};

