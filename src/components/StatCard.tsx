import { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface StatCardProps {
  label: string;
  value: string;
  delta?: string;
  trend?: "up" | "down" | "neutral";
  icon: LucideIcon;
  accent?: boolean;
}

export function StatCard({ label, value, delta, trend = "neutral", icon: Icon, accent = false }: StatCardProps) {
  return (
    <div
      className={cn(
        "group relative overflow-hidden rounded-2xl border p-5 transition-all hover:-translate-y-0.5 hover:shadow-elevated",
        accent
          ? "border-transparent bg-foreground text-background"
          : "border-border bg-card",
      )}
    >
      {accent && (
        <div className="absolute -right-10 -top-10 h-32 w-32 rounded-full bg-primary/20 blur-2xl" />
      )}
      <div className="relative flex items-start justify-between">
        <div>
          <p className={cn("text-xs font-medium uppercase tracking-wider", accent ? "text-background/60" : "text-muted-foreground")}>
            {label}
          </p>
          <p className="mt-3 font-display text-3xl font-bold tracking-tight">{value}</p>
          {delta && (
            <p
              className={cn(
                "mt-2 text-xs font-medium",
                trend === "up" && "text-success",
                trend === "down" && "text-destructive",
                trend === "neutral" && (accent ? "text-background/50" : "text-muted-foreground"),
              )}
            >
              {delta}
            </p>
          )}
        </div>
        <div
          className={cn(
            "flex h-10 w-10 items-center justify-center rounded-xl transition-colors",
            accent
              ? "bg-primary text-primary-foreground"
              : "bg-secondary text-foreground group-hover:bg-primary group-hover:text-primary-foreground",
          )}
        >
          <Icon className="h-5 w-5" />
        </div>
      </div>
    </div>
  );
}
