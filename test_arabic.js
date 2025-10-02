const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

// First, let's login to get a token
fetch('http://localhost:5000/api/auth/login', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    nationalId: '12345678901234',
    password: '901234'  // Last 6 digits
  })
})
.then(response => response.json())
.then(data => {
  console.log('Login response:', data);
  
  if (data.token) {
    // Now let's fetch warehouses
    return fetch('http://localhost:5000/api/warehouses', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${data.token}`,
        'Content-Type': 'application/json; charset=utf-8'
      }
    });
  } else {
    throw new Error('Login failed');
  }
})
.then(response => response.json())
.then(warehouses => {
  console.log('Warehouses:');
  warehouses.forEach(warehouse => {
    console.log(`${warehouse.id}: ${warehouse.name}`);
  });
})
.catch(error => {
  console.error('Error:', error);
});