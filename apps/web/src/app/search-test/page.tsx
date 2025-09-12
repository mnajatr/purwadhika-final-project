"use client";

import React from 'react';

export default function SearchTestPage() {
  const [searchResult, setSearchResult] = React.useState<string>('');
  
  const testSearch = async () => {
    try {
      console.log('🧪 Testing search functionality...');
      
      // Fetch all orders first
      const response = await fetch('http://localhost:8000/api/orders', {
        headers: {
          'x-dev-user-id': '4',
          'Content-Type': 'application/json'
        }
      });
      
      const data = await response.json();
      const orders = data.data?.items || [];
      
      console.log('📊 Total orders:', orders.length);
      console.log('📝 Sample orders:', orders.slice(0, 3).map(o => ({ id: o.id, invoiceId: o.invoiceId })));
      
      // Test different search scenarios
      const testCases = [
        { query: '3', description: 'Search for order ID 3' },
        { query: '10', description: 'Search for order ID 10' },
        { query: '11', description: 'Search for order ID 11' },
        { query: 'chicken', description: 'Search for products with "chicken"' },
        { query: 'potato', description: 'Search for products with "potato"' },
      ];
      
      let results = '';
      
      for (const testCase of testCases) {
        const searchTerm = testCase.query.toLowerCase();
        const filtered = orders.filter((order: any) => {
          // Search in numeric order ID (convert to string for partial matching)
          const orderIdString = order.id.toString();
          if (orderIdString.includes(searchTerm)) return true;
          
          // Search in invoiceId if it exists
          if (order.invoiceId?.toLowerCase().includes(searchTerm)) return true;
          
          // Search in product names
          const hasMatchingProduct = order.items?.some((item: any) => 
            item.product?.name?.toLowerCase().includes(searchTerm)
          );
          
          return hasMatchingProduct;
        });
        
        results += `\n🔍 ${testCase.description}:\n`;
        results += `   Query: "${testCase.query}"\n`;
        results += `   Results: ${filtered.length} orders\n`;
        
        if (filtered.length > 0) {
          results += `   Matched: ${filtered.map((o: any) => `#${o.id}`).join(', ')}\n`;
          if (filtered.length <= 3) {
            filtered.forEach((o: any) => {
              const productNames = o.items?.map((item: any) => item.product?.name).join(', ') || 'No products';
              results += `     Order #${o.id}: ${productNames}\n`;
            });
          }
        }
        results += '\n';
      }
      
      setSearchResult(results);
      
    } catch (error) {
      console.error('❌ Test failed:', error);
      setSearchResult(`❌ Test failed: ${error}`);
    }
  };
  
  return (
    <div className="container mx-auto p-8">
      <h1 className="text-2xl font-bold mb-4">Search Logic Test</h1>
      
      <button 
        onClick={testSearch}
        className="bg-green-500 text-white px-4 py-2 rounded mb-4 hover:bg-green-600"
      >
        Test Search Logic
      </button>
      
      <div className="mt-4 p-4 bg-gray-100 rounded">
        <h2 className="font-semibold mb-2">Test Results:</h2>
        <pre className="whitespace-pre-wrap text-sm font-mono">{searchResult}</pre>
      </div>
      
      <div className="mt-4 p-4 bg-blue-100 rounded">
        <h2 className="font-semibold mb-2">🧪 Test Scenarios:</h2>
        <ul className="list-disc ml-4">
          <li>Search "3" → Should find Order #3</li>
          <li>Search "10" → Should find Order #10</li>
          <li>Search "11" → Should find Order #11</li>
          <li>Search "chicken" → Should find orders with Chicken products</li>
          <li>Search "potato" → Should find orders with Potato products</li>
        </ul>
      </div>
    </div>
  );
}
