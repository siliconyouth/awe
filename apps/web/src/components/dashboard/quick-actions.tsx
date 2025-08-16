'use client'

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { 
  PlusIcon, 
  SearchIcon, 
  SettingsIcon, 
  UsersIcon,
  FileTextIcon,
  RocketIcon
} from "lucide-react";

export function QuickActions() {
  const actions = [
    {
      title: "Add Knowledge Source",
      description: "Monitor a new documentation site",
      icon: PlusIcon,
      href: "/admin/knowledge",
      color: "text-blue-500"
    },
    {
      title: "Review Patterns",
      description: "Approve pending extractions",
      icon: SearchIcon,
      href: "/admin/knowledge?tab=review",
      color: "text-green-500"
    },
    {
      title: "Invite Team Member",
      description: "Add collaborators to your workspace",
      icon: UsersIcon,
      href: "/team/invite",
      color: "text-purple-500"
    },
    {
      title: "View Documentation",
      description: "Learn about AWE features",
      icon: FileTextIcon,
      href: "/docs",
      color: "text-orange-500"
    },
    {
      title: "Configure Settings",
      description: "Customize your workspace",
      icon: SettingsIcon,
      href: "/settings",
      color: "text-gray-500"
    }
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <RocketIcon className="h-5 w-5" />
          Quick Actions
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {actions.map((action) => {
          const Icon = action.icon;
          
          return (
            <Link key={action.title} href={action.href}>
              <Button
                variant="ghost"
                className="w-full justify-start hover:bg-accent"
              >
                <Icon className={`h-4 w-4 mr-3 ${action.color}`} />
                <div className="text-left">
                  <div className="font-medium text-sm">{action.title}</div>
                  <div className="text-xs text-muted-foreground">
                    {action.description}
                  </div>
                </div>
              </Button>
            </Link>
          );
        })}
      </CardContent>
    </Card>
  );
}