var mailchimpInstance = 'us5',
    listUniqueId = '4a3d757df2',
    mailchimpApiKey = '031be714fd2943ee98b7f3b680df94c7-us5';
import * as request from 'superagent';

export async function mailChimpSignup(
    firstname: String,
    lastname: String,
    email: String,
    phoneNumber: String | null,
    address: String | null,
    isPharma: Boolean
) {
    let userType = isPharma ? 'Pharmacist' : 'User';
    let phoneNumberValid = phoneNumber ? phoneNumber : '';
    let addressValid = address ? address : '';

    console.log('Adding a mailchimp user');

    request
        .post(
            'https://' +
                mailchimpInstance +
                '.api.mailchimp.com/3.0/lists/' +
                listUniqueId +
                '/members/'
        )
        .set('Content-Type', 'application/json;charset=utf-8')
        .set(
            'Authorization',
            'Basic ' + new Buffer('any:' + mailchimpApiKey).toString('base64')
        )
        .send({
            email_address: email,
            status: 'subscribed',
            merge_fields: {
                FNAME: firstname,
                LNAME: lastname,
                PHONE: phoneNumberValid,
                ADDRESS: addressValid,
                USERTYPE: userType
            }
        })
        .end(function (err: any, response: any) {
            if (
                response.status < 300 ||
                (response.status === 400 &&
                    response.body.title === 'Member Exists')
            ) {
                console.log('Succefully signup to Mail Chimp');
            } else {
                console.log('Error while signup to Mail Chimp: ', err);
            }
        });
}
