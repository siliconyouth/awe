'use client'

import { UserButton, useOrganization, OrganizationSwitcher } from "@clerk/nextjs";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import { 
  HomeIcon, 
  CogIcon, 
  UsersIcon, 
  ShieldCheckIcon,
  BookOpenIcon,
  BeakerIcon,
  BellIcon
} from "lucide-react";

interface DashboardHeaderProps {
  user: any;
}

export function DashboardHeader({ user }: DashboardHeaderProps) {
  const pathname = usePathname();
  const { organization } = useOrganization();

  const navigation = [
    { name: 'Dashboard', href: '/dashboard', icon: HomeIcon },
    { name: 'Knowledge', href: '/admin/knowledge', icon: BookOpenIcon },
    { name: 'Team', href: '/team', icon: UsersIcon },
    { name: 'Settings', href: '/settings', icon: CogIcon },
  ];

  const isAdmin = user?.publicMetadata?.role === 'admin';

  return (
    <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between">
          <div className="flex items-center gap-6">
            <Link href="/dashboard" className="flex items-center gap-2">
              <BeakerIcon className="h-6 w-6 text-primary" />
              <span className="text-xl font-bold">AWE</span>
            </Link>
            
            <nav className="hidden md:flex items-center gap-1">
              {navigation.map((item) => {
                const Icon = item.icon;
                const isActive = pathname === item.href;
                
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`
                      flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium
                      transition-colors hover:bg-accent hover:text-accent-foreground
                      ${isActive ? 'bg-accent text-accent-foreground' : 'text-muted-foreground'}
                    `}
                  >
                    <Icon className="h-4 w-4" />
                    {item.name}
                  </Link>
                );
              })}
              
              {isAdmin && (
                <Link
                  href="/admin"
                  className={`
                    flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium
                    transition-colors hover:bg-accent hover:text-accent-foreground
                    ${pathname.startsWith('/admin') ? 'bg-accent text-accent-foreground' : 'text-muted-foreground'}
                  `}
                >
                  <ShieldCheckIcon className="h-4 w-4" />
                  Admin
                </Link>
              )}
            </nav>
          </div>

          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon">
              <BellIcon className="h-5 w-5" />
            </Button>
            
            {organization && (
              <OrganizationSwitcher
                appearance={{
                  elements: {
                    rootBox: "flex",
                    organizationSwitcherTrigger: "px-3 py-2 border rounded-md",
                  }
                }}
              />
            )}
            
            <UserButton
              appearance={{
                elements: {
                  userButtonAvatarBox: "h-9 w-9",
                }
              }}
              afterSignOutUrl="/"
            />
          </div>
        </div>
      </div>
    </header>
  );
}