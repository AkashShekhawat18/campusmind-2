const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');
const path = require('path');

async function testKnowledgeBase() {
  console.log('====================================================');
  console.log('  TESTING PERSISTENT USER KNOWLEDGE BASE SYSTEM');
  console.log('====================================================\n');

  const testUserId = 'test_kb_user_2026';
  const chatAId = 'chat_A_' + Date.now();
  const chatBId = 'chat_B_' + Date.now();
  const chatCId = 'chat_C_' + Date.now();
  
  const tempDocPath = path.join(__dirname, 'test_neuroflow_doc.txt');

  const neuroflowContent = `--- NEUROFLOW AI ARCHITECTURE SPECIFICATION ---
Product Name: NeuroFlow AI
Overview: NeuroFlow AI is a real-time neural network visualization, monitoring, and telemetry platform developed by MALPHOR.
Key Features:
1. Dynamic Layer Inspection: Real-time weight and gradient flow tracking across deep neural networks.
2. Anomaly Detection: Automated alerts when loss function diverges or gradients explode.
3. Custom Sharding: Distributed model training synchronization across multi-GPU clusters.
4. Multimodal Telemetry: Integrated dashboard displaying memory throughput, latency, and tensor shape transformations.
`;

  fs.writeFileSync(tempDocPath, neuroflowContent);
  console.log('📁 Created sample document: test_neuroflow_doc.txt');

  // STAGE 1: Upload document in Chat A
  console.log(`\n[STEP 1] Uploading document in Chat A (${chatAId})...`);
  try {
    const form = new FormData();
    form.append('files', fs.createReadStream(tempDocPath), 'NeuroFlow_AI_Spec.txt');
    form.append('user_id', testUserId);
    form.append('chat_id', chatAId);

    const uploadRes = await axios.post('http://127.0.0.1:8000/api/ai/upload', form, {
      headers: form.getHeaders()
    });
    console.log('✅ Upload Success:', uploadRes.data.results[0]);
  } catch (e) {
    console.error('❌ Upload Error:', e.message);
    process.exit(1);
  }

  // STAGE 2: Chat A Query
  console.log(`\n[STEP 2] Asking "Explain NeuroFlow AI" in Chat A...`);
  try {
    const contextResA = await axios.post('http://127.0.0.1:8000/api/ai/context',
      new URLSearchParams({ message: 'Explain NeuroFlow AI', user_id: testUserId, chat_id: chatAId }).toString(),
      { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } }
    );
    console.log('✅ Chat A Context Retrieved:', contextResA.data.context ? 'PASSED (Length: ' + contextResA.data.context.length + ')' : 'FAILED');
  } catch (e) {
    console.error('❌ Chat A Context Error:', e.message);
  }

  // STAGE 3: Brand New Chat B (zero files attached to Chat B)
  console.log(`\n[STEP 3] Brand New Chat B (${chatBId}) - Asking "Explain NeuroFlow AI"...`);
  try {
    const contextResB = await axios.post('http://127.0.0.1:8000/api/ai/context',
      new URLSearchParams({ message: 'Explain NeuroFlow AI', user_id: testUserId, chat_id: chatBId }).toString(),
      { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } }
    );

    const contextTextB = contextResB.data.context || '';
    const hasNeuroflow = contextTextB.includes('NeuroFlow AI') && contextTextB.includes('Dynamic Layer Inspection');
    
    if (hasNeuroflow) {
      console.log('✅ Chat B Knowledge Base Retrieval PASSED: Persistent User Knowledge Base retrieved document context across chats!');
    } else {
      console.error('❌ Chat B Knowledge Base Retrieval FAILED! Context:', contextTextB);
    }
  } catch (e) {
    console.error('❌ Chat B Error:', e.message);
  }

  // STAGE 4: Stream response to Qwen in Chat B
  console.log(`\n[STEP 4] Streaming "Explain NeuroFlow AI" to Qwen in Chat B...`);
  try {
    const streamRes = await axios.post('http://127.0.0.1:5000/api/ai-router/stream',
      new URLSearchParams({
        message: 'Explain NeuroFlow AI.',
        user_id: testUserId,
        chat_id: chatBId,
        model_id: '58e928df-aa8d-4ba1-ab19-c35e9fe941df', // Qwen 3 (1.7B)
        history: '[]'
      }).toString(),
      { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } }
    );

    const output = streamRes.data;
    console.log('\n========== QWEN RESPONSE IN NEW CHAT B ==========');
    console.log(output.substring(0, 400));
    console.log('================================================\n');

    const containsKeywords = /NeuroFlow|visualization|telemetry|Layer Inspection/i.test(output);
    const mentionsPastChat = /previous chat|last conversation|uploaded earlier/i.test(output);

    if (containsKeywords && !mentionsPastChat) {
      console.log('🎉 PASSED: Qwen correctly answered using Persistent Knowledge Base with natural phrasing and zero meta-talk!');
    } else {
      console.error('❌ FAILED: Response invalid or contained past chat references.');
    }
  } catch (e) {
    console.error('❌ Chat B Stream Error:', e.message);
  }

  // Cleanup
  try { fs.unlinkSync(tempDocPath); } catch(e) {}
  console.log('\n====================================================');
  console.log('  PERSISTENT KNOWLEDGE BASE VERIFICATION COMPLETE');
  console.log('====================================================');
  process.exit(0);
}

testKnowledgeBase();
