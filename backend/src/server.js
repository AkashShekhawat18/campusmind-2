require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const path = require('path');

const authRoutes = require('./routes/authRoutes');
const chatRoutes = require('./routes/chatRoutes');
const voiceRoutes = require('./routes/voiceRoutes');
const teacherRoutes = require('./routes/teacherRoutes');
const studentRoutes = require('./routes/studentRoutes');
const pyqRoutes = require('./routes/pyqRoutes');

const app = express();

// Security Middleware
app.use(helmet({
  crossOriginResourcePolicy: false,
  frameguard: false,
  contentSecurityPolicy: false,
}));
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true,
}));

// Rate Limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 500, // limit each IP to 500 requests per windowMs (generous for dev)
  message: 'Too many requests from this IP, please try again later.'
});
app.use(limiter);

// Proxy for Python AI Microservice (must be before body parsers for streaming/multipart)
const { createProxyMiddleware } = require('http-proxy-middleware');
app.use('/api/ai', createProxyMiddleware({
  target: 'http://127.0.0.1:8000',
  changeOrigin: true,
  pathRewrite: function (path, req) {
    return req.originalUrl;
  },
  // Ensure SSE streams correctly
  onProxyRes: function (proxyRes, req, res) {
    proxyRes.headers['Cache-Control'] = 'no-cache';
  }
}));

// Parse JSON bodies
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Static file serving for uploads
app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));

// Routes
const adminRoutes = require('./routes/adminRoutes');
const adminERPRoutes = require('./routes/adminERPRoutes');
const modelRoutes = require('./routes/modelRoutes');
const aiRouterRoutes = require('./routes/aiRouterRoutes');
const marketplaceRoutes = require('./routes/marketplaceRoutes');
const assessmentRoutes = require('./routes/assessmentRoutes');

app.use('/api/auth', authRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/voice', voiceRoutes);
app.use('/api/teacher', teacherRoutes);
app.use('/api/student', studentRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/admin/erp', adminERPRoutes);
app.use('/api/pyq', pyqRoutes);
app.use('/api/models', modelRoutes);
app.use('/api/ai-router', aiRouterRoutes);
app.use('/api/admin/marketplace', marketplaceRoutes);
app.use('/api/assessment', assessmentRoutes);


// Health Check
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok', message: 'CampusGPT Backend is running.' });
});

// Global Error Handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Internal Server Error' });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
