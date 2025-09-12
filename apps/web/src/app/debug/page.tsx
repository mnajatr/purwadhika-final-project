"use client";

import React from 'react';

export default function DebugPage() {
  const [testResult, setTestResult] = React.useState<string>('');
  const [callCount, setCallCount] = React.useState(0);
  
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
      
      setCallCount(prev => prev + 3);
      setTestResult(`✅ All tests passed! (API calls: ${callCount + 3})
Health: ${JSON.stringify(healthData)}
Counts: ${JSON.stringify(countsData)}
Orders: ${ordersData.data?.items?.length || 0} orders found`);
      
    } catch (error) {
      console.error('❌ Test failed:', error);
      setTestResult(`❌ Test failed: ${error}`);
    }
  };
  
  const resetCounter = () => {
    setCallCount(0);
    setTestResult('');
  };
  
  return (
    <div className="container mx-auto p-8">
      <h1 className="text-2xl font-bold mb-4">API Debug Page</h1>
      
      <div className="mb-4 flex gap-2">
        <button 
          onClick={testAPIConnection}
          className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
        >
          Test API Connection
        </button>
        
        <button 
          onClick={resetCounter}
          className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600"
        >
          Reset Counter
        </button>
      </div>
      
      <div className="mb-4 p-4 bg-green-100 rounded">
        <h2 className="font-semibold mb-2">📊 Performance Counter:</h2>
        <p className="text-lg">Total API calls made: <strong>{callCount}</strong></p>
      </div>
      
      <div className="mt-4 p-4 bg-gray-100 rounded">
        <h2 className="font-semibold mb-2">Test Results:</h2>
        <pre className="whitespace-pre-wrap text-sm">{testResult}</pre>
      </div>
      
      <div className="mt-4 p-4 bg-yellow-100 rounded">
        <h2 className="font-semibold mb-2">🚀 Performance Test:</h2>
        <p>1. Open /orders page in another tab</p>
        <p>2. Try different filters (status, search, date)</p>
        <p>3. Check API server logs - should only see 1 initial API call</p>
        <p>4. All subsequent filtering should be instant (no API calls)</p>
      </div>
      
      <div className="mt-4 p-4 bg-blue-100 rounded">
        <h2 className="font-semibold mb-2">✨ Optimization Benefits:</h2>
        <ul className="list-disc ml-4">
          <li>🚀 <strong>Faster filtering</strong> - no network delay</li>
          <li>💾 <strong>Reduced server load</strong> - 1 API call vs many</li>
          <li>🔋 <strong>Better UX</strong> - instant response to user actions</li>
          <li>📱 <strong>Mobile friendly</strong> - less data usage</li>
        </ul>
      </div>
    </div>
  );
}
