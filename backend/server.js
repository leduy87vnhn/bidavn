const express = require('express');
const bodyParser = require('body-parser');
const dotenv = require('dotenv');
const authRoutes = require('./routes/authRoutes');
const cors = require('cors');

dotenv.config();

const app = express();
const port = 5000;

app.use('/api/auth', authRoutes);
const whitelist = ['http://localhost:3000', 'http://18.141.197.31:3000'];
const corsOptions = {
  origin: function (origin, callback) {
    if (!origin || whitelist.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true
};
app.use(cors(corsOptions));
app.use(bodyParser.json());

console.log("Server starting...");

app.listen(port, () => {
    console.log(`Server running on http://0.0.0.0:${port}`);
});
console.log("Server is now listening.");