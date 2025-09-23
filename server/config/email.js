const Brevo = require('@getbrevo/brevo');
const { TransactionalEmailsApiApiKeys } = require('@getbrevo/brevo');

const apiInstance = new Brevo.TransactionalEmailsApi();
apiInstance.setApiKey(TransactionalEmailsApiApiKeys.apiKey, process.env.BREVO_API_KEY);

const sendEmail = async (to, subject, htmlContent) => {
  try {
    const data = await apiInstance.sendTransacEmail({
      sender: { name: 'Account Verification', email: process.env.BREVO_SENDER_EMAIL },
      to: [{ email: to }],
      subject: subject,
      htmlContent: htmlContent
    });
    console.log('Email sent successfully');
    return { success: true, data };
  } catch (error) {
    console.error('Error sending email:', error.message || error);
    return { success: false, error: error.message || 'Failed to send email' };
  }
};

const sendOtpEmail = async (email, otp) => {
  const subject = 'Your OTP for Account Verification';
  const htmlContent = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #333;">Email Verification</h2>
      <p>Your OTP for account verification is:</p>
      <div style="background-color: #f4f4f4; padding: 15px; text-align: center; font-size: 24px; font-weight: bold; letter-spacing: 5px; margin: 20px 0;">
        ${otp}
      </div>
      <p>This OTP will expire in 5 minutes.</p>
      <p>If you didn't request this OTP, please ignore this email.</p>
    </div>
  `;

  return sendEmail(email, subject, htmlContent);
};

module.exports = { sendEmail, sendOtpEmail };