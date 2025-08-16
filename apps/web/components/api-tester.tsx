'use client';

import { useState } from 'react';
import { useAuth } from '@clerk/nextjs';

export function ApiTester() {
  const { getToken, isSignedIn } = useAuth();
  const [response, setResponse] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Make authenticated request from client
  const makeAuthenticatedRequest = async (
    endpoint: string,
    method: string = 'GET',
    body?: any
  ) => {
    if (!isSignedIn) {
      setError('You must be signed in to make authenticated requests');
      return;
    }

    setLoading(true);
    setError(null);
    setResponse(null);

    try {
      // Get the session token
      const token = await getToken();
      
      if (!token) {
        throw new Error('No authentication token available');
      }

      // Make the request with Authorization header
      const res = await fetch(endpoint, {
        method,
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: body ? JSON.stringify(body) : undefined,
      });

      const data = await res.json();
      
      if (!res.ok) {
        throw new Error(data.error || `Request failed: ${res.status}`);
      }

      setResponse(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const testEndpoints = [
    {
      name: 'Get User Info',
      endpoint: '/api/user',
      method: 'GET',
    },
    {
      name: 'Protected Route',
      endpoint: '/api/protected',
      method: 'GET',
    },
    {
      name: 'Session Info',
      endpoint: '/api/session',
      method: 'GET',
    },
    {
      name: 'Test POST (Admin)',
      endpoint: '/api/protected',
      method: 'POST',
      body: { test: 'data' },
    },
  ];

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold mb-4">API Endpoint Tester</h2>
        <p className="text-sm text-gray-600 mb-4">
          Test authenticated backend requests using your Clerk session token
        </p>
        
        <div className="space-y-3">
          {testEndpoints.map((test) => (
            <div key={test.endpoint + test.method} className="flex items-center gap-4">
              <button
                onClick={() => makeAuthenticatedRequest(test.endpoint, test.method, test.body)}
                disabled={loading || !isSignedIn}
                className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:bg-gray-400 disabled:cursor-not-allowed"
              >
                {test.name}
              </button>
              <span className="text-sm text-gray-600">
                {test.method} {test.endpoint}
              </span>
            </div>
          ))}
        </div>

        {!isSignedIn && (
          <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded">
            <p className="text-sm text-yellow-800">
              You must be signed in to test API endpoints
            </p>
          </div>
        )}
      </div>

      {loading && (
        <div className="bg-blue-50 border border-blue-200 rounded p-4">
          <p className="text-blue-800">Loading...</p>
        </div>
      )}

      {error && (
        <div className="bg-red-50 border border-red-200 rounded p-4">
          <h3 className="font-semibold text-red-800 mb-1">Error</h3>
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      {response && (
        <div className="bg-green-50 border border-green-200 rounded p-4">
          <h3 className="font-semibold text-green-800 mb-2">Response</h3>
          <pre className="text-sm text-green-700 overflow-x-auto">
            {JSON.stringify(response, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
}