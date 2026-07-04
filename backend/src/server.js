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
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.'
});
app.use(limiter);

// Intercept /api/ai/upload to handle Supabase and DB storage before Python processing
const { resourceUpload } = require('./services/resourceService');
const { uploadFileToSupabase } = require('./utils/supabaseStorage');
const prisma = require('./utils/prisma');
const fs = require('fs');
const FormData = require('form-data');
const axios = require('axios');
const crypto = require('crypto');

app.post('/api/ai/upload', resourceUpload.array('files'), async (req, res) => {
    try {
        const userId = req.body.user_id;
        if (!userId) return res.status(400).json({ error: 'user_id is required' });
        
        const results = [];
        for (const file of req.files) {
            const sanitizedName = file.originalname.replace(/[^a-zA-Z0-9.\-]/g, '_');
            const folder = file.mimetype.includes('pdf') ? 'pdf' : 
                          (file.mimetype.includes('image') ? 'images' : 'docs');
            const storagePath = `${userId}/${folder}/${crypto.randomUUID()}-${sanitizedName}`;
            
            const supabaseUrl = await uploadFileToSupabase(file.path, file.originalname, 'user-uploads', storagePath, file.mimetype);
            
            await prisma.uploadedFile.create({
              data: {
                ownerId: userId,
                ownerType: 'USER',
                bucket: 'user-uploads',
                storagePath: storagePath,
                filename: file.originalname,
                originalFilename: file.originalname,
                mimeType: file.mimetype,
                fileSize: file.size,
                category: 'USER_UPLOAD',
                visibility: 'PRIVATE',
                source: 'USER_UPLOAD',
                uploadedBy: userId
              }
            });
            
            const formData = new FormData();
            formData.append('files', fs.createReadStream(file.path), file.originalname);
            formData.append('user_id', userId);
            
            const aiRes = await axios.post(`http://127.0.0.1:8000/api/ai/upload`, formData, {
              headers: { ...formData.getHeaders() }
            });
            
            if (fs.existsSync(file.path)) fs.unlinkSync(file.path);
            
            if (aiRes.data && aiRes.data.results) {
                results.push(...aiRes.data.results);
            }
        }
        res.json({ status: 'success', results });
    } catch (error) {
        console.error('AI Upload error:', error);
        if (req.files) {
            for (const file of req.files) {
                if (fs.existsSync(file.path)) fs.unlinkSync(file.path);
            }
        }
        res.status(500).json({ error: 'Failed to upload to AI service' });
    }
});

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
app.use('/api/auth', authRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/voice', voiceRoutes);
app.use('/api/teacher', teacherRoutes);
app.use('/api/student', studentRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/admin/erp', adminERPRoutes);

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
const { ensureBucketsExist } = require('./utils/supabaseStorage');

app.listen(PORT, async () => {
  console.log(`Server running on port ${PORT}`);
  await ensureBucketsExist();
});
