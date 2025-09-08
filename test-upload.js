// Test script untuk upload payment proof
// Jalankan: node test-upload.js

const BASE_URL = 'http://localhost:8000';

async function testUpload() {
  try {
    console.log('🔍 Testing Cloudinary config...');
    const configRes = await fetch(`${BASE_URL}/api/_internal/cloudinary`);
    const config = await configRes.json();
    console.log('Config:', config);
    
    if (!config.cloud_name) {
      console.error('❌ Cloudinary not configured properly!');
      return;
    }
    
    console.log('\n📦 Creating test order...');
    const orderRes = await fetch(`${BASE_URL}/api/orders`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-dev-user-id': '2'
      },
      body: JSON.stringify({
        items: [{ productId: 1, qty: 1 }],
        idempotencyKey: 'test-order-' + Date.now(),
        storeId: 1  // Explicitly set store ID to bypass nearest store logic
      })
    });
    
    const orderData = await orderRes.json();
    console.log('Order status:', orderRes.status);
    console.log('Order response:', orderData);
    
    if (!orderRes.ok || !orderData.data?.id) {
      console.error('❌ Failed to create order');
      return;
    }
    
    const orderId = orderData.data.id;
    console.log('✅ Order created with ID:', orderId);
    
    console.log('\n🖼️ Uploading payment proof...');
    // 1x1 pixel PNG (tiny)
    const tinyPng = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR4nGNgYAAAAAMAASsJTYQAAAAASUVORK5CYII=';
    
    const uploadRes = await fetch(`${BASE_URL}/api/orders/${orderId}/payment-proof`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-dev-user-id': '2'
      },
      body: JSON.stringify({
        proofBase64: tinyPng
      })
    });
    
    const uploadData = await uploadRes.json();
    console.log('Upload status:', uploadRes.status);
    console.log('Upload response:', uploadData);
    
    if (uploadRes.ok) {
      console.log('✅ Upload successful! ProofURL:', uploadData.data?.proofUrl);
      
      // Verify order status changed
      console.log('\n🔍 Verifying order status...');
      const verifyRes = await fetch(`${BASE_URL}/api/orders/${orderId}`, {
        headers: { 'x-dev-user-id': '2' }
      });
      const verifyData = await verifyRes.json();
      console.log('Order status:', verifyData.data?.status);
      console.log('Payment proof URL:', verifyData.data?.payment?.proofImageUrl);
    } else {
      console.error('❌ Upload failed!');
    }
    
  } catch (error) {
    console.error('💥 Error:', error.message);
  }
}

testUpload();
