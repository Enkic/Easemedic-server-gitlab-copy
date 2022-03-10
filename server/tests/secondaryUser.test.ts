import request from 'supertest';
import { app } from '../src/app';
import sequelize from '../src/database';
import { signup, signupSecondaryUser } from './auth';
import { UserType } from '../src/types/UserType';

describe('Secondary user authentification', () => {
    const user = {
        firstName: 'enki',
        lastName: 'corbin',
        email: 'email@test.fr',
        password: 'password'
    };

    const secondaryUser = {
        firstName: 'secondary',
        lastName: 'user',
        email: 'secondaryEmail@test.fr'
    };

    beforeEach(async () => {
        await sequelize.sync({ force: true });
    });

    it('GET user/secondaryUser | Expect 200', done => {
        let accessToken = '';
        signup(user.email, user.password, user.firstName, user.lastName).then(
            result => {
                accessToken = result.body.accessToken;
                expect(result.status).toEqual(201);

                signupSecondaryUser(
                    secondaryUser.email,
                    secondaryUser.firstName,
                    secondaryUser.lastName,
                    accessToken
                ).then(result => {
                    expect(result.status).toEqual(201);
                    done();
                });
            }
        );
    });

    it('POST user/updateNames/:id | Expect 200', done => {
        let accessToken = '';
        signup(user.email, user.password, user.firstName, user.lastName).then(
            result => {
                accessToken = result.body.accessToken;
                expect(result.status).toEqual(201);

                signupSecondaryUser(
                    secondaryUser.email,
                    secondaryUser.firstName,
                    secondaryUser.lastName,
                    accessToken
                ).then(result => {
                    request(app)
                        .post('/user/updateNames/1')
                        .set('Authorization', 'basic ' + accessToken)
                        .send({
                            firstName: 'new',
                            lastName: 'name'
                        })
                        .then(result => {
                            expect(result.status).toEqual(201);
                            done();
                        });
                });
            }
        );
    });

    it('POST user/socialSecurityNumber/:id | Expect 200', done => {
        let accessToken = '';
        signup(user.email, user.password, user.firstName, user.lastName).then(
            result => {
                accessToken = result.body.accessToken;
                expect(result.status).toEqual(201);

                signupSecondaryUser(
                    secondaryUser.email,
                    secondaryUser.firstName,
                    secondaryUser.lastName,
                    accessToken
                ).then(result => {
                    request(app)
                        .post('/user/socialSecurityNumber/1')
                        .set('Authorization', 'basic ' + accessToken)
                        .send({
                            socialSecurityNumber: '9999999999999'
                        })
                        .then(result => {
                            expect(result.status).toEqual(201);
                            done();
                        });
                });
            }
        );
    });

    it('POST user/phoneNumber/:id | Expect 200', done => {
        let accessToken = '';
        signup(user.email, user.password, user.firstName, user.lastName).then(
            result => {
                accessToken = result.body.accessToken;
                expect(result.status).toEqual(201);

                signupSecondaryUser(
                    secondaryUser.email,
                    secondaryUser.firstName,
                    secondaryUser.lastName,
                    accessToken
                ).then(result => {
                    request(app)
                        .post('/user/phoneNumber/1')
                        .set('Authorization', 'basic ' + accessToken)
                        .send({
                            phoneNumber: '0600000000'
                        })
                        .then(result => {
                            expect(result.status).toEqual(201);
                            done();
                        });
                });
            }
        );
    });

    it('POST user/addMutual/:id | Expect 200', done => {
        let accessToken = '';
        signup(user.email, user.password, user.firstName, user.lastName).then(
            result => {
                accessToken = result.body.accessToken;
                expect(result.status).toEqual(201);

                signupSecondaryUser(
                    secondaryUser.email,
                    secondaryUser.firstName,
                    secondaryUser.lastName,
                    accessToken
                ).then(result => {
                    request(app)
                        .post('/user/addMutual/1')
                        .set('Authorization', 'basic ' + accessToken)
                        .send({
                            amc: 12345678,
                            membershipNumber: 12345679,
                            ph2: 100,
                            ph4: 100,
                            ph7: 100,
                            expirationDate:
                                'Sun Aug 19 2020 01:15:30 GMT+0200 (CEST)'
                        })
                        .then(result => {
                            expect(result.status).toEqual(201);
                            done();
                        });
                });
            }
        );
    });
});
