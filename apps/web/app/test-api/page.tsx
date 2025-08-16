import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { ApiTester } from "@/components/api-tester";

export default async function TestApiPage() {
  // Ensure user is authenticated
  const { userId } = await auth();
  
  if (!userId) {
    redirect("/sign-in");
  }
  
  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-2">Backend API Testing</h1>
        <p className="text-gray-600 mb-8">
          Test authenticated backend requests using Clerk session tokens
        </p>
        
        <ApiTester />
        
        <div className="mt-8 bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">How It Works</h2>
          <ul className="space-y-2 text-sm text-gray-700">
            <li className="flex items-start">
              <span className="text-blue-500 mr-2">1.</span>
              <span>The client calls <code className="bg-gray-100 px-1 rounded">useAuth().getToken()</code> to get the session token</span>
            </li>
            <li className="flex items-start">
              <span className="text-blue-500 mr-2">2.</span>
              <span>The token is added to the <code className="bg-gray-100 px-1 rounded">Authorization</code> header as a Bearer token</span>
            </li>
            <li className="flex items-start">
              <span className="text-blue-500 mr-2">3.</span>
              <span>The API route uses <code className="bg-gray-100 px-1 rounded">auth()</code> to verify the token and get user info</span>
            </li>
            <li className="flex items-start">
              <span className="text-blue-500 mr-2">4.</span>
              <span>Protected routes can check roles and permissions before processing requests</span>
            </li>
          </ul>
        </div>
        
        <div className="mt-8 bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">Server Actions</h2>
          <p className="text-sm text-gray-700 mb-4">
            Server actions automatically have access to the authenticated user context.
            No need to manually pass tokens.
          </p>
          <pre className="bg-gray-100 p-4 rounded text-sm overflow-x-auto">
{`// In a Server Action
'use server';

import { auth } from "@clerk/nextjs/server";

export async function myServerAction() {
  const { userId } = await auth();
  
  if (!userId) {
    throw new Error("Unauthorized");
  }
  
  // Your action logic here
}`}
          </pre>
        </div>
      </div>
    </div>
  );
}