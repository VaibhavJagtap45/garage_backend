const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.MAIL_USER,
    pass: process.env.MAIL_PASS,
  },
});

exports.sendMail = async (to, subject, message) => {
  try {
    await transporter.sendMail({
      from: `"Garage App" <${process.env.MAIL_USER}>`,
      to,
      subject,
      html: `<p>${message}</p>`,
    });
    console.log("Email sent to:", to);
  } catch (err) {
    console.error("Mail error:", err.message);
  }
};