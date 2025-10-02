// Test authentication flow
console.log('Testing authentication flow...');

// Check if user is logged in
const user = JSON.parse(localStorage.getItem('user') || '{}');
console.log('Current user:', user);

// Try to log in as admin
const adminNationalId = '12345678901234';
const adminPassword = '1234';

// Simulate login
fetch('http://localhost:5001/api/auth/login', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    nationalId: adminNationalId,
    password: adminPassword
  })
})
.then(response => {
  if (response.ok) {
    return response.json();
  } else {
    throw new Error(`HTTP error! status: ${response.status}`);
  }
})
.then(data => {
  console.log('Login successful:', data);
  
  // Save user data
  const userData = {
    ...data.user,
    token: data.token
  };
  localStorage.setItem('user', JSON.stringify(userData));
  console.log('User saved to localStorage:', userData);
  
  // Test accessing admin endpoint
  return fetch('http://localhost:5001/api/items', {
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${data.token}`
    }
  });
})
.then(response => {
  if (response.ok) {
    return response.json();
  } else {
    throw new Error(`HTTP error! status: ${response.status}`);
  }
})
.then(data => {
  console.log('Admin endpoint access successful:', data);
})
.catch(error => {
  console.error('Error:', error);
});