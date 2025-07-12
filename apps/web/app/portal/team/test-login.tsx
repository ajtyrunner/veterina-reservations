'use client';
import { useState } from 'react';

export default function TestLogin() {
  const [result, setResult] = useState<any>(null);
  
  const testDirectAPI = async () => {
    try {
      const response = await fetch('http://lvh.me:4000/api/auth/credentials', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: 'nikol.admin',
          password: 'agility123',
          tenantSlug: 'agility-nikol'
        })
      });
      
      const data = await response.json();
      setResult({ success: response.ok, data });
    } catch (error) {
      setResult({ success: false, error: error.message });
    }
  };
  
  return (
    <div className="p-8">
      <h1 className="text-2xl mb-4">Test přímého API volání</h1>
      <button 
        onClick={testDirectAPI}
        className="bg-blue-500 text-white px-4 py-2 rounded"
      >
        Test API
      </button>
      {result && (
        <pre className="mt-4 p-4 bg-gray-100 rounded">
          {JSON.stringify(result, null, 2)}
        </pre>
      )}
    </div>
  );
}