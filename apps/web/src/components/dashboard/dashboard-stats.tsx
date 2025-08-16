'use client'

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  ActivityIcon, 
  DatabaseIcon, 
  LayersIcon, 
  UsersIcon,
  TrendingUpIcon,
  TrendingDownIcon
} from "lucide-react";

export function DashboardStats() {
  // In a real app, these would be fetched from your API
  const stats = [
    {
      title: "Active Sources",
      value: "24",
      change: "+3",
      changeType: "increase",
      icon: DatabaseIcon,
      description: "Knowledge sources being monitored"
    },
    {
      title: "Patterns Extracted",
      value: "1,284",
      change: "+127",
      changeType: "increase",
      icon: LayersIcon,
      description: "This month"
    },
    {
      title: "Team Members",
      value: "8",
      change: "+2",
      changeType: "increase",
      icon: UsersIcon,
      description: "Active collaborators"
    },
    {
      title: "API Calls",
      value: "45.2K",
      change: "-5%",
      changeType: "decrease",
      icon: ActivityIcon,
      description: "Last 30 days"
    }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {stats.map((stat) => {
        const Icon = stat.icon;
        const TrendIcon = stat.changeType === 'increase' ? TrendingUpIcon : TrendingDownIcon;
        const trendColor = stat.changeType === 'increase' ? 'text-green-500' : 'text-red-500';

        return (
          <Card key={stat.title}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {stat.title}
              </CardTitle>
              <Icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
              <div className="flex items-center gap-2 mt-1">
                <div className={`flex items-center gap-1 text-xs ${trendColor}`}>
                  <TrendIcon className="h-3 w-3" />
                  {stat.change}
                </div>
                <p className="text-xs text-muted-foreground">
                  {stat.description}
                </p>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}