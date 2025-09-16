const nodemailer = require('nodemailer');
require('dotenv').config();

// Configuración del transportador de correo
const transporter = nodemailer.createTransport({
  service: 'gmail', // Puedes cambiar a 'outlook', 'yahoo', etc.
  auth: {
    user: process.env.EMAIL_USER || 'tu-correo@gmail.com',
    pass: process.env.EMAIL_PASS || 'tu-contraseña-de-aplicacion'
  }
});

// Función para enviar correo de verificación
async function enviarCorreoVerificacion(correo, nombre, codigoVerificacion) {
  try {
    const mailOptions = {
      from: process.env.EMAIL_USER || 'tu-correo@gmail.com',
      to: correo,
      subject: 'Verifica tu cuenta - MiCiudadSV',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9f9f9;">
          <div style="background-color: #ffffff; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
            <h2 style="color: #333; text-align: center; margin-bottom: 30px;">¡Bienvenido a MiCiudadSV!</h2>
            
            <p style="color: #666; font-size: 16px; line-height: 1.6; margin-bottom: 20px;">
              Hola <strong>${nombre}</strong>, gracias por registrarte en nuestra plataforma.
            </p>
            
            <p style="color: #666; font-size: 16px; line-height: 1.6; margin-bottom: 30px;">
              Para completar tu registro, necesitas verificar tu correo electrónico usando el siguiente código:
            </p>
            
            <div style="background-color: #007bff; color: white; padding: 20px; border-radius: 8px; text-align: center; margin: 30px 0;">
              <h1 style="margin: 0; font-size: 32px; letter-spacing: 5px; font-family: 'Courier New', monospace;">
                ${codigoVerificacion}
              </h1>
            </div>
            
            <p style="color: #666; font-size: 14px; line-height: 1.6; margin-bottom: 20px;">
              <strong>Importante:</strong> Este código expirará en 15 minutos por seguridad.
            </p>
            
            <p style="color: #666; font-size: 16px; line-height: 1.6; margin-bottom: 30px;">
              Si no solicitaste este registro, puedes ignorar este correo.
            </p>
            
            <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee;">
              <p style="color: #999; font-size: 12px;">
                © 2024 MiCiudadSV. Todos los derechos reservados.
              </p>
            </div>
          </div>
        </div>
      `
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('✅ Correo de verificación enviado:', info.messageId);
    return true;
  } catch (error) {
    console.error('❌ Error enviando correo de verificación:', error);
    return false;
  }
}

// Función para enviar correo de recuperación de contraseña
async function enviarCorreoRecuperacion(correo, nombre, codigoVerificacion) {
  try {
    const mailOptions = {
      from: process.env.EMAIL_USER || 'tu-correo@gmail.com',
      to: correo,
      subject: 'Recuperar Contraseña - MiCiudadSV',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9f9f9;">
          <div style="background-color: #ffffff; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
            <h2 style="color: #333; text-align: center; margin-bottom: 30px;">Recuperar Contraseña</h2>
            
            <p style="color: #666; font-size: 16px; line-height: 1.6; margin-bottom: 20px;">
              Hola <strong>${nombre}</strong>, has solicitado recuperar tu contraseña.
            </p>
            
            <p style="color: #666; font-size: 16px; line-height: 1.6; margin-bottom: 30px;">
              Usa el siguiente código para restablecer tu contraseña:
            </p>
            
            <div style="background-color: #dc3545; color: white; padding: 20px; border-radius: 8px; text-align: center; margin: 30px 0;">
              <h1 style="margin: 0; font-size: 32px; letter-spacing: 5px; font-family: 'Courier New', monospace;">
                ${codigoVerificacion}
              </h1>
            </div>
            
            <p style="color: #666; font-size: 14px; line-height: 1.6; margin-bottom: 20px;">
              <strong>Importante:</strong> Este código expirará en 15 minutos por seguridad.
            </p>
            
            <p style="color: #666; font-size: 16px; line-height: 1.6; margin-bottom: 30px;">
              Si no solicitaste recuperar tu contraseña, puedes ignorar este correo.
            </p>
            
            <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee;">
              <p style="color: #999; font-size: 12px;">
                © 2024 MiCiudadSV. Todos los derechos reservados.
              </p>
            </div>
          </div>
        </div>
      `
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('✅ Correo de recuperación enviado:', info.messageId);
    return true;
  } catch (error) {
    console.error('❌ Error enviando correo de recuperación:', error);
    return false;
  }
}

// Función para verificar la configuración del correo
async function verificarConfiguracionCorreo() {
  try {
    await transporter.verify();
    console.log('✅ Configuración de correo electrónico válida');
    return true;
  } catch (error) {
    console.error('❌ Error en la configuración de correo electrónico:', error);
    return false;
  }
}

module.exports = {
  enviarCorreoVerificacion,
  enviarCorreoRecuperacion,
  verificarConfiguracionCorreo
};
