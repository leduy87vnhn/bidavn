const express = require('express');
const bodyParser = require('body-parser');
const dotenv = require('dotenv');
const authRoutes = require('./routes/authRoutes');
const cors = require('cors');

dotenv.config();

const app = express();
const port = 5000;

app.use('/api/auth', authRoutes);
app.use(cors({
    origin: '*', // Nếu muốn mở toàn bộ
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
  }));
app.use(bodyParser.json());

console.log("Server starting...");

app.listen(port, () => {
    console.log(`Server running on http://0.0.0.0:${port}`);
});
console.log("Server is now listening.");