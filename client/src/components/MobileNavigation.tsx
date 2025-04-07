import { Link } from "wouter";

interface MobileNavigationProps {
  currentView: string;
  toggleSidebar: () => void;
}

export default function MobileNavigation({ currentView, toggleSidebar }: MobileNavigationProps) {
  return (
    <nav className="md:hidden bg-white border-t fixed bottom-0 left-0 right-0 z-20 dark:bg-gray-800 dark:border-gray-700">
      <div className="flex justify-around">
        <Link href="/">
          <a className={`flex flex-col items-center py-2 px-3 ${
            currentView === 'dashboard' 
              ? 'text-primary dark:text-primary-light' 
              : 'text-gray-500 dark:text-gray-400'
          }`}>
            <i className="bi bi-speedometer2 text-xl"></i>
            <span className="text-xs mt-1">Dashboard</span>
          </a>
        </Link>
        
        <Link href="/tasks">
          <a className={`flex flex-col items-center py-2 px-3 ${
            currentView === 'tasks' 
              ? 'text-primary dark:text-primary-light' 
              : 'text-gray-500 dark:text-gray-400'
          }`}>
            <i className="bi bi-calendar-check text-xl"></i>
            <span className="text-xs mt-1">Tasks</span>
          </a>
        </Link>
        
        <Link href="/inventory">
          <a className={`flex flex-col items-center py-2 px-3 ${
            currentView === 'inventory' 
              ? 'text-primary dark:text-primary-light' 
              : 'text-gray-500 dark:text-gray-400'
          }`}>
            <i className="bi bi-box text-xl"></i>
            <span className="text-xs mt-1">Inventory</span>
          </a>
        </Link>
        
        <Link href="/equipment">
          <a className={`flex flex-col items-center py-2 px-3 ${
            currentView === 'equipment' 
              ? 'text-primary dark:text-primary-light' 
              : 'text-gray-500 dark:text-gray-400'
          }`}>
            <i className="bi bi-tools text-xl"></i>
            <span className="text-xs mt-1">Equipment</span>
          </a>
        </Link>
        
        <button 
          onClick={toggleSidebar}
          className="flex flex-col items-center py-2 px-3 text-gray-500 dark:text-gray-400"
        >
          <i className="bi bi-three-dots text-xl"></i>
          <span className="text-xs mt-1">More</span>
        </button>
      </div>
    </nav>
  );
}
