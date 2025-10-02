// Test token retrieval
const user = JSON.parse(localStorage.getItem('user') || '{}');
console.log('User from localStorage:', user);
console.log('Token:', user.token);

// Test token decoding
if (user.token) {
  try {
    const decoded = JSON.parse(Buffer.from(user.token, 'base64').toString('utf-8'));
    console.log('Decoded token:', decoded);
  } catch (error) {
    console.error('Error decoding token:', error);
  }
}