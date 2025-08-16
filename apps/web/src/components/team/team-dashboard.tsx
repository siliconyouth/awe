'use client'

import { useState } from "react";
import { 
  OrganizationProfile, 
  OrganizationList,
  CreateOrganization,
  useOrganization,
  useOrganizationList,
  useUser
} from "@clerk/nextjs";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { 
  UsersIcon, 
  SettingsIcon, 
  ShieldIcon,
  PlusIcon,
  BuildingIcon,
  CrownIcon,
  UserIcon
} from "lucide-react";

interface TeamDashboardProps {
  orgId: string | null;
}

export function TeamDashboard({ orgId }: TeamDashboardProps) {
  const [showCreateOrg, setShowCreateOrg] = useState(false);
  const { organization, membership } = useOrganization();
  const { organizationList } = useOrganizationList();
  const { user } = useUser();

  if (!orgId || !organization) {
    return (
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>No Organization</CardTitle>
            <CardDescription>
              You're not part of any organization yet. Create or join one to collaborate with your team.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex gap-4">
              <Button onClick={() => setShowCreateOrg(true)}>
                <PlusIcon className="h-4 w-4 mr-2" />
                Create Organization
              </Button>
              <OrganizationList
                afterCreateOrganizationUrl="/team"
                afterSelectOrganizationUrl="/team"
              />
            </div>
          </CardContent>
        </Card>

        {showCreateOrg && (
          <Card>
            <CardHeader>
              <CardTitle>Create New Organization</CardTitle>
            </CardHeader>
            <CardContent>
              <CreateOrganization 
                afterCreateOrganizationUrl="/team"
                appearance={{
                  elements: {
                    card: "shadow-none p-0",
                    rootBox: "w-full"
                  }
                }}
              />
            </CardContent>
          </Card>
        )}
      </div>
    );
  }

  const isAdmin = membership?.role === "org:admin";
  const memberCount = organization.membersCount || 0;
  const pendingInvitations = organization.pendingInvitationsCount || 0;

  return (
    <div className="space-y-6">
      {/* Organization Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Organization</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                <BuildingIcon className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="font-semibold">{organization.name}</p>
                <p className="text-sm text-muted-foreground">
                  ID: {organization.id}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Members</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-blue-500/10 flex items-center justify-center">
                  <UsersIcon className="h-5 w-5 text-blue-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{memberCount}</p>
                  <p className="text-sm text-muted-foreground">Active</p>
                </div>
              </div>
              {pendingInvitations > 0 && (
                <Badge variant="secondary">
                  {pendingInvitations} pending
                </Badge>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Your Role</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-purple-500/10 flex items-center justify-center">
                {isAdmin ? (
                  <CrownIcon className="h-5 w-5 text-purple-500" />
                ) : (
                  <UserIcon className="h-5 w-5 text-purple-500" />
                )}
              </div>
              <div>
                <p className="font-semibold">
                  {isAdmin ? "Administrator" : "Member"}
                </p>
                <p className="text-sm text-muted-foreground">
                  {isAdmin ? "Full access" : "Limited access"}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Organization Management */}
      <Card>
        <CardHeader>
          <CardTitle>Organization Settings</CardTitle>
          <CardDescription>
            Manage your organization, members, and security settings
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="members" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="members">
                <UsersIcon className="h-4 w-4 mr-2" />
                Members
              </TabsTrigger>
              <TabsTrigger value="settings" disabled={!isAdmin}>
                <SettingsIcon className="h-4 w-4 mr-2" />
                Settings
              </TabsTrigger>
              <TabsTrigger value="security" disabled={!isAdmin}>
                <ShieldIcon className="h-4 w-4 mr-2" />
                Security
              </TabsTrigger>
            </TabsList>

            <TabsContent value="members" className="mt-6">
              <OrganizationProfile
                appearance={{
                  elements: {
                    card: "shadow-none border-0 p-0",
                    navbar: "hidden",
                    pageScrollBox: "p-0",
                    rootBox: "w-full"
                  },
                }}
              />
            </TabsContent>

            <TabsContent value="settings" className="mt-6">
              {isAdmin ? (
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">General Settings</h3>
                  <p className="text-muted-foreground">
                    Configure your organization's general settings and preferences.
                  </p>
                  <OrganizationProfile
                    appearance={{
                      elements: {
                        card: "shadow-none border-0 p-0",
                        navbar: "hidden",
                        pageScrollBox: "p-0",
                        rootBox: "w-full"
                      },
                    }}
                  />
                </div>
              ) : (
                <p className="text-muted-foreground">
                  You need administrator privileges to access these settings.
                </p>
              )}
            </TabsContent>

            <TabsContent value="security" className="mt-6">
              {isAdmin ? (
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Security Settings</h3>
                  <p className="text-muted-foreground">
                    Manage domain verification, SSO, and security policies.
                  </p>
                  <OrganizationProfile
                    appearance={{
                      elements: {
                        card: "shadow-none border-0 p-0",
                        navbar: "hidden",
                        pageScrollBox: "p-0",
                        rootBox: "w-full"
                      },
                    }}
                  />
                </div>
              ) : (
                <p className="text-muted-foreground">
                  You need administrator privileges to access these settings.
                </p>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}