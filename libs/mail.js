
// send mail with defined transport object
module.exports.email = function(email, creds, cb) {
    
    var nodemailer = require('nodemailer');

    // create reusable transporter object using the default SMTP transport
    var transporter = nodemailer.createTransport("SMTP", {
        service: "Gmail",
        auth: {
            user: "siddharthparikh1993@gmail.com",
            pass: "siddharth24"
        }
    });

    // setup e-mail data with unicode symbols
    var mailOptions = {
        from: '"Siddharth Parikh" <siddharthparikh1993@gmail.com>', // sender address
        to: email, // list of receivers
        subject: '[Confidential] Vote Chain Password', // Subject line
        text: 'username:'+creds.id+'Your password is' + creds.secret, // plaintext body
        html: '<b>If this works i would be so happy</b>' // html body
    };

    transporter.sendMail(mailOptions, function(error, info){
        if(error){
            cb(error);
            //return console.log(error);
        }
        console.log('Message sent: ' + info.response);
        cb(nil);
    });
}