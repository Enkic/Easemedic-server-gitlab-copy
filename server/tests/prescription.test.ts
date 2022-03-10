import request from 'supertest';
import { app } from '../src/app';
import sequelize from '../src/database';
import { signup } from './auth';
import { UserType } from '../src/types/UserType';

describe('Prescription managment', () => {
    const user = {
        firstName: 'enki',
        lastName: 'corbin',
        email: 'email@test.fr',
        password: 'password'
    };

    let accessToken: string = '';

    beforeEach(async () => {
        await sequelize.sync({ force: true });
    });

    it('Delete /prescription | Expect 204', done => {
        signup(user.email, user.password, user.firstName, user.lastName).then(
            result => {
                expect(result.status).toEqual(201);

                accessToken = result.body.accessToken;

                request(app)
                    .post('/prescription')
                    .set('Authorization', 'basic ' + accessToken)
                    .send({
                        doctorName: 'Michel Cymes',
                        date: '2020-01-01T21:42:21.420Z',
                        drugs: [{ name: 'padamalgam', count: 1 }]
                    })
                    .then(result => {
                        expect(result.status).toEqual(201);
                        const id = result.body.id;

                        request(app)
                            .delete('/prescription/' + id)
                            .set('Authorization', 'basic ' + accessToken)
                            .then(result => {
                                expect(result.status).toEqual(204);
                                done();
                            });
                    });
            }
        );
    });

    it('Delete /prescription | Expect 400', done => {
        let accessToken = '';

        signup(user.email, user.password, user.firstName, user.lastName).then(
            result => {
                expect(result.status).toEqual(201);

                accessToken = result.body.accessToken;

                request(app)
                    .post('/prescription')
                    .set('Authorization', 'basic ' + accessToken)
                    .send({
                        doctorName: 'Michel Cymes',
                        date: '2020-01-01T21:42:21.420Z',
                        drugs: [{ name: 'padamalgam', count: 1 }]
                    })
                    .then(result => {
                        expect(result.status).toEqual(201);

                        request(app)
                            .delete('/prescription/999')
                            .set('Authorization', 'basic ' + accessToken)
                            .then(result => {
                                expect(result.status).toEqual(400);
                                done();
                            });
                    });
            }
        );
    });

    it('Post /prescription | Expect 400', done => {
        let accessToken = '';

        signup(user.email, user.password, user.firstName, user.lastName).then(
            result => {
                accessToken = result.body.accessToken;

                request(app)
                    .post('/prescription')
                    .set('Authorization', 'basic ' + accessToken)
                    .send({
                        date: '2020-01-01T21:42:21.420Z',
                        drugs: [{ name: 'padamalgam', count: 1 }]
                    })
                    .then(result => {
                        expect(result.status).toEqual(400);
                        done();
                    });
            }
        );
    });

    it('Post /prescription | Expect 400', done => {
        let accessToken = '';

        signup(user.email, user.password, user.firstName, user.lastName).then(
            result => {
                accessToken = result.body.accessToken;
                request(app)
                    .post('/prescription')
                    .set('Authorization', 'basic ' + accessToken)
                    .send({
                        date: '2020-01-01T21:42:21.420Z',
                        drugs: [{ name: 'padamalgam', count: 1 }]
                    })
                    .then(result => {
                        expect(result.status).toEqual(400);
                        done();
                    });
            }
        );
    });

    it('Post /prescription | Expect 400', done => {
        let accessToken = '';
        signup(user.email, user.password, user.firstName, user.lastName).then(
            result => {
                accessToken = result.body.accessToken;
                request(app)
                    .post('/prescription')
                    .set('Authorization', 'basic ' + accessToken)
                    .send({
                        doctorName: 'Michel Cymes',
                        drugs: [{ name: 'padamalgam', count: 1 }]
                    })
                    .then(result => {
                        expect(result.status).toEqual(400);
                        done();
                    });
            }
        );
    });

    it('Post /prescription | Expect 400', done => {
        let accessToken = '';
        signup(user.email, user.password, user.firstName, user.lastName).then(
            result => {
                accessToken = result.body.accessToken;
                request(app)
                    .post('/prescription')
                    .set('Authorization', 'basic ' + accessToken)
                    .send({
                        doctorName: 'Michel Cymes',
                        date: '2020-01-01T21:42:21.420Z'
                    })
                    .then(result => {
                        expect(result.status).toEqual(400);
                        done();
                    });
            }
        );
    });

    it('Post /prescription | Expect 400', done => {
        let accessToken = '';
        signup(user.email, user.password, user.firstName, user.lastName).then(
            result => {
                accessToken = result.body.accessToken;
                request(app)
                    .post('/prescription')
                    .set('Authorization', 'basic ' + accessToken)
                    .send({
                        doctorName: 'Michel Cymes',
                        date: '2020-01-01T21:42:21.420Z',
                        drugs: []
                    })
                    .then(result => {
                        expect(result.status).toEqual(400);
                        done();
                    });
            }
        );
    });

    it('Post /prescription | Expect 201', done => {
        let accessToken = '';
        signup(user.email, user.password, user.firstName, user.lastName).then(
            result => {
                accessToken = result.body.accessToken;
                request(app)
                    .post('/prescription')
                    .set('Authorization', 'basic ' + accessToken)
                    .send({
                        doctorName: 'Michel Cymes',
                        date: '2020-01-01T21:42:21.420Z',
                        drugs: [{ name: 'padamalgam', count: 1 }]
                    })
                    .then(result => {
                        expect(result.status).toEqual(201);
                        done();
                    });
            }
        );
    });
});
