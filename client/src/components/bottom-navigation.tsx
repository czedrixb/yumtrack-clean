import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Home, Clock, BarChart3, Settings } from "lucide-react";

const navItems = [
  { path: "/", icon: Home, label: "Home" },
  { path: "/history", icon: Clock, label: "History" },
  { path: "/stats", icon: BarChart3, label: "Stats" },
  { path: "/settings", icon: Settings, label: "Settings" },
];

interface BottomNavigationProps {
  onHomeClick?: () => void;
}

export default function BottomNavigation({ onHomeClick }: BottomNavigationProps) {
  const [location, setLocation] = useLocation();

  const handleNavClick = (path: string) => {
    if (path === "/" && onHomeClick) {
      // Custom home navigation handler
      onHomeClick();
    } else {
      setLocation(path);
    }
  };

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-background border-t border-border z-30 safe-area-bottom">
      <div className="max-w-sm mx-auto px-4">
        <div className="flex items-center justify-around py-2">
          {navItems.map(({ path, icon: Icon, label }) => {
            const isActive = location === path;
            return (
              <Button
                key={path}
                variant="ghost"
                size="sm"
                onClick={() => handleNavClick(path)}
                className={`flex flex-col items-center space-y-1 py-2 px-4 h-auto ${
                  isActive 
                    ? 'text-primary' 
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                <Icon className="w-6 h-6" />
                <span className="text-xs font-medium">{label}</span>
              </Button>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
