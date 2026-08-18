import { useEffect, useState } from "react";
import { useAuthStore } from "./lib/auth";
import { connectSocket, disconnectSocket } from "./lib/socket";
import AuthGate from "./AuthGate";
import UserApp from "./user/App";
import AdminApp from "./admin/App";
import MentorApp from "./mentor/App";
import LoaderScreen from "./shared/components/LoaderScreen";
import AIAssistant from "./shared/components/AIAssistant";
import AuthCallback from "./auth/pages/AuthCallback";

const App = () => {
  const { user, step, accessToken, hydrated, hydrate } = useAuthStore();
  const [online, setOnline] = useState(() => navigator.onLine);

  useEffect(() => {
    hydrate();
  }, [hydrate]);

  useEffect(() => {
    const handleOnline = () => setOnline(true);
    const handleOffline = () => setOnline(false);
    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  useEffect(() => {
    if (user?.id && step === "authenticated" && accessToken) {
      connectSocket(accessToken);
    } else {
      disconnectSocket();
    }
    return () => disconnectSocket();
  }, [accessToken, step, user?.id]);

  if (window.location.pathname === "/auth/callback") return <AuthCallback />;
  if (!hydrated) return <LoaderScreen label="Initialising SkillNova…" />;
  if (step === "auth-checking") return <LoaderScreen label="Checking your session…" />;
  if (!online) return <LoaderScreen label="Waiting for network connection…" />;
  if (!user || step !== "authenticated") return <AuthGate />;

  return (
    <>
      {user.role === "SUPER_ADMIN" || user.role === "ADMIN" ? (
        <AdminApp />
      ) : user.role === "MENTOR" ? (
        <MentorApp />
      ) : (
        <UserApp />
      )}
      <AIAssistant role={user.role} userName={user.name} />
    </>
  );
};

export default App;
