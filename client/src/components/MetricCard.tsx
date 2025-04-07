import { Card, CardContent } from "@/components/ui/card";

interface MetricCardProps {
  title: string;
  value: number;
  icon: string;
  iconColor: string;
  trend?: number;
  trendUp?: boolean;
  progressColor: string;
}

export default function MetricCard({
  title,
  value,
  icon,
  iconColor,
  trend,
  trendUp = true,
  progressColor
}: MetricCardProps) {
  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-sm font-semibold text-gray-600 dark:text-gray-300">{title}</h3>
          <i className={`bi ${icon} text-xl ${iconColor}`}></i>
        </div>
        <div className="flex items-end">
          <p className="text-2xl font-bold dark:text-white">{value}%</p>
          {trend !== undefined && (
            <span className={`text-xs ${trendUp ? 'text-success' : 'text-red-500'} ml-2 flex items-center`}>
              <i className={`bi ${trendUp ? 'bi-arrow-up-short' : 'bi-arrow-down-short'}`}></i> {trend}%
            </span>
          )}
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2 mt-2 dark:bg-gray-700">
          <div className={`${progressColor} h-2 rounded-full`} style={{ width: `${value}%` }}></div>
        </div>
      </CardContent>
    </Card>
  );
}
