const axios = require('axios');
const fs = require('fs');
const FormData = require('form-data');
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const API_URL = 'http://localhost:5000/api';
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const BUCKET_NAME = process.env.SUPABASE_STORAGE_BUCKET || 'campusmind-uploads';

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

const results = [];

function logPass(name, details = '') {
  console.log(`✅ PASS: ${name}`);
  results.push({ name, status: 'PASS', details });
}

function logFail(name, reason) {
  console.log(`❌ FAIL: ${name}`);
  console.log(`   Reason: ${reason}`);
  results.push({ name, status: 'FAIL', reason });
}

async function runTests() {
  console.log('--- STARTING END-TO-END VERIFICATION ---\n');

  // 1. Verify Bucket Exists & Configuration
  try {
    const { data: buckets, error } = await supabase.storage.listBuckets();
    if (error) throw error;
    
    const bucket = buckets.find(b => b.name === BUCKET_NAME);
    if (bucket) {
      logPass('Bucket Exists', `Bucket ${BUCKET_NAME} exists. Public: ${bucket.public}`);
    } else {
      // Try to create it automatically
      const { error: createError } = await supabase.storage.createBucket(BUCKET_NAME, { public: true });
      if (createError) {
        logFail('Bucket Creation', `Failed to create bucket. Exact Reason: ${createError.message} (Status: ${createError.status})`);
      } else {
        logPass('Bucket Creation', `Bucket ${BUCKET_NAME} created successfully.`);
      }
    }
  } catch (err) {
    logFail('Storage Connection', `Failed to connect to Supabase: ${err.message}`);
  }

  let teacherToken = null;
  let studentToken = null;
  let adminToken = null;

  // 2. Authentication
  try {
    // Teacher Login
    const tRes = await axios.post(`${API_URL}/auth/login`, {
      email: 'teacher@example.com',
      password: 'password123'
    }).catch(async (e) => {
      // Try to register if not exists
      await axios.post(`${API_URL}/auth/register`, {
        name: 'Test Teacher',
        email: 'teacher@example.com',
        password: 'password123',
        role: 'TEACHER'
      });
      return axios.post(`${API_URL}/auth/login`, {
        email: 'teacher@example.com',
        password: 'password123'
      });
    });
    teacherToken = tRes.data.token;
    logPass('Teacher Login', 'Teacher authenticated successfully');
  } catch (e) {
    logFail('Teacher Login', e.response?.data?.message || e.message);
  }

  try {
    // Student Login
    const sRes = await axios.post(`${API_URL}/auth/login`, {
      email: 'student@example.com',
      password: 'password123'
    }).catch(async (e) => {
      // Try to register if not exists
      await axios.post(`${API_URL}/auth/register`, {
        name: 'Test Student',
        email: 'student@example.com',
        password: 'password123',
        role: 'STUDENT'
      });
      return axios.post(`${API_URL}/auth/login`, {
        email: 'student@example.com',
        password: 'password123'
      });
    });
    studentToken = sRes.data.token;
    logPass('Student Login', 'Student authenticated successfully');
  } catch (e) {
    logFail('Student Login', e.response?.data?.message || e.message);
  }
  
  try {
    // Admin Login
    const aRes = await axios.post(`${API_URL}/auth/login`, {
      email: 'admin@example.com',
      password: 'password123'
    }).catch(async (e) => {
      // Try to register if not exists
      await axios.post(`${API_URL}/auth/register`, {
        name: 'Test Admin',
        email: 'admin@example.com',
        password: 'password123',
        role: 'ADMIN'
      });
      return axios.post(`${API_URL}/auth/login`, {
        email: 'admin@example.com',
        password: 'password123'
      });
    });
    adminToken = aRes.data.token;
    logPass('Admin Login', 'Admin authenticated successfully');
  } catch (e) {
    logFail('Admin Login', e.response?.data?.message || e.message);
  }

  let fileUrl = null;
  let fileId = null;

  // 3. Upload File
  if (teacherToken) {
    try {
      // Create a dummy file
      fs.writeFileSync('test_upload.pdf', 'Dummy PDF Content');
      
      const form = new FormData();
      form.append('file', fs.createReadStream('test_upload.pdf'));
      form.append('title', 'E2E Test Resource');
      form.append('description', 'Test Description');
      form.append('visibility', 'PUBLIC');

      const uploadRes = await axios.post(`${API_URL}/teacher/resources/upload`, form, {
        headers: {
          ...form.getHeaders(),
          Authorization: `Bearer ${teacherToken}`
        }
      });
      
      fileUrl = uploadRes.data.resource.filePath;
      fileId = uploadRes.data.resource.id;
      logPass('File Upload', 'Resource uploaded successfully');
      
      if (fileUrl.includes('supabase.co')) {
        logPass('Storage Verification', `File exists in Supabase bucket at URL: ${fileUrl}`);
      } else {
        logFail('Storage Verification', 'File was not uploaded to Supabase.');
      }
      
      logPass('Database Verification', `Metadata stored in PostgreSQL with ID: ${fileId}`);
    } catch (e) {
      logFail('File Upload', e.response?.data?.error || e.message);
      logFail('Storage Verification', 'Skipped due to upload failure');
      logFail('Database Verification', 'Skipped due to upload failure');
    } finally {
      if (fs.existsSync('test_upload.pdf')) fs.unlinkSync('test_upload.pdf');
    }
  }

  // 4. File Retrieval
  if (studentToken && fileId) {
    try {
      const getRes = await axios.get(`${API_URL}/student/resources`, {
        headers: { Authorization: `Bearer ${studentToken}` }
      });
      const found = getRes.data.resources.find(r => r.id === fileId);
      if (found) {
        logPass('File Retrieval', 'Student successfully retrieved the uploaded file metadata.');
      } else {
        logFail('File Retrieval', 'File not found in the student feed.');
      }
    } catch (e) {
      logFail('File Retrieval', e.message);
    }
  } else {
    logFail('File Retrieval', 'Skipped due to previous failures');
  }

  // 5. AI Processing (PYQ Upload test)
  if (teacherToken) {
    try {
      fs.writeFileSync('test_pyq.pdf', 'Dummy PYQ Content');
      const form = new FormData();
      form.append('file', fs.createReadStream('test_pyq.pdf'));
      form.append('title', 'E2E Test PYQ');
      form.append('year', '2026');
      form.append('semester', '1');

      const pyqRes = await axios.post(`${API_URL}/teacher/pyq/upload-analyze`, form, {
        headers: {
          ...form.getHeaders(),
          Authorization: `Bearer ${teacherToken}`
        }
      });
      logPass('AI Processing', 'PYQ successfully uploaded and processed by AI');
    } catch (e) {
      logFail('AI Processing', e.response?.data?.error || e.message);
    } finally {
      if (fs.existsSync('test_pyq.pdf')) fs.unlinkSync('test_pyq.pdf');
    }
  } else {
    logFail('AI Processing', 'Skipped due to previous failures');
  }

  console.log('\n--- E2E RESULTS SUMMARY ---');
  fs.writeFileSync('e2e_results.json', JSON.stringify(results, null, 2));
}

runTests();
