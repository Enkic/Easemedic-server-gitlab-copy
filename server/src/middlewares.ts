import { Request, Response, NextFunction } from 'express';
import auth from 'basic-auth';
import jwt from 'jsonwebtoken';
import { ExtendedResponse } from './types/Response';
import bcrypt from 'bcrypt';

import User from './models/User';
import SecondaryUser from './models/SecondaryUser';
import Prescription from './models/Prescription';
import Drug from './models/Drug';
import PharmacistUser from './models/PharmacistUser';
import { Payload, getDecodedPayload } from './JWTUtils/tokens';
import { receiveMessageOnPort } from 'worker_threads';

export const getCredentials = async (
    req: Request,
    res: ExtendedResponse,
    next: NextFunction
) => {
    const credentials = auth(req);

    if (!credentials) {
        res.setHeader('WWW-Authenticate', 'Basic realm="EaseMedic-Server"');
        return res
            .status(401)
            .send('Missing Authorization header with Basic\n');
    }

    res.locals.credentials = credentials;
    next();
};

export const isAccountActivated = async (
    req: Request,
    res: ExtendedResponse,
    next: NextFunction
) => {
    try {
        const { user } = res.locals;
        const { pharmaUser } = res.locals;

        if (user) {
            if (!user.isActive) {
                return res.status(403).send('This user account is not active');
            }
        } else if (pharmaUser) {
            if (!pharmaUser.isActive) {
                return res
                    .status(403)
                    .send('This pharmacist account is not active');
            }
        } else {
            next(
                'Counld not find any user while trying to find if account have been activated'
            );
        }

        next();
    } catch (err) {
        console.log(err);
        res.sendStatus(500);
    }
};

export const getUserFromToken = async (
    req: Request,
    res: ExtendedResponse,
    next: NextFunction
) => {
    try {
        const authHeader = req.headers['authorization'];
        const token = authHeader && authHeader.split(' ')[1];
        if (token == null) {
            res.setHeader('WWW-Authenticate', 'Basic realm="EaseMedic-Server"');
            return res
                .status(401)
                .send('Missing Authorization header with OAuth\n');
        }

        if (process.env.JWT_ACCESS_SECRET == null) {
            return res.status(500);
        }
        jwt.verify(
            token,
            process.env.JWT_ACCESS_SECRET || '',
            async (err, decoded) => {
                if (err) {
                    console.log('Could not authenticate user: ' + err.message);
                    return res.status(403).send(err.message);
                } else {
                    if (!decoded) {
                        return res
                            .status(403)
                            .send('Token payload is not present');
                    }
                    const decodedObj = getDecodedPayload(token);
                    const email = decodedObj.email;

                    if (!email) {
                        return res
                            .status(403)
                            .send('Email is not present in token payload');
                    }

                    const user = await User.findOne({
                        where: { email: email }
                    });

                    if (!user) {
                        return res
                            .status(401)
                            .send('User does not exist anymore');
                    }
                    res.locals.user = user;

                    next();
                }
            }
        );
    } catch (err) {
        console.log(err);
        res.sendStatus(500);
    }
};

export const getUserFromCredentials = async (
    req: Request,
    res: ExtendedResponse,
    next: NextFunction
) => {
    // Check if Authorization header (email:password) is valid.
    const { name, pass } = res.locals.credentials; // name is an email

    // Get user profile from database.
    const user = await User.findOne({
        include: [
            {
                model: Prescription,
                as: 'prescriptions',
                include: [
                    {
                        model: Drug,
                        as: 'drugs'
                    }
                ]
            }
        ],
        where: { email: name }
    });

    if (!user) {
        return res
            .status(403)
            .send(
                'Email or password does not match, or the account with this email does not exist\n'
            );
    }

    bcrypt.compare(pass, user.password, function (err, result) {
        if (!result) {
            return res
                .status(403)
                .send(
                    'Email or password does not match, or the account with this email does not exist\n'
                );
        } else {
            res.locals.user = user;
            next();
        }
    });
};

