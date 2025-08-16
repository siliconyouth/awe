import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { TeamDashboard } from "@/components/team/team-dashboard";
import { DashboardHeader } from "@/components/dashboard/dashboard-header";
import { currentUser } from "@clerk/nextjs/server";

export default async function TeamPage() {
  const { userId, orgId } = await auth();
  const user = await currentUser();

  if (!userId) {
    redirect("/sign-in");
  }

  return (
    <div className="min-h-screen bg-background">
      <DashboardHeader user={user} />
      
      <main className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold">Team Management</h1>
          <p className="text-muted-foreground mt-2">
            Manage your team members and organization settings
          </p>
        </div>

        <TeamDashboard orgId={orgId} />
      </main>
    </div>
  );
}