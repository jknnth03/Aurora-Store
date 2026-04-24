import { useState, useEffect, useRef } from "react";
import { Outlet, useLocation } from "react-router";
import Sidebar from "../sidebar/Sidebar";
import Appbar from "../appbar/Appbar";
import Footer from "../footer/Footer";
import "./Layout.scss";

const Layout = () => {
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const sidebarRef = useRef(null);

  useEffect(() => {
    if (location.pathname === "/") {
      setSidebarOpen(false);
    }
  }, [location.pathname]);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (sidebarRef.current && !sidebarRef.current.contains(e.target)) {
        setSidebarOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="layout">
      <div ref={sidebarRef}>
        <Sidebar
          open={sidebarOpen}
          mobileSidebarOpen={mobileSidebarOpen}
          onCloseMobile={() => setMobileSidebarOpen(false)}
          onToggleSidebar={() => setSidebarOpen((p) => !p)}
          onCloseSidebar={() => setSidebarOpen(false)}
        />
      </div>

      <div className="layout__body">
        <Appbar
          open={sidebarOpen}
          setOpen={setSidebarOpen}
          isMobileSidebarOpen={mobileSidebarOpen}
          setMobileSidebarOpen={setMobileSidebarOpen}
        />

        <main className="layout__content">
          <Outlet />
        </main>

        <Footer />
      </div>
    </div>
  );
};

export default Layout;
