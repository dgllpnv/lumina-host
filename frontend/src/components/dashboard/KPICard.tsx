import { LucideIcon, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

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
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay }}
      className="bg-card rounded-2xl p-6 border border-border shadow-soft hover:shadow-elevated transition-shadow duration-300"
    >
      <div className="flex items-start justify-between">
        <div className="space-y-1 flex-1">
          <p className="text-sm font-medium text-muted-foreground">{title}</p>
          {loading ? (
            <div className="flex items-center gap-2 h-9">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <>
              <p className="text-2xl xl:text-3xl font-bold text-card-foreground tracking-tight truncate">{value}</p>
              {change && (
                <p
                  className={cn(
                    "text-xs xl:text-sm font-medium truncate",
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
        <div className={cn("p-2 xl:p-3 rounded-xl flex-shrink-0", iconColor)}>
          <Icon className="h-5 w-5 xl:h-6 xl:w-6" />
        </div>
      </div>
    </motion.div>
  );
}
