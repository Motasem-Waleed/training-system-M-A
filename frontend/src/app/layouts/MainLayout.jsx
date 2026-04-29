import { useEffect, useRef, useState } from "react";
import { Outlet, useLocation } from "react-router-dom";
import Sidebar from "./Sidebar";
import Navbar from "./Navbar";
import { trackPageVisit } from "../../services/api";

const trackedPageVisits = new Map();
const PAGE_VISIT_DEDUP_MS = 10_000;

export default function MainLayout() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const location = useLocation();
  const lastTrackedPathRef = useRef("");

  const openSidebar = () => setIsSidebarOpen(true);
  const closeSidebar = () => setIsSidebarOpen(false);

  useEffect(() => {
    const currentPath = `${location.pathname}${location.search}`;
    if (currentPath === lastTrackedPathRef.current) {
      return;
    }
    lastTrackedPathRef.current = currentPath;
    const now = Date.now();
    const lastTrackedAt = trackedPageVisits.get(currentPath) || 0;
    if (now - lastTrackedAt < PAGE_VISIT_DEDUP_MS) {
      return;
    }
    trackedPageVisits.set(currentPath, now);

    trackPageVisit({
      path: currentPath,
      title: typeof document !== "undefined" ? document.title : "",
    }).catch(() => {
      // Keep navigation smooth even if logging endpoint fails.
    });
  }, [location.pathname, location.search]);

  return (
    <div className="main-layout">
      <Sidebar isOpen={isSidebarOpen} onClose={closeSidebar} />

      <div
        className={`sidebar-overlay ${isSidebarOpen ? "show" : ""}`}
        onClick={closeSidebar}
      />

      <div className="main-content">
        <Navbar onMenuClick={openSidebar} />

        <div className="page-content">
          <Outlet />
        </div>
      </div>
    </div>
  );
}