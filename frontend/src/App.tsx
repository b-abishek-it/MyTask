import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './features/auth/AuthContext';
import { WorkspaceProvider } from './features/workspace/WorkspaceContext';
import { DashboardLayout } from './layouts/DashboardLayout';
import { Login } from './pages/Login/Login';
import { Overview } from './pages/Overview/Overview';
import { Kanban } from './pages/Kanban/Kanban';
import { CalendarPage } from './pages/Calendar/Calendar';
import { MyWork } from './pages/MyWork/MyWork';
import { Notes } from './pages/Notes/Notes';
import { Settings } from './pages/Settings/Settings';

function App() {
  return (
    <AuthProvider>
      <WorkspaceProvider>
        <Router>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route element={<DashboardLayout />}>
              <Route path="/" element={<Overview />} />
              <Route path="/kanban" element={<Kanban />} />
              <Route path="/calendar" element={<CalendarPage />} />
              <Route path="/my-work" element={<MyWork />} />
              <Route path="/notes" element={<Notes />} />
              <Route path="/settings" element={<Settings />} />
            </Route>
          </Routes>
        </Router>
      </WorkspaceProvider>
    </AuthProvider>
  );
}

export default App;
