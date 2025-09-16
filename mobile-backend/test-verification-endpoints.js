// backend/test-verification-endpoints.js
const fetch = require('node-fetch');

const API_BASE = 'http://localhost:3000/api';

async function testVerificationEndpoints() {
  console.log('🧪 === TESTING VERIFICATION ENDPOINTS ===\n');
  
  try {
    // 1. Probar endpoint de diagnóstico para usuario demo
    console.log('1️⃣ Testing debug-verification endpoint...');
    const debugResponse = await fetch(`${API_BASE}/auth/debug-verification`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        email: 'lucia@example.com'
      })
    });
    
    const debugData = await debugResponse.json();
    console.log('📊 Debug response status:', debugResponse.status);
    console.log('📦 Debug response data:', JSON.stringify(debugData, null, 2));
    
    if (debugResponse.ok) {
      console.log('✅ Debug endpoint working correctly');
      console.log(`📧 User: ${debugData.user.nombre}`);
      console.log(`🔍 Status: ${debugData.actualStatus}`);
      console.log(`✅ Should be verified: ${debugData.shouldBeVerified}`);
    } else {
      console.log('❌ Debug endpoint failed:', debugData.error);
    }
    
    console.log('\n' + '='.repeat(50) + '\n');
    
    // 2. Probar endpoint de corrección de usuarios demo
    console.log('2️⃣ Testing fix-demo-users endpoint...');
    const fixResponse = await fetch(`${API_BASE}/auth/fix-demo-users`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    const fixData = await fixResponse.json();
    console.log('📊 Fix response status:', fixResponse.status);
    console.log('📦 Fix response data:', JSON.stringify(fixData, null, 2));
    
    if (fixResponse.ok) {
      console.log('✅ Fix endpoint working correctly');
      console.log('🔧 Results:');
      fixData.results.forEach(result => {
        console.log(`   - ${result.email}: ${result.status}`);
        if (result.status === 'fixed') {
          console.log(`     Before: ${result.before} -> After: ${result.after}`);
        }
      });
    } else {
      console.log('❌ Fix endpoint failed:', fixData.error);
    }
    
    console.log('\n' + '='.repeat(50) + '\n');
    
    // 3. Verificar el estado después de la corrección
    console.log('3️⃣ Verifying status after fix...');
    const verifyResponse = await fetch(`${API_BASE}/auth/debug-verification`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        email: 'lucia@example.com'
      })
    });
    
    const verifyData = await verifyResponse.json();
    console.log('📊 Verify response status:', verifyResponse.status);
    console.log('📦 Verify response data:', JSON.stringify(verifyData, null, 2));
    
    if (verifyResponse.ok) {
      console.log('✅ Verification check after fix:');
      console.log(`📧 User: ${verifyData.user.nombre}`);
      console.log(`🔍 Status: ${verifyData.actualStatus}`);
      console.log(`✅ Should be verified: ${verifyData.shouldBeVerified}`);
      
      if (verifyData.shouldBeVerified) {
        console.log('🎉 User is now properly verified!');
      } else {
        console.log('⚠️ User still not verified - check the logic');
      }
    } else {
      console.log('❌ Verification check failed:', verifyData.error);
    }
    
    // 4. Probar login con el usuario corregido
    console.log('\n' + '='.repeat(50) + '\n');
    console.log('4️⃣ Testing login with fixed user...');
    const loginResponse = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        email: 'lucia@example.com',
        password: 'password123'
      })
    });
    
    const loginData = await loginResponse.json();
    console.log('📊 Login response status:', loginResponse.status);
    console.log('📦 Login response data:', JSON.stringify(loginData, null, 2));
    
    if (loginResponse.ok && loginData.success) {
      console.log('🎉 Login successful! User should be redirected to home screen');
      console.log(`👤 User: ${loginData.user.nombre}`);
      console.log(`📧 Email verified: ${loginData.user.emailVerificado}`);
      console.log(`🔑 Requires verification: ${loginData.requiresVerification}`);
    } else {
      console.log('❌ Login failed or still requires verification');
      if (loginData.requiresVerification) {
        console.log('⚠️ User still requires email verification');
      }
    }
    
  } catch (error) {
    console.error('❌ Error testing endpoints:', error.message);
  }
}

// Ejecutar las pruebas
testVerificationEndpoints();
