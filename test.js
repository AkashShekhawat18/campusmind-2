const axios = require('axios');

async function run() {
  try {
    const res = await axios.post('http://localhost:8000/api/ai/pyq/chat/stream', {
      message: "hi",
      chat_type: "PAPER_SPECIFIC",
      context_data: {},
      history: []
    }, {
      responseType: 'stream'
    });
    
    res.data.on('data', chunk => {
      console.log(chunk.toString());
    });
    res.data.on('end', () => {
      console.log('Done');
    });
  } catch (err) {
    if (err.response) {
      console.error(err.response.status, err.response.data);
    } else {
      console.error(err.message);
    }
  }
}
run();
