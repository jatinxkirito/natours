const nodemailer = require('nodemailer');
const pug = require('pug');
const htmlToText = require('html-to-text');
const EMAIL = class {
  constructor(user, url) {
    this.to = user.email;
    this.firstName = user.name.split(' ')[0];
    this.url = url;
    this.from = `Kirito <${process.env.EMAIL}>`;
  }
  createTransport() {
    return nodemailer.createTransport({
      host: process.env.EMAIL_HOST,
      port: process.env.EMAIL_PORT,
      secure: false, // Use `true` for port 465, `false` for all other ports
      auth: {
        user: process.env.EMAIL_USERNAME,
        pass: process.env.EMAIL_PASSWORD,
      },
    });
  }
  async send(template, subject) {
    const html = pug.renderFile(`${__dirname}/../views/email/${template}.pug`, {
      firstName: this.firstName,
      url: this.url,
      subject,
    });

    const mailOptions = {
      from: 'Jatin Madaan <sjmadaan143@gmail.com>',
      to: this.to,
      subject,
      html,
      text: htmlToText.convert(html),
    };
    await this.createTransport().sendMail(mailOptions);
  }
  async sendWelcome() {
    await this.send('welcome', 'Welcome to natours!!!');
  }
  async sendReset() {
    await this.send('resetemail', 'Email for password reset');
  }
};
module.exports = EMAIL;

// const sendMail = async (options) => {
//   const transporter = nodemailer.createTransport({
//     host: process.env.EMAIL_HOST,
//     port: process.env.EMAIL_PORT,
//     secure: false, // Use `true` for port 465, `false` for all other ports
//     auth: {
//       user: process.env.EMAIL_USERNAME,
//       pass: process.env.EMAIL_PASSWORD,
//     },
//   });
//   const mailOptions = {
//     from: 'Jatin Madaan <sjmadaan143@gmail.com>',
//     to: options.email,
//     subject: options.subject,
//     text: options.message,
//   };
//   await transporter.sendMail(mailOptions);
// };
// module.exports = sendMail;
