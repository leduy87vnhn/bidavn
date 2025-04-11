const bcrypt = require('bcryptjs');
const nodemailer = require('nodemailer');
const jwt = require('jsonwebtoken');
const client = require('../config/db');
const logger = require('../config/logger');
const { logUserAction } = require('../models/userModel');


//await logUserAction(user.id, user.user_name, 'REGISTERED');
//...
//await logUserAction(userId, result.rows[0].user_name, 'ACCOUNT_CONFIRMED');
//logger.info(`Registering user: ${user_name}`);
//...
//logger.error(`Error sending email: ${error.message}`);
//...
//logger.info(`User confirmed: ${userId}`);
// Register function
const registerUser = async (req, res) => {
    const { user_name, name, password, user_type, birthday, phone_number, email } = req.body;

    if (![0, 1].includes(user_type)) {
        return res.status(400).json({ message: 'Only "Vận Động Viên" or "Trọng Tài" can register.' });
    }

    try {
        const hashedPassword = await bcrypt.hash(password, 10);
        const created_date = new Date().toISOString();
        const modified_date = created_date;

        const query = `
            INSERT INTO users (user_name, name, password, user_type, birthday, phone_number, email, created_date, modified_date, enable)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
            RETURNING id, user_name, user_type, created_date
        `;
        const result = await client.query(query, [user_name, name, hashedPassword, user_type, birthday, phone_number, email, created_date, modified_date, 0]);

        const user = result.rows[0];

        logger.info(`Registered user: ${user_name}, now send email`);

        // Send confirmation email
        const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET, { expiresIn: '1h' });
        const confirmLink = `http://${process.env.TOKEN_URL}/confirm/${token}`;

        const mailOptions = {
            from: process.env.EMAIL_USER,
            to: email,
            subject: 'Please confirm your registration',
            html: `<p>Click the link to confirm your registration: <a href="${confirmLink}">${confirmLink}</a></p>`
        };

        const transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASS
            }
        });

        transporter.sendMail(mailOptions, (error, info) => {
            if (error) {
                console.error('Error sending email:', error);
                return res.status(500).json({ message: 'Failed to send email' });
            }
            console.log('Email sent: ' + info.response);
            res.status(200).json({ message: 'Registration successful. Check your email for confirmation.' });
        });
    } catch (error) {
        console.error(error);
        logger.error(`Unknown error: ${error.message}`);
        res.status(500).json({ message: 'Error registering user.' });
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

module.exports = {
    registerUser,
    confirmRegistration
};
