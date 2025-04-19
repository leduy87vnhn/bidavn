const express = require('express');
const bodyParser = require('body-parser');
const dotenv = require('dotenv');
const authRoutes = require('./routes/authRoutes');
const cors = require('cors');

dotenv.config();

const app = express();
const port = 5000;

app.use(bodyParser.json());
app.use('/api/auth', authRoutes);
app.use(cors({
    origin: '*',              // Cho phép mọi nguồn gọi vào
    methods: ['GET', 'POST'], // Cho phép các method
    allowedHeaders: ['Content-Type', 'Authorization']
  }));

console.log("Server starting...");

app.listen(port, () => {
    console.log(`Server running on http://0.0.0.0:${port}`);
});
console.log("Server is now listening.");