const { createTransport } = require('nodemailer');

const sendMail = (data) => {
    try{
        const transporter = createTransport({
            host: "smtp-relay.brevo.com",
            port: 587,
            auth: {
                user: "fashionsjshop@gmail.com",
                pass: process.env.BREVO_API_KEY,
            },
        });
    
        const mailOptions = {
            from: 'fashionsjshop@gmail.com',
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
    }catch(e){
        console.log(e.message);
    }
}

module.exports = sendMail;


