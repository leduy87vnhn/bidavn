const express = require('express');
const bodyParser = require('body-parser');
const dotenv = require('dotenv');
const authRoutes = require('./routes/authRoutes');
const cors = require('cors');

dotenv.config();

const app = express();
const port = 5000;

const whitelist = ['http://localhost:3000', 'http://18.143.246.46:3000'];
const corsOptions = {
  origin: function (origin, callback) {
    if (!origin || whitelist.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: false
};
app.use(cors(corsOptions));
app.options('*', cors());
app.use(bodyParser.json());
app.use('/api/auth', authRoutes);

console.log("Server starting...");

app.listen(port, '0.0.0.0', () => {
  console.log(`Server running on http://0.0.0.0:${port}`);
});

// Serve React frontend from backend
const path = require('path');

app.use(express.static(path.join(__dirname, '../frontend/build'))); // đường dẫn build frontend

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/build/index.html'));
});
console.log("Server is now listening.");