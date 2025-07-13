import { ReactNode } from "react";
import { ArrowLeft, MoreHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";

interface MobileHeaderProps {
  title: string;
  subtitle?: string;
  onBack?: () => void;
  rightAction?: ReactNode;
  className?: string;
}

export default function MobileHeader({ 
  title, 
  subtitle, 
  onBack, 
  rightAction,
  className = ""
}: MobileHeaderProps) {
  return (
    <header className={`mobile-header px-4 py-3 ${className}`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          {onBack && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onBack}
              className="mobile-button p-2 h-auto"
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
          )}
          <div>
            <h1 className="text-lg font-semibold text-foreground">{title}</h1>
            {subtitle && (
              <p className="text-sm text-muted-foreground">{subtitle}</p>
            )}
          </div>
        </div>
        
        {rightAction && (
          <div className="flex items-center space-x-2">
            {rightAction}
          </div>
        )}
      </div>
    </header>
  );
}