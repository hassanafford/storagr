const mysql = require('mysql2');
require('dotenv').config();

// Database connection
const db = mysql.createConnection({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'storage',
  charset: 'utf8mb4',
  collation: 'utf8mb4_unicode_ci'
});

// Connect to database
db.connect((err) => {
  if (err) {
    console.error('Database connection failed:', err);
    return;
  }
  console.log('Connected to MySQL database');
  
  // Check admin user
  db.query('SELECT * FROM users WHERE national_id = ?', ['12345678901234'], (err, results) => {
    if (err) {
      console.error('Error fetching user:', err);
      db.end();
      return;
    }
    
    if (results.length === 0) {
      console.log('Admin user not found');
    } else {
      console.log('Admin user found:', results[0]);
    }
    
    // Check all users
    db.query('SELECT * FROM users', (err, results) => {
      if (err) {
        console.error('Error fetching users:', err);
        db.end();
        return;
      }
      
      console.log('All users:');
      results.forEach(user => {
        console.log(`- ID: ${user.id}, National ID: ${user.national_id}, Name: ${user.name}, Role: ${user.role}, Warehouse ID: ${user.warehouse_id}`);
      });
      
      db.end();
    });
  });
});