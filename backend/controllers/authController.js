const bcrypt = require('bcryptjs');
const nodemailer = require('nodemailer');
const jwt = require('jsonwebtoken');
const client = require('../config/db');
const logger = require('../config/logger');
const { logUserAction } = require('../models/userModel');

// Check if user already existed
const checkExistingUser = async (user_name, phone_number, email) => {
    const query = `
        SELECT * FROM users
        WHERE user_name = $1 OR phone_number = $2 OR email = $3
    `;
    const result = await client.query(query, [user_name, phone_number, email]);
    return result.rows;
};

// Register function
const registerUser = async (req, res) => {
    const { user_name, name, password, user_type, birthday, phone_number, email } = req.body;

    const existing = await checkExistingUser(user_name, phone_number, email);
    if (existing.length > 0) {
        const conflicts = [];
        existing.forEach(user => {
            if (user.user_name === user_name) conflicts.push('Tên đăng nhập');
            if (user.phone_number === phone_number) conflicts.push('Số điện thoại');
            if (user.email === email) conflicts.push('Email');
        });
        return res.status(400).json({ message: `${conflicts.join(', ')} đã được sử dụng.` });
    }

    console.log('Register endpoint hit')
    if (![0, 1].includes(user_type)) {
        console.log('Invalid user_type');
        return res.status(400).json({ message: 'Only "Vận Động Viên" or "Trọng Tài" can register.' });
    }

    try {
        console.log('Start hashing password');
        const hashedPassword = await bcrypt.hash(password, 10);
        console.log('Password hashed');
        const created_date = new Date().toISOString();
        const modified_date = created_date;

        console.log('Start DB insert');
        const query = `
            INSERT INTO users (user_name, password, user_type, birthday, name, phone_number, created_date, modified_date, enable, email)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
            RETURNING id, user_name, user_type, created_date
        `;
        console.log('Parameters being passed:');
        console.log('1 user_name      =', user_name);
        console.log('2 hashedPassword =', hashedPassword);
        console.log('3 user_type      =', user_type);
        console.log('4 birthday       =', birthday);
        console.log('5 name           =', name);
        console.log('6 phone_number   =', phone_number);
        console.log('7 created_date   =', created_date);
        console.log('8 modified_date  =', modified_date);
        console.log('9 enable        =', true); // dùng boolean thật
        console.log('10 email          =', email);
        const result = await client.query(query, [user_name, hashedPassword, user_type, birthday, name, phone_number, created_date, modified_date, true, email]);
        console.log('Insert successful');
        // Temporarily add return while not yet send email
        return res.status(200).json({ message: 'Đăng ký thành công.' });

        // const user = result.rows[0];
        
        // logger.info(`Registered user: ${user_name}, now send email`);

        // // Send confirmation email
        // const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET, { expiresIn: '1h' });
        // const confirmLink = `http://${process.env.TOKEN_URL}/confirm/${token}`;

        // const mailOptions = {
        //     from: process.env.EMAIL_USER,
        //     to: email,
        //     subject: 'Please confirm your registration',
        //     html: `<p>Click the link to confirm your registration: <a href="${confirmLink}">${confirmLink}</a></p>`
        // };

        // const transporter = nodemailer.createTransport({
        //     service: 'gmail',
        //     auth: {
        //         user: process.env.EMAIL_USER,
        //         pass: process.env.EMAIL_PASS
        //     }
        // });

        // const transporter = nodemailer.createTransport({
        //     host: process.env.SMTP_HOST,
        //     port: process.env.SMTP_PORT,
        //     secure: false, // dùng STARTTLS, không phải SSL
        //     auth: {
        //         user: process.env.EMAIL_USER,
        //         pass: process.env.EMAIL_PASS
        //     }
        // });

        // transporter.sendMail(mailOptions, (error, info) => {
        //     if (error) {
        //         console.error('Error sending email:', error);
        //         return res.status(500).json({ message: 'Failed to send email' });
        //     }
        //     console.log('Email sent: ' + info.response);
        //     res.status(200).json({ message: 'Registration successful. Check your email for confirmation.' });
        // });
    } catch (error) {
        console.error('Frontend registration error:', error.response || error.message);
        if (error.response && error.response.data && error.response.data.message) {
            setMessage(error.response.data.message);
        } else {
            setMessage('Đăng ký thất bại.');
        }
    }
};



// Confirm registration function
const confirmRegistration = async (req, res) => {
    const { token } = req.params;

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const userId = decoded.id;

        const query = 'UPDATE users SET enable = true WHERE id = $1 RETURNING id, user_name, enable';
        const result = await client.query(query, [userId]);

        if (result.rowCount === 0) {
            return res.status(400).json({ message: 'User not found or already confirmed.' });
        }

        res.status(200).json({ message: 'Account successfully confirmed!' });
    } catch (error) {
        console.error(error);
        res.status(400).json({ message: 'Invalid or expired confirmation link.' });
    }
};

const loginUser = async (req, res) => {
    const { user_name, password } = req.body;

    try {
        const query = 'SELECT * FROM users WHERE user_name = $1';
        const result = await client.query(query, [user_name]);

        if (result.rows.length === 0) {
            return res.status(401).json({ message: 'Tên đăng nhập không tồn tại.' });
        }

        const user = result.rows[0];

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(401).json({ message: 'Sai mật khẩu.' });
        }

        // Kiểm tra nếu tài khoản chưa kích hoạt (nếu bạn dùng enable = false)
        if (user.enable === false) {
            return res.status(403).json({ message: 'Tài khoản chưa được xác nhận qua email.' });
        }

        const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET, { expiresIn: '2h' });

        res.json({
            message: 'Đăng nhập thành công.',
            token,
            user: {
                id: user.id,
                name: user.name,
                user_type: user.user_type,
                phone_number: user.phone_number,     // ✅ thêm dòng này
                email: user.email                    // (tùy chọn nếu bạn cần dùng sau này)
            }
        });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ message: 'Lỗi server khi đăng nhập.' });
    }
};

module.exports = {
    registerUser,
    confirmRegistration,
    loginUser
};
