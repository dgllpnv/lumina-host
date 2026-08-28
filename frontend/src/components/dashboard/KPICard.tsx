import { LucideIcon, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface KPICardProps {
  title: string;
  value: string;
  change?: string;
  changeType?: "positive" | "negative" | "neutral";
  icon: LucideIcon;
  iconColor?: string;
  delay?: number;
  loading?: boolean;
}

export function KPICard({
  title,
  value,
  change,
  changeType = "neutral",
  icon: Icon,
  iconColor = "bg-primary/10 text-primary",
  delay = 0,
  loading = false,
}: KPICardProps) {
  return (
    <div
      style={{ animationDelay: `${delay}s` }}
      className="animate-in fade-in slide-in-from-bottom-2 duration-500 fill-mode-both bg-card rounded-2xl p-5 border border-border shadow-soft hover:shadow-elevated hover:-translate-y-0.5 transition-all duration-300"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="space-y-1.5 flex-1 min-w-0">
          <p className="text-sm font-medium text-muted-foreground">{title}</p>
          {loading ? (
            <div className="flex items-center gap-2 h-9">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <>
              <p className="text-2xl font-bold text-card-foreground tracking-tight truncate">{value}</p>
              {change && (
                <p
                  className={cn(
                    "text-xs font-medium truncate",
                    changeType === "positive" && "text-success",
                    changeType === "negative" && "text-destructive",
                    changeType === "neutral" && "text-muted-foreground"
                  )}
                >
                  {change}
                </p>
              )}
            </>
          )}
        </div>
        <div className={cn("p-2.5 rounded-xl flex-shrink-0", iconColor)}>
          <Icon className="h-5 w-5" />
        </div>
      </div>
    </div>
  );
}
