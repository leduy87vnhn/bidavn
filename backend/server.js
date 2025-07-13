const express = require('express');
const bodyParser = require('body-parser');
const dotenv = require('dotenv');
const authRoutes = require('./routes/authRoutes');
const tournamentRouter = require('./routes/tournamentRouter');
const cors = require('cors');
const playerRouter = require('./routes/playerRouter');
const registrationRouter = require('./routes/registrationRouter');
const mainPageRouter = require('./routes/mainPageRouter');
const userRouter = require('./routes/userRouter');


dotenv.config();

const app = express();
const port = 5000;

const whitelist = [
  'http://localhost:3000',
  'http://18.143.246.46:3000',
  'https://hbsf.com.vn',
  'https://www.hbsf.com.vn'
];
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
// Serve React frontend from backend
const path = require('path');
app.use(cors(corsOptions));
app.options('*', cors(corsOptions));
app.use(bodyParser.json({ limit: '10mb' }));
app.use(bodyParser.urlencoded({ limit: '10mb', extended: true }));
app.use('/api/auth', authRoutes);
app.use('/api/tournaments', tournamentRouter);
app.use('/uploads', express.static('uploads'));
app.use('/api/players', playerRouter);
app.use('/api/registration_form', registrationRouter);
app.use('/api/registrations', registrationRouter); // dùng cho màn hình admin xem danh sách đơn đăng ký
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app.use('/api/mainpage', mainPageRouter);
//app.use('/api/tournament-group', require('./routes/tournamentGroupRouter'));
app.use('/api/users', userRouter);

console.log("Server starting...");

app.listen(port, '0.0.0.0', () => {
  console.log(`Server running on http://0.0.0.0:${port}`);
});


app.use(express.static(path.join(__dirname, '../frontend/build'))); // đường dẫn build frontend

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/build/index.html'));
});
console.log("Server is now listening.");