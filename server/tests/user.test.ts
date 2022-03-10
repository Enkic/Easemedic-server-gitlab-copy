import request from 'supertest';
import { app } from '../src/app';
import sequelize from '../src/database';
import { signup } from './auth';
import { UserType } from '../src/types/UserType';

describe('User authentification', () => {
    const user = {
        firstName: 'enki',
        lastName: 'corbin',
        email: 'email@test.fr',
        password: 'password'
    };

    beforeEach(async () => {
        await sequelize.sync({ force: true });
    });

    it('Get / | Expect 200', done => {
        request(app)
            .get('/')
            .then(result => {
                expect(result.text).toEqual('Api is UP');
                expect(result.status).toEqual(200);
                done();
            });
    });

    it('Post /user/signup (PRIVATE)  | Expect 201', done => {
        signup(user.email, user.password, user.firstName, user.lastName).then(
            result => {
                expect(result.status).toEqual(201);
                done();
            }
        );
    });

    it('GET /user/oauth/refresh_token | Expect 201', done => {
        let refreshToken = '';
        signup(user.email, user.password, user.firstName, user.lastName).then(
            result => {
                expect(result.status).toEqual(201);
                refreshToken = result.body.refreshToken;
                request(app)
                    .get('/user/oauth/refresh_token')
                    .set('Authorization', 'basic ' + refreshToken)
                    .then(result => {
                        expect(result.status).toEqual(201);
                        done();
                    });
            }
        );
    });

    it('Post /user/signup (PRIVATE)  | Expect 409', done => {
        signup(user.email, user.password, user.firstName, user.lastName).then(
            result => {
                expect(result.status).toEqual(201);

                signup(
                    user.email,
                    user.password,
                    user.firstName,
                    user.lastName
                ).then(result => {
                    expect(result.status).toEqual(409);
                    done();
                });
            }
        );
    });

    it('Post /user/signup | Expect 400', done => {
        signup(user.email, 'short', user.firstName, user.lastName).then(
            result => {
                expect(result.status).toEqual(400);
                expect(result.text).toEqual('Password is too short.');
                done();
            }
        );
    });

    it('Post /user/signup | Expect 400', done => {
        signup('incorrect', user.password, user.firstName, user.lastName).then(
            result => {
                expect(result.status).toEqual(400);
                expect(result.text).toEqual('Email is invalid.');
                done();
            }
        );
    });

    it('Post /user/signup | Expect 401', done => {
        request(app)
            .post('/user/signup')
            .send({
                firstName: user.firstName,
                lastName: user.lastName
            })
            .then(result => {
                expect(result.status).toEqual(401);
                done();
            });
    });

    it('Post /user/signup | Expect 400', done => {
        request(app)
            .post('/user/signup')
            .set(
                'Authorization',
                'basic ' +
                    Buffer.from(user.email + ':' + user.password).toString(
                        'base64'
                    )
            )
            .send({
                firstName: user.firstName
            })
            .then(result => {
                expect(result.status).toEqual(400);
                expect(result.text).toEqual('Last name is missing.');
                done();
            });
    });

    it('Post /user/signup | Expect 400', done => {
        request(app)
            .post('/user/signup')
            .set(
                'Authorization',
                'basic ' +
                    Buffer.from(user.email + ':' + user.password).toString(
                        'base64'
                    )
            )
            .send({
                lastName: user.firstName
            })
            .then(result => {
                expect(result.status).toEqual(400);
                expect(result.text).toEqual('First name is missing.');
                done();
            });
    });

    it('Get /user/me | Expect 200', done => {
        let accessToken = '';

        signup(user.email, user.password, user.firstName, user.lastName).then(
            result => {
                accessToken = result.body.accessToken;

                request(app)
                    .get('/user/me')
                    .set('Authorization', 'basic ' + accessToken)
                    .then(result => {
                        expect(result.status).toEqual(200);
                        done();
                    });
            }
        );
    });

    it('Get /user/me | Expect 403', done => {
        signup(user.email, user.password, user.firstName, user.lastName).then(
            () => {
                request(app)
                    .get('/user/me')
                    .set('Authorization', 'basic fake.json.token')
                    .then(result => {
                        expect(result.status).toEqual(403);
                        done();
                    });
            }
        );
    });

    it('Delete /user/me | Expect 200', done => {
        let accessToken = '';

        signup(user.email, user.password, user.firstName, user.lastName).then(
            result => {
                accessToken = result.body.accessToken;

                request(app)
                    .delete('/user/me')
                    .set('Authorization', 'basic ' + accessToken)
                    .then(result => {
                        expect(result.status).toEqual(200);
                        done();
                    });
            }
        );
    });
});
