// backend/services/emailService.js - VERSIÓN CORREGIDA
const nodemailer = require('nodemailer');

class EmailService {
  constructor() {
    console.log('🔧 === INITIALIZING EMAIL SERVICE ===');
    console.log('📧 EMAIL_USER:', process.env.EMAIL_USER);
    console.log('🔑 EMAIL_PASSWORD configured:', !!process.env.EMAIL_PASSWORD);
    console.log('🏠 EMAIL_HOST:', process.env.EMAIL_HOST || 'smtp.gmail.com');
    console.log('🔌 EMAIL_PORT:', process.env.EMAIL_PORT || '587');
    
    this.transporter = this.createTransporter();
    this.testConnection();
  }

  createTransporter() {
    try {
      // Verificar variables de entorno
      if (!process.env.EMAIL_USER || !process.env.EMAIL_PASSWORD) {
        console.log('❌ Email credentials missing in environment variables');
        console.log('EMAIL_USER:', process.env.EMAIL_USER);
        console.log('EMAIL_PASSWORD exists:', !!process.env.EMAIL_PASSWORD);
        throw new Error('Email credentials not configured');
      }

      // CORREGIDO: createTransport en lugar de createTransporter
      const transporter = nodemailer.createTransport({
        host: process.env.EMAIL_HOST || 'smtp.gmail.com',
        port: parseInt(process.env.EMAIL_PORT) || 587,
        secure: false,
        auth: {
          user: process.env.EMAIL_USER,
          pass: process.env.EMAIL_PASSWORD
        },
        tls: {
          rejectUnauthorized: false
        }
      });

      console.log('✅ Email transporter created successfully');
      return transporter;

    } catch (error) {
      console.log('❌ Error creating email transporter:', error.message);
      throw error;
    }
  }

  async testConnection() {
    try {
      console.log('🧪 Testing email connection...');
      await this.transporter.verify();
      console.log('✅ Gmail connection successful!');
      return true;
    } catch (error) {
      console.log('❌ Gmail connection failed:', error.message);
      console.log('🔧 Check your email credentials in .env file');
      return false;
    }
  }

  async sendVerificationCode(email, name, code) {
    try {
      console.log(`📧 Sending verification email to: ${email}`);
      console.log(`🔑 Verification code: ${code}`);

      if (!this.transporter) {
        throw new Error('Email transporter not initialized');
      }

      const mailOptions = {
        from: {
          name: 'Mi Ciudad SV',
          address: process.env.EMAIL_USER
        },
        to: email,
        subject: '🔐 Código de Verificación - Mi Ciudad SV',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
              <h1 style="color: white; margin: 0; font-size: 28px;">🏙️ Mi Ciudad SV</h1>
            </div>
            
            <div style="background: white; padding: 40px; border-radius: 0 0 10px 10px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
              <h2 style="color: #333; margin-bottom: 20px;">¡Hola ${name}! 👋</h2>
              
              <p style="color: #666; font-size: 16px; line-height: 1.6;">
                Gracias por registrarte en <strong>Mi Ciudad SV</strong>. Para completar tu registro, 
                por favor verifica tu dirección de correo electrónico usando el siguiente código:
              </p>
              
              <div style="background: #f8f9fa; padding: 30px; border-radius: 10px; text-align: center; margin: 30px 0;">
                <div style="font-size: 14px; color: #666; margin-bottom: 10px;">Tu código de verificación es:</div>
                <div style="font-size: 36px; font-weight: bold; color: #667eea; letter-spacing: 8px; font-family: 'Courier New', monospace;">
                  ${code}
                </div>
              </div>
              
              <p style="color: #666; font-size: 14px;">
                ⏰ Este código expirará en <strong>10 minutos</strong> por seguridad.
              </p>
              
              <p style="color: #666; font-size: 14px;">
                Si no solicitaste este código, puedes ignorar este mensaje.
              </p>
              
              <div style="border-top: 1px solid #eee; padding-top: 20px; margin-top: 30px; text-align: center;">
                <p style="color: #999; font-size: 12px;">
                  © 2025 Mi Ciudad SV - Reportando para mejorar nuestra ciudad
                </p>
              </div>
            </div>
          </div>
        `
      };

      const result = await this.transporter.sendMail(mailOptions);
      console.log('✅ Verification email sent successfully');
      console.log('📧 Message ID:', result.messageId);
      
      return {
        success: true,
        messageId: result.messageId
      };

    } catch (error) {
      console.log('❌ Error sending verification email:', error.message);
      throw error;
    }
  }

  async sendTestEmail(email) {
    try {
      console.log(`🧪 Sending test email to: ${email}`);

      const mailOptions = {
        from: {
          name: 'Mi Ciudad SV - Test',
          address: process.env.EMAIL_USER
        },
        to: email,
        subject: '🧪 Test Email - Mi Ciudad SV',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <h2>🧪 Email Test Successful!</h2>
            <p>Este es un email de prueba desde <strong>Mi Ciudad SV</strong>.</p>
            <p>Si recibes este mensaje, la configuración de email está funcionando correctamente. ✅</p>
            <p><strong>Timestamp:</strong> ${new Date().toISOString()}</p>
            <p><strong>Enviado a:</strong> ${email}</p>
          </div>
        `
      };

      const result = await this.transporter.sendMail(mailOptions);
      console.log('✅ Test email sent successfully');
      console.log('📧 Message ID:', result.messageId);
      
      return {
        success: true,
        messageId: result.messageId
      };

    } catch (error) {
      console.log('❌ Error sending test email:', error.message);
      throw error;
    }
  }
}

// Crear instancia única
let emailService;
try {
  emailService = new EmailService();
} catch (error) {
  console.log('❌ Failed to initialize email service:', error.message);
  emailService = null;
}

module.exports = emailService;