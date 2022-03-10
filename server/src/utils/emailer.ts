import nodemailer from 'nodemailer';
import ejs from 'ejs';

export async function getRegisterEmailCodeHtml(
    username: string,
    code: string
): Promise<string> {
    let html = '';

    html = await ejs.renderFile(
        __dirname + '/../../public/views/verify-email.ejs',
        { name: username, code: code }
    );

    return html;
}

export async function getForgotEmailCodeHtml(
    username: string,
    code: string
): Promise<string> {
    let html = '';

    html = await ejs.renderFile(
        __dirname + '/../../public/views/forgot-email.ejs',
        { name: username, code: code }
    );

    return html;
}

export function sendMail(
    toEmail: string,
    fromEmail: string,
    fromEmailPass: string,
    html: string
) {
    const transporter = nodemailer.createTransport({
        service: 'ssl0.ovh.net',
        name: 'smtp.easemedic.fr',
        host: 'smtp.easemedic.fr',
        port: 587,
        secure: false,
        debug: false,
        logger: false,
        tls: {
            rejectUnauthorized: false
        },
        auth: { user: fromEmail, pass: fromEmailPass }
    });

    var mailOptions = {
        from: fromEmail,
        to: toEmail,
        subject: 'Validate your account',
        html: html
    };

    transporter.sendMail(mailOptions, (error, info) => {
        if (error) {
            return console.log(`error: ${error}`);
        }
        console.log(`Message Sent ${info.response}`);
    });
}
