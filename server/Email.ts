import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: "alaagh23dz@gmail.com",
    pass: "mtkd mumx ptrf fpyo".replace(/\s/g, ""),
  },
});

export function generateOTP(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

export async function sendVerificationEmail(
  to: string,
  name: string,
  otp: string
): Promise<boolean> {
  try {
    await transporter.sendMail({
      from: `"حرفتي 🔨" <alaagh23dz@gmail.com>`,
      to,
      subject: "تأكيد حسابك في حرفتي",
      html: `
        <!DOCTYPE html>
        <html dir="rtl" lang="ar">
        <head>
          <meta charset="UTF-8">
          <style>
            body { font-family: Arial, sans-serif; background: #f5f5f5; margin: 0; padding: 20px; direction: rtl; }
            .container { max-width: 500px; margin: 0 auto; background: white; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.1); }
            .header { background: linear-gradient(135deg, #2DD4BF, #0891b2); padding: 30px; text-align: center; }
            .header h1 { color: white; margin: 0; font-size: 28px; }
            .header p { color: rgba(255,255,255,0.8); margin: 8px 0 0; }
            .body { padding: 30px; }
            .greeting { font-size: 18px; color: #333; margin-bottom: 16px; }
            .otp-box { background: #f0fdf4; border: 2px dashed #2DD4BF; border-radius: 12px; padding: 24px; text-align: center; margin: 24px 0; }
            .otp { font-size: 42px; font-weight: bold; color: #2DD4BF; letter-spacing: 8px; }
            .otp-label { color: #666; font-size: 14px; margin-top: 8px; }
            .warning { background: #fff7ed; border-right: 4px solid #f97316; padding: 12px 16px; border-radius: 8px; color: #9a3412; font-size: 14px; }
            .footer { background: #f9fafb; padding: 20px 30px; text-align: center; color: #9ca3af; font-size: 12px; border-top: 1px solid #e5e7eb; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🔨 حرفتي</h1>
              <p>منصة الحرفيين في الجزائر</p>
            </div>
            <div class="body">
              <p class="greeting">مرحباً <strong>${name}</strong>! 👋</p>
              <p style="color:#555">شكراً لتسجيلك في حرفتي. أدخل هذا الرمز لتأكيد حسابك:</p>

              <div class="otp-box">
                <div class="otp">${otp}</div>
                <div class="otp-label">رمز التحقق صالح لمدة 10 دقائق</div>
              </div>

              <div class="warning">
                ⚠️ إذا لم تقم بإنشاء هذا الحساب، يرجى تجاهل هذا البريد.
              </div>
            </div>
            <div class="footer">
              © 2026 حرفتي — جميع الحقوق محفوظة
            </div>
          </div>
        </body>
        </html>
      `,
    });
    return true;
  } catch (err) {
    console.error("Email send error:", err);
    return false;
  }
}

export async function sendPasswordResetEmail(
  to: string,
  name: string,
  otp: string
): Promise<boolean> {
  try {
    await transporter.sendMail({
      from: `"حرفتي 🔨" <alaagh23dz@gmail.com>`,
      to,
      subject: "إعادة تعيين كلمة المرور - حرفتي",
      html: `
        <!DOCTYPE html>
        <html dir="rtl" lang="ar">
        <head><meta charset="UTF-8"><style>
          body { font-family: Arial, sans-serif; background: #f5f5f5; margin: 0; padding: 20px; direction: rtl; }
          .container { max-width: 500px; margin: 0 auto; background: white; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.1); }
          .header { background: linear-gradient(135deg, #f97316, #dc2626); padding: 30px; text-align: center; }
          .header h1 { color: white; margin: 0; font-size: 28px; }
          .otp-box { background: #fff7ed; border: 2px dashed #f97316; border-radius: 12px; padding: 24px; text-align: center; margin: 24px 0; }
          .otp { font-size: 42px; font-weight: bold; color: #f97316; letter-spacing: 8px; }
          .footer { background: #f9fafb; padding: 20px; text-align: center; color: #9ca3af; font-size: 12px; }
        </style></head>
        <body>
          <div class="container">
            <div class="header"><h1>🔒 إعادة تعيين كلمة المرور</h1></div>
            <div style="padding:30px">
              <p>مرحباً <strong>${name}</strong>،</p>
              <p>طلبت إعادة تعيين كلمة مرورك. استخدم هذا الرمز:</p>
              <div class="otp-box">
                <div class="otp">${otp}</div>
                <div style="color:#666;font-size:14px;margin-top:8px">صالح لمدة 10 دقائق</div>
              </div>
            </div>
            <div class="footer">© 2026 حرفتي</div>
          </div>
        </body></html>
      `,
    });
    return true;
  } catch (err) {
    console.error("Email send error:", err);
    return false;
  }
}