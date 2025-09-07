// test-minimal-server.js
// Minimal test server to isolate startup issues

const express = require('express');
const app = express();

// Basic middleware
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Test route
app.get('/test', (req, res) => {
  res.json({ message: 'Minimal server is working!' });
});

// Admin login test route
app.post('/auth/admin-login', (req, res) => {
  console.log('🔍 Admin login route hit');
  console.log('🔍 Request body:', req.body);
  
  const { username, password } = req.body;
  
  // Test credentials
  const ADMIN_USERNAME = 'admin@example.com';
  const ADMIN_PASSWORD = 'ChangeMe123';
  
  if (username === ADMIN_USERNAME && password === ADMIN_PASSWORD) {
    res.json({
      success: true,
      message: 'Admin login successful',
      user: { id: 0, role: 'admin', kyc_status: 'verified' }
    });
  } else {
    res.status(401).json({ 
      success: false,
      message: 'Invalid admin credentials' 
    });
  }
});

// Health check
app.get('/health', (req, res) => {
  res.send('OK');
});

const PORT = 4001;
app.listen(PORT, () => {
  console.log(`🚀 Minimal test server listening on port ${PORT}`);
  console.log(`✅ Test endpoint: http://localhost:${PORT}/test`);
  console.log(`✅ Admin login: http://localhost:${PORT}/auth/admin-login`);
  console.log(`✅ Health check: http://localhost:${PORT}/health`);
});
