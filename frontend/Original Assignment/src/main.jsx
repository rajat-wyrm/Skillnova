// src/main.jsx
import React from "react";
import ReactDOM from "react-dom/client";
import AuthGate from "./AuthGate";
import "./index.css";

// Apply saved theme before React renders (prevents flash of wrong theme)
if (localStorage.getItem("theme") === "dark") {
  document.documentElement.classList.add("dark");
}

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <AuthGate />
  </React.StrictMode>
);