import { auth, currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { DashboardHeader } from "@/components/dashboard/dashboard-header";
import { DashboardStats } from "@/components/dashboard/dashboard-stats";
import { QuickActions } from "@/components/dashboard/quick-actions";
import { RecentActivity } from "@/components/dashboard/recent-activity";

export default async function DashboardPage() {
  const { userId } = await auth();
  const user = await currentUser();

  if (!userId) {
    redirect("/sign-in");
  }

  return (
    <div className="min-h-screen bg-background">
      <DashboardHeader user={user} />
      
      <main className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold">Welcome back, {user?.firstName || "User"}!</h1>
          <p className="text-muted-foreground mt-2">
            Here's what's happening with your AWE workspace
          </p>
        </div>

        <DashboardStats />
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-8">
          <div className="lg:col-span-2">
            <RecentActivity />
          </div>
          <div>
            <QuickActions />
          </div>
        </div>
      </main>
    </div>
  );
}