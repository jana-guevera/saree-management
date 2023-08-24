const { createTransport } = require('nodemailer');

const sendMail = (data) => {
    const transporter = createTransport({
        host: "smtp-relay.brevo.com",
        port: 587,
        auth: {
            user: "alloravalley@gmail.com",
            pass: process.env.BREVO_API_KEY,
        },
    });

    const mailOptions = {
        from: 'alloravalley@gmail.com',
        to: data.email,
        subject: data.subject,
        text: data.message
    };

    transporter.sendMail(mailOptions, function(error, info){
        if (error) {
            console.log(error);
        } else {
            console.log('Email sent: ' + info.response);
        }
    });
}

module.exports = sendMail;


