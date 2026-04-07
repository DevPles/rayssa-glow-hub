import { useState, ReactNode } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ChevronDown, ChevronUp } from "lucide-react";

interface CollapsibleSectionProps {
  title: string;
  count?: number;
  defaultOpen?: boolean;
  action?: { label: string; onClick: () => void };
  children: ReactNode;
}

const CollapsibleSection = ({ title, count, defaultOpen = true, action, children }: CollapsibleSectionProps) => {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <Card className="bg-white/40 backdrop-blur-xl border-white/50 shadow-lg shadow-black/5">
      <div
        className="flex items-center justify-between px-5 py-3 cursor-pointer select-none"
        onClick={() => setOpen(!open)}
      >
        <div className="flex items-center gap-2">
          <h3 className="font-heading font-bold text-sm text-foreground">{title}</h3>
          {count !== undefined && (
            <span className="text-[10px] bg-secondary/20 text-secondary-foreground px-2 py-0.5 rounded-full font-heading font-semibold">
              {count}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          {action && (
            <Button
              variant="secondary"
              size="sm"
              className="h-7 text-xs font-heading rounded-full"
              onClick={(e) => { e.stopPropagation(); action.onClick(); }}
            >
              {action.label}
            </Button>
          )}
          {open ? (
            <ChevronUp className="w-4 h-4 text-muted-foreground" />
          ) : (
            <ChevronDown className="w-4 h-4 text-muted-foreground" />
          )}
        </div>
      </div>
      {open && (
        <CardContent className="px-5 pb-5 pt-0">
          {children}
        </CardContent>
      )}
    </Card>
  );
};

export default CollapsibleSection;
