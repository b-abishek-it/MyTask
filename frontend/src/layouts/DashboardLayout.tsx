import { Outlet, Navigate, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../features/auth/AuthContext';

import { CommandPalette } from '../features/search/CommandPalette';
import styles from './DashboardLayout.module.css';
import { LayoutDashboard, Kanban, Calendar, History, FolderOpen, Settings, LogOut, Search, PanelLeftClose, PanelLeftOpen } from 'lucide-react';
import { useState, useEffect } from 'react';

export const DashboardLayout = () => {
  const { user, isLoading, logout } = useAuth();
  const [showCommandPalette, setShowCommandPalette] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setShowCommandPalette(true);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  if (isLoading) {
    return (
      <div className={styles.loadingScreen}>
        <div className={styles.loadingSpinner}></div>
        <p>Loading MyTask...</p>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className={styles.container}>
      <CommandPalette 
        isOpen={showCommandPalette} 
        onClose={() => setShowCommandPalette(false)} 
      />
      <aside className={`${styles.sidebar} ${sidebarCollapsed ? styles.sidebarCollapsed : ''}`}>
        <button 
          className={styles.sidebarToggle} 
          onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
          title={sidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {sidebarCollapsed ? <PanelLeftOpen size={16} /> : <PanelLeftClose size={16} />}
        </button>
        <div className={styles.brand}>
          <h2>MyTask</h2>
        </div>
        <nav className={styles.nav}>
          <div className={styles.navGroup}>
            <NavLink to="/" className={({ isActive }) => `${styles.navItem} ${isActive ? styles.navItemActive : ''}`} end title={sidebarCollapsed ? "Overview" : ""}>
              <LayoutDashboard size={18} /> <span className={styles.navItemLabel}>Overview</span>
            </NavLink>
            <NavLink to="/kanban" className={({ isActive }) => `${styles.navItem} ${isActive ? styles.navItemActive : ''}`} title={sidebarCollapsed ? "Kanban Board" : ""}>
              <Kanban size={18} /> <span className={styles.navItemLabel}>Kanban Board</span>
            </NavLink>
            <NavLink to="/calendar" className={({ isActive }) => `${styles.navItem} ${isActive ? styles.navItemActive : ''}`} title={sidebarCollapsed ? "Calendar" : ""}>
              <Calendar size={18} /> <span className={styles.navItemLabel}>Calendar</span>
            </NavLink>
            <NavLink to="/my-work" className={({ isActive }) => `${styles.navItem} ${isActive ? styles.navItemActive : ''}`} title={sidebarCollapsed ? "My Work" : ""}>
              <History size={18} /> <span className={styles.navItemLabel}>My Work</span>
            </NavLink>
            <NavLink to="/notes" className={({ isActive }) => `${styles.navItem} ${isActive ? styles.navItemActive : ''}`} title={sidebarCollapsed ? "Notes" : ""}>
              <FolderOpen size={18} /> <span className={styles.navItemLabel}>Notes</span>
            </NavLink>
            <NavLink to="/settings" className={({ isActive }) => `${styles.navItem} ${isActive ? styles.navItemActive : ''}`} title={sidebarCollapsed ? "Settings" : ""}>
              <Settings size={18} /> <span className={styles.navItemLabel}>Settings</span>
            </NavLink>
          </div>
          <div className={styles.navGroupBottom}>
            <button onClick={handleLogout} className={styles.navItem} title={sidebarCollapsed ? "Logout" : ""}><LogOut size={18} /> <span className={styles.navItemLabel}>Logout</span></button>
          </div>
        </nav>
      </aside>
      <main className={styles.main}>
        <header className={styles.header}>
          <button className={styles.searchButton} onClick={() => setShowCommandPalette(true)}>
            <Search size={16} />
            <span>Search MyTask...</span>
            <kbd className={styles.kbd}>Ctrl+K</kbd>
          </button>
        </header>
        <div className={styles.content}>
          <Outlet />
        </div>
      </main>
    </div>
  );
};
