import request from 'supertest';
import { app } from '../src/app';
import sequelize from '../src/database';
import { signupPharma } from './auth';
import { UserType } from '../src/types/UserType';
import { scheduleFinessRefresh } from '../src/finess';
import { SSL_OP_EPHEMERAL_RSA } from 'constants';

describe('Pharmacist user authentification', () => {
    const pharmaUser = {
        firstName: 'enki',
        lastName: 'corbin',
        email: 'email@test.fr',
        password: 'password',
        phoneNumber: '0646464646',
        addressPharma: '25 RTE DES PALMIERS LA MONTAGNE 411 9D LA REUNION'
    };

    beforeEach(async () => {
        await sequelize.sync({ force: true });
    });

    it('Post /pharmacies/signup | Expect 400', done => {
        signupPharma(
            pharmaUser.email,
            pharmaUser.password,
            pharmaUser.firstName,
            pharmaUser.lastName,
            pharmaUser.phoneNumber,
            'WRONG ADDREESS'
        ).then(result => {
            expect(result.status).toEqual(400);
            done();
        });
    });

    // it('GET /allPharmacies | Expect 200', done => {
    //     request(app)
    //         .get('/allPharmacies')
    //         .then(result => {
    //             expect(result.status).toEqual(200);
    //             done();
    //         });
    // });

    // it('GET /pharmacies/userPharmacist | Expect 200', done => {
    //     let accessToken = "";
    //     signupPharma(
    //         pharmaUser.email,
    //         pharmaUser.password,
    //         pharmaUser.firstName,
    //         pharmaUser.lastName,
    //         pharmaUser.phoneNumber,
    //         pharmaUser.addressPharma
    //     ).then(result => {
    //         accessToken = result.body.accessToken;
    //         expect(result.text).toEqual("dd");
    //         expect(result.status).toEqual(201);
    //         request(app)
    //             .get('/pharmacies/userPharmacist')
    //             .set(
    //                 'Authorization',
    //                 'basic ' + accessToken
    //             ).then(result => {
    //                 expect(result.status).toEqual(200);
    //                 done();
    //             });

    //     });
    // });
});
