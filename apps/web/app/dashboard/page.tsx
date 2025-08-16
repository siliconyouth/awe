import { auth, currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";

export default async function DashboardPage() {
  // Server-side authentication check
  const { userId } = await auth();
  
  if (!userId) {
    redirect("/sign-in");
  }
  
  // Get user details
  const user = await currentUser();
  
  return (
    <div className="min-h-screen p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-6">Dashboard</h1>
        
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Welcome back!</h2>
          <div className="space-y-2">
            <p><strong>Name:</strong> {user?.firstName} {user?.lastName}</p>
            <p><strong>Email:</strong> {user?.emailAddresses[0]?.emailAddress}</p>
            <p><strong>User ID:</strong> {user?.id}</p>
            <p><strong>Username:</strong> {user?.username || 'Not set'}</p>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">API Test Endpoints</h2>
          <div className="space-y-3">
            <TestButton 
              endpoint="/api/user" 
              label="Get User Info" 
              method="GET"
            />
            <TestButton 
              endpoint="/api/protected" 
              label="Protected Route" 
              method="GET"
            />
            <TestButton 
              endpoint="/api/session" 
              label="Get Session Info" 
              method="GET"
            />
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">Account Details</h2>
          <pre className="bg-gray-100 p-4 rounded overflow-x-auto text-sm">
            {JSON.stringify({
              id: user?.id,
              email: user?.emailAddresses[0]?.emailAddress,
              firstName: user?.firstName,
              lastName: user?.lastName,
              imageUrl: user?.imageUrl,
              createdAt: user?.createdAt,
              publicMetadata: user?.publicMetadata,
            }, null, 2)}
          </pre>
        </div>
      </div>
    </div>
  );
}

// Client component for testing API endpoints
function TestButton({ endpoint, label, method }: { 
  endpoint: string; 
  label: string; 
  method: string;
}) {
  return (
    <div className="flex items-center gap-4">
      <button
        className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        onClick={async () => {
          try {
            const response = await fetch(endpoint, { method });
            const data = await response.json();
            console.log(`${endpoint} response:`, data);
            alert(JSON.stringify(data, null, 2));
          } catch (error) {
            console.error(`Error calling ${endpoint}:`, error);
            alert(`Error: ${error.message}`);
          }
        }}
      >
        {label}
      </button>
      <span className="text-sm text-gray-600">{method} {endpoint}</span>
    </div>
  );
}