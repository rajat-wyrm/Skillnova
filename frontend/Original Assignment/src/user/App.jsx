// ══════════════════════════════════════════════
//  USER — App.jsx
// ══════════════════════════════════════════════

import React, { useState } from "react";
import MainLayout    from "./components/MainLayout";
import Dashboard     from "./pages/Dashboard";
import KnowledgeBase from "./pages/KnowledgeBase";
import QA            from "./pages/QA";
import Reports       from "./pages/Reports";
import Meetings      from "./pages/Meetings";
import Announcements from "./pages/Announcements";
import Analytics     from "./pages/Analytics";
import Profile       from "./pages/Profile";
import Settings      from "./pages/Settings";

import ProjectFlow   from "./pages/ProjectFlow";

const PAGES = {
  dashboard:     <Dashboard />,
  knowledge:     <KnowledgeBase />,
  qa:            <QA />,
  project_flow:  <ProjectFlow />,
  reports:       <Reports />,
  meetings:      <Meetings />,
  announcements: <Announcements />,
  analytics:     <Analytics />,
  profile:       <Profile />,
  settings:      <Settings />,
};

const UserApp = ({ onLogout }) => {
  const [page, setPage] = useState("dashboard");

  return (
    <MainLayout page={page} onNavigate={setPage} onLogout={onLogout}>
      {/* Inject onNavigate to the page components so they can change the route */}
      {React.cloneElement(PAGES[page], { onNavigate: setPage })}
    </MainLayout>
  );
};

export default UserApp;