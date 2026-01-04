import NumberFlow from "@number-flow/react";
import { LucideIcon } from "lucide-react";

type StatCardProps = {
  icon: LucideIcon;
  label: string;
  value: number;
  format?: {
    style?: "currency" | "decimal" | "percent";
    currency?: string;
    minimumFractionDigits?: number;
    maximumFractionDigits?: number;
    [key: string]: any;
  };
  className?: string;
  valueClassName?: string;
};

export function StatCard({
  icon: Icon,
  label,
  value,
  format,
  className = "",
  valueClassName = "",
}: StatCardProps) {
  return (
    <div className={`bg-primary/10 border-x border-b lg:border-l-0 lg:border-y lg:border-r ${className}`}>
      <div className="p-5">
        <div className="flex items-start justify-start gap-2 mb-2">
          <Icon className="h-5 w-5 text-muted-foreground" />
          <p className="text-sm text-muted-foreground mb-1">{label}</p>
        </div>
        <div
          className={`text-2xl font-semibold font-mono [font-variant-numeric:tabular-nums] ${valueClassName}`}
        >
          <NumberFlow
            value={value}
            locales="en-US"
            format={format}
          />
        </div>
      </div>
    </div>
  );
}

