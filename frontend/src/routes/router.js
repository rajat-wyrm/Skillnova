import { useEffect, useSyncExternalStore } from "react";

const NAVIGATION_EVENT = "skillnova:navigation";

const normalizePath = path => {
  if (!path || path === "/") return "/";
  return path.replace(/\/+$/, "");
};

const getSnapshot = () => normalizePath(window.location.pathname);

const subscribe = listener => {
  window.addEventListener("popstate", listener);
  window.addEventListener(NAVIGATION_EVENT, listener);

  return () => {
    window.removeEventListener("popstate", listener);
    window.removeEventListener(NAVIGATION_EVENT, listener);
  };
};

export const navigate = (path, { replace = false } = {}) => {
  const targetPath = normalizePath(path);
  const currentPath = getSnapshot();

  if (targetPath === currentPath) return;

  window.history[replace ? "replaceState" : "pushState"]({}, "", targetPath);
  window.dispatchEvent(new Event(NAVIGATION_EVENT));
  window.scrollTo({ top: 0, behavior: "auto" });
};

export const usePathname = () =>
  useSyncExternalStore(subscribe, getSnapshot, () => "/");

export const Redirect = ({ to, replace = true }) => {
  useEffect(() => {
    navigate(to, { replace });
  }, [replace, to]);

  return null;
};

