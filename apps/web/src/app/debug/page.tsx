"use client";

import React from 'react';

export default function DebugPage() {
  const [testResult, setTestResult] = React.useState<string>('');
  
  const testAPIConnection = async () => {
    try {
      console.log('🧪 Testing API connection...');
      
      // Test 1: Basic health check
      console.log('1️⃣ Testing health endpoint...');
      const healthResponse = await fetch('http://localhost:8000/api/health');
      const healthData = await healthResponse.json();
      console.log('✅ Health check:', healthData);
      
      // Test 2: Order counts
      console.log('2️⃣ Testing order counts...');
      const countsResponse = await fetch('http://localhost:8000/api/orders/counts', {
        headers: {
          'x-dev-user-id': '4',
          'Content-Type': 'application/json'
        }
      });
      const countsData = await countsResponse.json();
      console.log('✅ Counts:', countsData);
      
      // Test 3: Order list
      console.log('3️⃣ Testing order list...');
      const ordersResponse = await fetch('http://localhost:8000/api/orders', {
        headers: {
          'x-dev-user-id': '4',
          'Content-Type': 'application/json'
        }
      });
      const ordersData = await ordersResponse.json();
      console.log('✅ Orders:', ordersData);
      
      setTestResult(`✅ All tests passed!
Health: ${JSON.stringify(healthData)}
Counts: ${JSON.stringify(countsData)}
Orders: ${ordersData.data?.items?.length || 0} orders found`);
      
    } catch (error) {
      console.error('❌ Test failed:', error);
      setTestResult(`❌ Test failed: ${error}`);
    }
  };
  
  return (
    <div className="container mx-auto p-8">
      <h1 className="text-2xl font-bold mb-4">API Debug Page</h1>
      
      <button 
        onClick={testAPIConnection}
        className="bg-blue-500 text-white px-4 py-2 rounded mb-4 hover:bg-blue-600"
      >
        Test API Connection
      </button>
      
      <div className="mt-4 p-4 bg-gray-100 rounded">
        <h2 className="font-semibold mb-2">Test Results:</h2>
        <pre className="whitespace-pre-wrap text-sm">{testResult}</pre>
      </div>
      
      <div className="mt-4 p-4 bg-yellow-100 rounded">
        <h2 className="font-semibold mb-2">Instructions:</h2>
        <p>1. Open browser dev tools (F12)</p>
        <p>2. Go to Console tab</p>
        <p>3. Click "Test API Connection" button</p>
        <p>4. Check console logs for detailed information</p>
      </div>
    </div>
  );
}
