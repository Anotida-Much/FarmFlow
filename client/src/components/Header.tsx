import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useAppContext } from "@/context/AppContext";
import { Link } from "wouter";
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";

interface HeaderProps {
  toggleSidebar: () => void;
}

export default function Header({ toggleSidebar }: HeaderProps) {
  const { user, logout } = useAuth();
  const { darkMode, toggleDarkMode, language, setLanguage } = useAppContext();
  const [showLanguageMenu, setShowLanguageMenu] = useState(false);
  const [showNotificationsMenu, setShowNotificationsMenu] = useState(false);
  
  const languages = [
    { code: "en", name: "English" },
    { code: "sn", name: "Shona" },
    { code: "zu", name: "Zulu" }
  ];
  
  const notifications = [
    { id: 1, title: "Low tomato seed inventory", type: "warning", time: "10 minutes ago" },
    { id: 2, title: "Tractor maintenance due", type: "info", time: "2 hours ago" },
    { id: 3, title: "Weather alert: Rain expected", type: "info", time: "1 day ago" }
  ];
  
  // Get user initials for avatar fallback
  const getUserInitials = () => {
    if (!user || !user.name) return "U";
    return user.name.split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .substring(0, 2);
  };
  
  return (
    <header className="bg-primary shadow-md sticky top-0 z-30">
      <div className="container mx-auto px-4 py-3 flex items-center justify-between">
        <div className="flex items-center">
          <button onClick={toggleSidebar} className="mr-3 text-white md:hidden">
            <i className="bi bi-list text-2xl"></i>
          </button>
          <Link href="/">
            <a className="flex items-center">
              <i className="bi bi-tree text-2xl text-white mr-2"></i>
              <h1 className="text-xl font-bold text-white">FarmFlow</h1>
            </a>
          </Link>
        </div>
        
        <div className="flex items-center space-x-4">
          {/* Language Selector */}
          <DropdownMenu open={showLanguageMenu} onOpenChange={setShowLanguageMenu}>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="text-white">
                <i className="bi bi-globe text-xl mr-1"></i>
                <span className="hidden sm:inline uppercase">{language}</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-40">
              {languages.map((lang) => (
                <DropdownMenuItem 
                  key={lang.code}
                  onClick={() => setLanguage(lang.code)}
                  className="cursor-pointer"
                >
                  {lang.name}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
          
          {/* Notifications */}
          <DropdownMenu open={showNotificationsMenu} onOpenChange={setShowNotificationsMenu}>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="text-white relative">
                <i className="bi bi-bell text-xl"></i>
                <span className="absolute -top-1 -right-1 bg-secondary text-xs text-white rounded-full w-4 h-4 flex items-center justify-center">
                  {notifications.length}
                </span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-72">
              <DropdownMenuLabel>Notifications</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <div className="max-h-60 overflow-y-auto">
                {notifications.map((notification) => (
                  <DropdownMenuItem key={notification.id} className="cursor-pointer py-3">
                    <div className="flex items-start">
                      <div className={`mr-2 mt-1 ${
                        notification.type === 'warning' ? 'text-yellow-500' :
                        notification.type === 'info' ? 'text-blue-500' :
                        notification.type === 'danger' ? 'text-red-500' :
                        'text-green-500'
                      }`}>
                        <i className={`
                          ${notification.type === 'warning' ? 'bi-exclamation-triangle' :
                            notification.type === 'info' ? 'bi-info-circle' :
                            notification.type === 'danger' ? 'bi-x-circle' :
                            'bi-check-circle'} text-lg
                        `}></i>
                      </div>
                      <div>
                        <p className="text-sm font-medium">{notification.title}</p>
                        <p className="text-xs text-gray-500">{notification.time}</p>
                      </div>
                    </div>
                  </DropdownMenuItem>
                ))}
              </div>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="cursor-pointer text-center text-xs text-blue-600">
                View all notifications
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          
          {/* User Profile */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="flex items-center text-white">
                <Avatar className="w-8 h-8 mr-1">
                  <AvatarImage src={user?.profileImage} />
                  <AvatarFallback className="bg-primary-dark">{getUserInitials()}</AvatarFallback>
                </Avatar>
                <span className="hidden md:inline text-sm">{user?.name}</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuLabel className="border-b pb-2">{user?.farmName}</DropdownMenuLabel>
              <DropdownMenuGroup>
                <Link href="/settings">
                  <a>
                    <DropdownMenuItem className="cursor-pointer">
                      <i className="bi bi-person mr-2"></i> Profile
                    </DropdownMenuItem>
                  </a>
                </Link>
                <Link href="/settings">
                  <a>
                    <DropdownMenuItem className="cursor-pointer">
                      <i className="bi bi-gear mr-2"></i> Settings
                    </DropdownMenuItem>
                  </a>
                </Link>
                <DropdownMenuItem onClick={toggleDarkMode} className="cursor-pointer">
                  <i className={darkMode ? "bi-sun mr-2" : "bi-moon mr-2"}></i>
                  {darkMode ? "Light Mode" : "Dark Mode"}
                </DropdownMenuItem>
              </DropdownMenuGroup>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={logout} className="cursor-pointer text-red-600 hover:text-red-700">
                <i className="bi bi-box-arrow-right mr-2"></i> Sign out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}
