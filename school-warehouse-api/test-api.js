const { exec } = require('child_process');

// Test API endpoints using curl
function testAPI() {
  console.log('Testing health check endpoint...');
  exec('curl -s http://localhost:5001', (error, stdout, stderr) => {
    if (error) {
      console.error('Health check error:', error);
      return;
    }
    console.log('Health check response:', stdout);
    
    console.log('\nTesting warehouses endpoint (should fail without auth)...');
    exec('curl -s http://localhost:5001/api/warehouses', (error, stdout, stderr) => {
      console.log('Warehouses response status code check');
      if (stderr) {
        console.log('Expected authentication error:', stderr);
      } else {
        console.log('Warehouses response:', stdout);
      }
      
      console.log('\nAPI tests completed');
    });
  });
}

testAPI();