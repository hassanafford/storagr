const io = require('socket.io-client');

// Test WebSocket connection
const socket = io('http://localhost:5001', {
  transports: ['websocket', 'polling'],
  reconnection: true,
  reconnectionAttempts: 5,
  reconnectionDelay: 1000,
  timeout: 10000
});

socket.on('connect', () => {
  console.log('Connected to WebSocket server');
  console.log('Socket ID:', socket.id);
  
  // Test sending a message
  socket.emit('setUser', {
    id: 1,
    name: 'Test User',
    role: 'admin'
  });
  
  // Disconnect after 5 seconds
  setTimeout(() => {
    socket.disconnect();
    console.log('Disconnected from WebSocket server');
  }, 5000);
});

socket.on('notification', (data) => {
  console.log('Received notification:', data);
});

socket.on('disconnect', (reason) => {
  console.log('Disconnected:', reason);
});

socket.on('connect_error', (error) => {
  console.error('Connection error:', error);
});

socket.on('error', (error) => {
  console.error('Socket error:', error);
});