export const savePharmacistUserFromDatabase = async (
    req: Request,
    res: ExtendedResponse,
    next: NextFunction
) => {
    // Check if Authorization header (email:password) is valid.
    const { name, pass } = res.locals.credentials; // name is an email

    // Get user profile from database.
    const pharmaUser = await PharmacistUser.findOne({
        include: [
            {
                model: Prescription,
                as: 'prescriptions',
                include: [
                    {
                        model: Drug,
                        as: 'drugs'
                    }
                ]
            }
        ],
        where: { email: name }
    });

    if (!pharmaUser) {
        return res
            .status(403)
            .send(
                'Email or password does not match, or the account with this email does not exist\n'
            );
    }

    bcrypt.compare(pass, pharmaUser.password, function (err, result) {
        if (!result) {
            return res
                .status(403)
                .send(
                    'Email or password does not match, or the account with this email does not exist\n'
                );
        } else {
            res.locals.pharmaUser = pharmaUser;
            next();
        }
    });
};
export const getSecondaryUserIfExist = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        const user = res.locals.user;
        const secondaryUserId = Number(req.params.id);

        if (!user) {
            return res.status(403).send('Could not find user\n');
        }
        if (!secondaryUserId) {
            next();
            return;
        }

        const secondaryUsers: SecondaryUser[] = await user.getSecondaryUsers();
        var secondayUserFound = false;

        const secondaryUsersMapping = secondaryUsers.map(secondaryUser => {
            if (secondaryUser.id == secondaryUserId) {
                res.locals.secondaryUser = secondaryUser;
                secondayUserFound = true;
                next();
            }
        });

        await Promise.all(secondaryUsersMapping);

        if (!secondayUserFound) {
            return res.status(403).send("You don't have access to this user\n");
        }
    } catch (err) {
        console.log(err);
        return res.sendStatus(500);
    }
};

export const getPharmaUserFromToken = async (
    req: Request,
    res: ExtendedResponse,
    next: NextFunction
) => {
    try {
        const authHeader = req.headers['authorization'];
        const token = authHeader && authHeader.split(' ')[1];
        if (token == null) {
            res.setHeader('WWW-Authenticate', 'Basic realm="EaseMedic-Server"');
            return res
                .status(401)
                .send('Missing Authorization header with OAuth\n');
        }

        if (process.env.JWT_ACCESS_SECRET == null) {
            return res.status(500);
        }
        jwt.verify(
            token,
            process.env.JWT_ACCESS_SECRET || '',
            async (err, decoded) => {
                if (err) {
                    console.log('Could not authenticate user: ' + err.message);
                    return res.status(403).send(err.message);
                } else {
                    if (!decoded) {
                        return res
                            .status(403)
                            .send('Token payload is not present');
                    }
                    const decodedObj = getDecodedPayload(token);
                    const email = decodedObj.email;

                    if (!email) {
                        return res
                            .status(403)
                            .send('Email is not present in token payload');
                    }

                    const pharmaUser = await PharmacistUser.findOne({
                        where: { email: email }
                    });

                    if (!pharmaUser) {
                        return res
                            .status(401)
                            .send('pharmaUser does not exist anymore');
                    }
                    res.locals.pharmaUser = pharmaUser;
                    next();
                }
            }
        );
    } catch (err) {
        console.log(err);
        res.sendStatus(500);
    }
};

export const getPharmaUserFromCredentials = async (
    req: Request,
    res: ExtendedResponse,
    next: NextFunction
) => {
    // Check if Authorization header (email:password) is valid.
    const { name, pass } = res.locals.credentials; // name is an email
    // Get user profile from database.
    const pharmaUser = await PharmacistUser.findOne({
        where: { email: name }
    });
    if (!pharmaUser) {
        return res
            .status(403)
            .send(
                '1: Email or password does not match, or the account with this email does not exist\n'
            );
    }

    bcrypt.compare(pass, pharmaUser.password, function (err, result) {
        if (!result) {
            return res
                .status(403)
                .send(
                    '2: Email or password does not match, or the account with this email does not exist\n'
                );
        } else {
            res.locals.pharmaUser = pharmaUser;
            next();
        }
    });
};

export const handleServerErrorResponse = (
    err: any,
    req: Request,
    res: Response,
    next: NextFunction
) => {
    console.error(err);
    res.sendStatus(500);
};
