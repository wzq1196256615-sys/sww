const express = require('express');
const app = express();
app.use(express.json({limit:'10mb'}));

// CORS
app.use((req,res,next)=>{
  res.setHeader('Access-Control-Allow-Origin','*');
  res.setHeader('Access-Control-Allow-Methods','GET,POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers','*');
  if(req.method==='OPTIONS') return res.status(200).end();
  next();
});

// 心跳接口
app.get('/ping', (req,res)=>res.send('pong'));

// 生图代理
app.post('/api/ai/generate-image', async (req,res)=>{
  try{
    const response = await fetch('https://api.idlecloud.cc/api/ai/generate-image',{
      method:'POST',
      headers:{
        'Content-Type':'application/json',
        'Authorization': req.headers['authorization'] || `Bearer ${process.env.NAI_TOKEN}`
      },
      body: JSON.stringify(req.body),
      signal: AbortSignal.timeout(180000)
    });
    const data = await response.arrayBuffer();
    const ct = response.headers.get('content-type') || 'application/zip';
    res.setHeader('Content-Type', ct);
    res.status(response.status).send(Buffer.from(data));
  }catch(err){
    res.status(500).json({error: err.message});
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, ()=>{
  console.log('running on port', PORT);
  // 每14分钟ping自己，防止休眠
  const SELF_URL = process.env.RENDER_EXTERNAL_URL;
  if(SELF_URL){
    setInterval(async ()=>{
      try{
        await fetch(`${SELF_URL}/ping`);
        console.log('self-ping ok');
      }catch(e){
        console.log('self-ping fail:', e.message);
      }
    }, 14 * 60 * 1000);
  }
});
