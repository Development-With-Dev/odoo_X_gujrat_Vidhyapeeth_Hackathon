import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.GMAIL,
        pass: process.env.Password,
    },
});

/**
 * Send a password reset OTP email
 * @param {string} toEmail - recipient email
 * @param {string} otp     - 6-digit OTP code
 * @param {string} name    - user's display name
 */
export async function sendResetEmail(toEmail, otp, name) {
    const mailOptions = {
        from: `"FleetFlow Support" <${process.env.GMAIL}>`,
        to: toEmail,
        subject: '🔑 FleetFlow — Password Reset Code',
        html: `
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="utf-8">
            <style>
                body { margin:0; padding:0; background:#f4f4f8; font-family: 'Segoe UI', Arial, sans-serif; }
                .container { max-width:520px; margin:40px auto; background:#fff; border-radius:16px; overflow:hidden; box-shadow:0 8px 32px rgba(108,99,255,0.12); }
                .header { background:linear-gradient(135deg,#6c63ff 0%,#48c6ef 100%); padding:36px 32px 28px; text-align:center; }
                .header h1 { color:#fff; font-size:22px; margin:0 0 6px; }
                .header p  { color:rgba(255,255,255,0.85); font-size:13px; margin:0; }
                .body { padding:32px; }
                .greeting { font-size:16px; color:#1a1a2e; margin-bottom:14px; }
                .text { font-size:14px; color:#555; line-height:1.7; margin-bottom:20px; }
                .otp-box { text-align:center; margin:24px 0; }
                .otp-code { display:inline-block; font-size:36px; font-weight:800; letter-spacing:10px; color:#6c63ff; background:#f0eeff; padding:16px 32px; border-radius:12px; border:2px dashed #6c63ff; }
                .warn { font-size:12px; color:#999; text-align:center; margin-top:8px; }
                .footer { background:#fafafe; padding:20px 32px; text-align:center; border-top:1px solid #eee; }
                .footer p { font-size:11px; color:#aaa; margin:0; }
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h1>🔐 Password Reset</h1>
                    <p>FleetFlow — Fleet & Logistics Management</p>
                </div>
                <div class="body">
                    <p class="greeting">Hi <strong>${name || 'there'}</strong>,</p>
                    <p class="text">
                        We received a request to reset the password for your FleetFlow account.
                        Use the verification code below to proceed. This code is valid for <strong>10 minutes</strong>.
                    </p>
                    <div class="otp-box">
                        <div class="otp-code">${otp}</div>
                    </div>
                    <p class="warn">If you didn't request this, you can safely ignore this email.</p>
                </div>
                <div class="footer">
                    <p>© ${new Date().getFullYear()} FleetFlow. All rights reserved.</p>
                </div>
            </div>
        </body>
        </html>`,
    };

    return transporter.sendMail(mailOptions);
}
