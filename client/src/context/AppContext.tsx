import { createContext, useState, useContext, useEffect, ReactNode } from "react";
import { useLocalStorage } from "@/hooks/useLocalStorage";

interface AppContextType {
  darkMode: boolean;
  toggleDarkMode: () => void;
  language: string;
  setLanguage: (lang: string) => void;
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
}

const AppContext = createContext<AppContextType>({
  darkMode: false,
  toggleDarkMode: () => {},
  language: "en",
  setLanguage: () => {},
  sidebarOpen: false,
  setSidebarOpen: () => {},
});

interface AppProviderProps {
  children: ReactNode;
}

export function AppProvider({ children }: AppProviderProps) {
  // Use localStorage to persist preferences
  const [darkMode, setDarkMode] = useLocalStorage("darkMode", false);
  const [language, setLanguage] = useLocalStorage("language", "en");
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Apply dark mode to document
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, [darkMode]);

  // Toggle dark mode
  const toggleDarkMode = () => {
    setDarkMode(!darkMode);
  };

  return (
    <AppContext.Provider
      value={{
        darkMode,
        toggleDarkMode,
        language,
        setLanguage,
        sidebarOpen,
        setSidebarOpen,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

// Custom hook for accessing the AppContext
export function useAppContext() {
  return useContext(AppContext);
}
