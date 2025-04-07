import { useState } from "react";
import Header from "@/components/Header";
import Sidebar from "@/components/Sidebar";
import MobileNavigation from "@/components/MobileNavigation";
import { useLocation } from "wouter";

interface LayoutProps {
  children: React.ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [location] = useLocation();
  
  const currentView = location === "/" 
    ? "dashboard" 
    : location.substring(1); // Remove leading slash

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  const closeSidebar = () => {
    setSidebarOpen(false);
  };

  return (
    <div className="min-h-screen flex flex-col bg-gray-100 dark:bg-gray-900">
      <Header toggleSidebar={toggleSidebar} />
      
      <div className="flex flex-1 relative">
        <Sidebar currentView={currentView} isOpen={sidebarOpen} closeSidebar={closeSidebar} />
        
        <main className="flex-1 p-5 overflow-auto pb-16 md:pb-5">
          <div className="max-w-7xl mx-auto">
            {children}
          </div>
        </main>
      </div>
      
      <MobileNavigation currentView={currentView} toggleSidebar={toggleSidebar} />
    </div>
  );
}
