import { Link } from "wouter";

interface SidebarProps {
  currentView: string;
  isOpen: boolean;
  closeSidebar: () => void;
}

interface NavItem {
  id: string;
  label: string;
  icon: string;
  path: string;
}

export default function Sidebar({ currentView, isOpen, closeSidebar }: SidebarProps) {
  const navItems: NavItem[] = [
    { id: 'dashboard', label: 'Dashboard', icon: 'bi-speedometer2', path: '/' },
    { id: 'tasks', label: 'Tasks', icon: 'bi-calendar-check', path: '/tasks' },
    { id: 'inventory', label: 'Inventory', icon: 'bi-box', path: '/inventory' },
    { id: 'equipment', label: 'Equipment', icon: 'bi-tools', path: '/equipment' },
    { id: 'reports', label: 'Reports', icon: 'bi-bar-chart', path: '/reports' },
    { id: 'weather', label: 'Weather', icon: 'bi-cloud-sun', path: '/weather' },
    { id: 'contacts', label: 'Contacts', icon: 'bi-person-lines-fill', path: '/contacts' },
    { id: 'settings', label: 'Settings', icon: 'bi-gear', path: '/settings' }
  ];

  return (
    <>
      {/* Backdrop for mobile */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-10 md:hidden" 
          onClick={closeSidebar}
        ></div>
      )}
    
      {/* Sidebar */}
      <aside 
        className={`
          fixed inset-y-0 left-0 z-20 w-64 bg-white shadow-lg transform transition-transform duration-300 ease-in-out 
          md:translate-x-0 md:static md:h-auto pt-16 md:pt-0 dark:bg-gray-800 dark:text-gray-200
          ${isOpen ? 'translate-x-0' : '-translate-x-full'}
        `}
      >
        <nav className="mt-5 px-2 space-y-1">
          {navItems.map((item) => (
            <Link 
              key={item.id}
              href={item.path}
              onClick={closeSidebar}
            >
              <a 
                className={`
                  flex items-center px-4 py-3 text-sm font-medium rounded-md w-full
                  ${currentView === item.id 
                    ? 'bg-primary text-white'
                    : 'text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700'}
                `}
              >
                <i className={`${item.icon} text-xl mr-3`}></i>
                {item.label}
              </a>
            </Link>
          ))}
        </nav>
        
        <div className="mt-8 px-4">
          <div className="bg-primary bg-opacity-10 p-3 rounded-lg dark:bg-primary-dark dark:bg-opacity-20">
            <h4 className="text-sm font-semibold text-primary mb-2 dark:text-primary-light">Need Help?</h4>
            <p className="text-xs text-gray-600 mb-2 dark:text-gray-400">Visit our knowledge base or contact support.</p>
            <button className="text-xs text-white bg-primary px-3 py-1 rounded dark:bg-primary-light">Support Center</button>
          </div>
        </div>
      </aside>
    </>
  );
}
