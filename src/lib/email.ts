// src/lib/email.ts
const brevo = require('@getbrevo/brevo');
const apiInstance = new brevo.TransactionalEmailsApi();

// Konfiguracja klucza API
const apiKey = apiInstance.authentications['apiKey'];
apiKey.apiKey = process.env.BREVO_API_KEY!;

interface SendEmailParams {
  to: string;
  subject: string;
  html: string;
}

export const sendEmail = async ({ to, subject, html }: SendEmailParams): Promise<boolean> => {
  try {
    const sendSmtpEmail = new brevo.SendSmtpEmail();
    
    sendSmtpEmail.subject = subject;
    sendSmtpEmail.htmlContent = html;
    sendSmtpEmail.sender = { 
      name: "sshM.io", 
      email: "noreply@sshm.io" 
    };
    sendSmtpEmail.to = [
      { email: to }
    ];

    await apiInstance.sendTransacEmail(sendSmtpEmail);
    return true;
  } catch (error) {
    console.error('Email sending failed:', error);
    return false;
  }
};

export const sendRegistrationEmail = async (email: string, token: string): Promise<boolean> => {
  const confirmUrl = `https://sshm.io/confirm-email/${token}`;
  
  return sendEmail({
    to: email,
    subject: 'Welcome to SSHM.io - Confirm Your Email',
    html: `
      <html>
        <body>
          <h1>Welcome to SSHM.io!</h1>
          <p>Thank you for registering. Please confirm your email address to get started.</p>
          <p>
            <a href="${confirmUrl}" 
               style="background-color: #3b82f6; color: white; padding: 12px 20px; text-decoration: none; border-radius: 6px; display: inline-block;">
              Confirm Email
            </a>
          </p>
          <p>If you didn't create this account, you can safely ignore this email.</p>
          <hr>
          <p style="color: #666; font-size: 0.9em;">
            SSHM.io - Secure SSH Management
          </p>
        </body>
      </html>
    `
  });
};