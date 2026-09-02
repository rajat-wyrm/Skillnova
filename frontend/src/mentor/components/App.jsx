import { useState } from 'react';
import MainLayout from './components/MainLayout';
import Attendance from './pages/Attendance';
import AttendanceVerification from './pages/AttendanceVerification';

export default function App() {
  const [activePage, setActivePage] = useState('attendance-verify');

  // This replaces your old MentorDashboard router completely
  const renderContent = () => {
    switch (activePage) {
      case 'attendance':
        return <Attendance />;
      case 'attendance-verify':
        return <AttendanceVerification />;
      default:
        return (
          <div className="p-12 text-center flex flex-col items-center justify-center h-full">
            <h2 className="text-2xl font-bold text-gray-400">
              {activePage.toUpperCase()}
            </h2>
            <p className="text-gray-500 mt-2">Component not linked yet.</p>
          </div>
        );
    }
  };

  return (
    <MainLayout page={activePage} onNavigate={setActivePage}>
      {renderContent()}
    </MainLayout>
  );
}