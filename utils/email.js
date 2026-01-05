const nodemailer = require('nodemailer');
require('dotenv').config();

const transporter = nodemailer.createTransport({
    service: 'gmail', // or use 'host' and 'port' for other providers
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    }
});

/**
 * Send an email
 * @param {string} to - Recipient email
 * @param {string} subject - Email subject
 * @param {string} text - Email body text
 * @param {string} html - Optional HTML body
 */
const sendEmail = async (to, subject, text, html = null) => {
    try {
        if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
            console.warn('Email credentials missing in .env. Skipping email send.');
            return false;
        }

        const info = await transporter.sendMail({
            from: `"TrendStore" <${process.env.EMAIL_USER}>`,
            to,
            subject,
            text,
            html: html || text
        });

        console.log('Email sent: %s', info.messageId);
        return true;
    } catch (error) {
        console.error('Error sending email:', error);
        return false;
    }
};

module.exports = sendEmail;
