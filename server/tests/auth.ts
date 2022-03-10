import request from 'supertest';
import { app } from '../src/app';
import { UserType } from '../src/types/UserType';

export async function signup(
    email: string,
    password: string,
    firstName: string,
    lastName: string
) {
    const res = await request(app)
        .post('/user/signup')
        .set(
            'Authorization',
            'basic ' + Buffer.from(email + ':' + password).toString('base64')
        )
        .send({
            firstName: firstName,
            lastName: lastName
        });

    return res;
}

export async function signupSecondaryUser(
    email: string,
    firstName: string,
    lastName: string,
    accessToken: string
) {
    const res = await request(app)
        .post('/user/secondaryUser')
        .set('Authorization', 'basic ' + accessToken)
        .send({
            firstName: firstName,
            lastName: lastName,
            email: email
        });

    return res;
}

export async function signupPharma(
    email: string,
    password: string,
    firstName: string,
    lastName: string,
    phoneNumber: string,
    addressPharma: string
) {
    const res = await request(app)
        .post('/pharmacies/signup')
        .set(
            'Authorization',
            'basic ' + Buffer.from(email + ':' + password).toString('base64')
        )
        .send({
            firstName: firstName,
            lastName: lastName,
            phoneNumber: phoneNumber,
            addressPharma: addressPharma
        });

    return res;
}
