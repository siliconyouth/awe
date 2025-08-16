'use client'

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  CheckCircleIcon, 
  XCircleIcon, 
  AlertCircleIcon,
  GitBranchIcon,
  UserPlusIcon,
  FileTextIcon
} from "lucide-react";

export function RecentActivity() {
  // In a real app, this would be fetched from your API
  const activities = [
    {
      id: 1,
      type: 'pattern_approved',
      title: 'Pattern Approved',
      description: 'React Hook pattern from Next.js docs',
      user: 'John Doe',
      timestamp: '2 hours ago',
      icon: CheckCircleIcon,
      iconColor: 'text-green-500'
    },
    {
      id: 2,
      type: 'source_added',
      title: 'New Source Added',
      description: 'Vercel Documentation - API Reference',
      user: 'Jane Smith',
      timestamp: '4 hours ago',
      icon: FileTextIcon,
      iconColor: 'text-blue-500'
    },
    {
      id: 3,
      type: 'member_joined',
      title: 'Team Member Joined',
      description: 'Alex Johnson joined the workspace',
      user: 'System',
      timestamp: '6 hours ago',
      icon: UserPlusIcon,
      iconColor: 'text-purple-500'
    },
    {
      id: 4,
      type: 'pattern_rejected',
      title: 'Pattern Rejected',
      description: 'Outdated configuration pattern',
      user: 'Mike Wilson',
      timestamp: '8 hours ago',
      icon: XCircleIcon,
      iconColor: 'text-red-500'
    },
    {
      id: 5,
      type: 'source_error',
      title: 'Source Check Failed',
      description: 'Unable to reach legacy-docs.example.com',
      user: 'System',
      timestamp: '12 hours ago',
      icon: AlertCircleIcon,
      iconColor: 'text-yellow-500'
    },
    {
      id: 6,
      type: 'branch_created',
      title: 'Branch Created',
      description: 'feature/ai-improvements',
      user: 'Sarah Lee',
      timestamp: '1 day ago',
      icon: GitBranchIcon,
      iconColor: 'text-indigo-500'
    }
  ];

  const getActivityBadge = (type: string) => {
    const badges: Record<string, { label: string; variant: any }> = {
      pattern_approved: { label: 'Approved', variant: 'default' },
      pattern_rejected: { label: 'Rejected', variant: 'destructive' },
      source_added: { label: 'New', variant: 'secondary' },
      source_error: { label: 'Error', variant: 'destructive' },
      member_joined: { label: 'Team', variant: 'outline' },
      branch_created: { label: 'Development', variant: 'outline' }
    };
    
    return badges[type] || { label: 'Activity', variant: 'outline' };
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Recent Activity</CardTitle>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[400px] pr-4">
          <div className="space-y-4">
            {activities.map((activity) => {
              const Icon = activity.icon;
              const badge = getActivityBadge(activity.type);
              
              return (
                <div
                  key={activity.id}
                  className="flex items-start gap-3 pb-4 border-b last:border-0"
                >
                  <div className={`mt-1 ${activity.iconColor}`}>
                    <Icon className="h-5 w-5" />
                  </div>
                  <div className="flex-1 space-y-1">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium">{activity.title}</p>
                      <Badge variant={badge.variant} className="text-xs">
                        {badge.label}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {activity.description}
                    </p>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <span>{activity.user}</span>
                      <span>•</span>
                      <span>{activity.timestamp}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}