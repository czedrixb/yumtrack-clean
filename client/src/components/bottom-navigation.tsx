import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Home, Clock, BarChart3, Settings } from "lucide-react";
import { trackEvent } from "@/lib/analytics";

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
    // Track navigation events
    const pageName = path === "/" ? "home" : path.slice(1);
    trackEvent('navigation', 'engagement', pageName);
    
    if (path === "/" && onHomeClick) {
      // Custom home navigation handler
      onHomeClick();
    } else {
      setLocation(path);
    }
  };

  return (
    <nav className="mobile-bottom-nav safe-area-bottom">
      <div className="max-w-sm mx-auto px-4">
        <div className="flex items-center justify-around py-2 pb-4">
          {navItems.map(({ path, icon: Icon, label }) => {
            const isActive = location === path;
            return (
              <Button
                key={path}
                variant="ghost"
                size="sm"
                onClick={() => handleNavClick(path)}
                className={`mobile-button flex flex-col items-center space-y-1 py-3 px-4 h-auto rounded-2xl transition-all duration-200 transform active:scale-95 ${
                  isActive 
                    ? 'text-primary bg-primary/15 shadow-lg scale-110' 
                    : 'text-muted-foreground hover:text-foreground hover:bg-accent/30'
                }`}
              >
                <Icon className={`w-6 h-6 ${isActive ? 'animate-pulse' : ''}`} />
                <span className={`text-xs font-medium ${isActive ? 'font-semibold' : ''}`}>
                  {label}
                </span>
              </Button>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
