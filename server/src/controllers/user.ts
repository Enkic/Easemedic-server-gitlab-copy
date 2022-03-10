import { Request, NextFunction, request, response } from 'express';
import validator from 'validator';
import bcrypt from 'bcrypt';
import multer from 'multer';

import { ExtendedResponse } from '../types/Response';
import User from '../models/User';
import Pharmacy from '../models/Pharmacy';
import { signToken, getDecodedPayload } from '../JWTUtils/tokens';
import SecondaryUser from '../models/SecondaryUser';
import { UserInfos } from '../types/UserInfos';
import {
    sendMail,
    getRegisterEmailCodeHtml,
    getForgotEmailCodeHtml
} from '../utils/emailer';
import { getCode } from '../utils/math';
import { mailChimpSignup } from '../utils/mailChimp';

var fs = require('fs');

export const isUserPresentInDb = async (email: string) => {
    try {
        const user = await User.findOne({
            where: { email: email }
        });

        const secondaryUser = await SecondaryUser.findOne({
            where: { email: email }
        });

        if (user || secondaryUser) {
            return true;
        }

        return false;
    } catch (err) {
        console.log('Error while checking if user exist in db: ', err);

        return true;
    }
};

export const register = async (req: Request, res: ExtendedResponse) => {
    try {
        if (!res.locals.userInfos) {
            return res
                .status(500)
                .send(
                    'An unexpected error occurred when registering a new user'
                );
        }

        const userInfos = res.locals.userInfos;

        const activateAccountCode = res.locals.activateAccountCode
            ? res.locals.activateAccountCode
            : '8374';

        const newUser = await User.create({
            firstName: userInfos.firstName,
            lastName: userInfos.lastName,
            email: userInfos.email,
            password: userInfos.hashPass,
            activateAccountCode: activateAccountCode,
            isActive: userInfos.isActive
        });

        mailChimpSignup(
            newUser.firstName,
            newUser.lastName,
            newUser.email,
            null,
            null,
            false
        );

        // keep password safe
        newUser.password = '';

        return res.status(201).send('Succefully registered');
    } catch (err) {
        console.log('Error while registrering new user: ', err);

        return res
            .status(500)
            .send('An unexpected error occurred when registering a new user');
    }
};

export const signin = async (req: Request, res: ExtendedResponse) => {
    try {
        if (!res.locals.userInfos) {
            return res
                .status(500)
                .send(
                    'An unexpected error occurred when registering a new user'
                );
        }
        const userInfos = res.locals.userInfos;

        if (process.env.JWT_ACCESS_SECRET == null) {
            return res.status(500);
        }

        const accessToken = signToken(
            { email: userInfos.email, iat: Math.floor(Date.now() / 1000) },
            process.env.JWT_ACCESS_SECRET,
            `${process.env.JWT_ACCESS_TOKEN_EXPIRES}`
        );
        const refreshToken = signToken(
            { email: userInfos.email, iat: Math.floor(Date.now() / 1000) },
            process.env.JWT_REFRESH_SECRET,
            `${process.env.JWT_REFRESH_TOKEN_EXPIRES}`
        );

        if (accessToken == undefined || refreshToken == undefined) {
            return res
                .status(500)
                .send(
                    'An unexpected error occurred when generating the access token or the refreshtoken'
                );
        }

        await User.update(
            {
                refreshToken: refreshToken
            },
            {
                where: {
                    email: userInfos.email
                }
            }
        );

        const decodedObj = getDecodedPayload(accessToken);

        return res.status(200).json({
            accessToken: accessToken,
            refreshToken: refreshToken,
            accessTokenExp: decodedObj.exp
        });
    } catch (err) {
        console.log('Error while registrering new user: ', err);

        return res
            .status(500)
            .send('An unexpected error occurred when registering a new user');
    }
};

/**
 * @api {post} /user/activateAccount Activate account
 * @apiName Activate account
 * @apiGroup User
 * @apiDescription Activate a new account with a code sent to the user by email
 *
 * @apiHeader {String} Content-Type="application/json" ContentType of the request.
 * @apiHeader {String} Authorization='Bearer accessToken' Authorization mode
 *
 * @apiParam {String} code="1234" Code sent by email
 * @apiParam {String} email="example@gmail.com" User's email
 *
 * @apiSuccess (Success 200) {Number} status 200.
 * @apiSuccess (Success 200) {String} accessToken User access token
 * @apiSuccess (Success 200) {String} refreshToken User refresh token
 * @apiSuccess (Success 200) {String} accessTokenExp Expiration time of the accessToken
 *
 * @apiSuccess (Success 200 (alreadyActive)) {Number} status 200.
 * @apiSuccess (Success 200 (alreadyActive)) {String} This account is already active
 *
 * @apiError (Error 400 (code)) {Number} Status 400.
 * @apiError (Error 400 (code)) {String} code is missing
 *
 * @apiError (Error 400 (invalid)) {Number} Status 400.
 * @apiError (Error 400 (invalid)) {String} error This code is invalid
 *
 */
export const activateAccount = async (
    req: Request,
    res: ExtendedResponse,
    next: NextFunction
) => {
    try {
        const { code, email } = req.body;

        if (!code || !email) {
            res.status(400).send('Code is missing');
        }

        if (typeof code != 'string')
            return res.status(400).send('Code must be of type string');

        let user = await User.findOne({
            where: {
                activateAccountCode: code,
                email: email
            }
        });

        if (!user) return res.status(400).send('Email or code is invalid');

        if (user.isActive)
            return res.status(200).send('This account is already active');

        if (!process.env.JWT_ACCESS_SECRET) return res.status(500);

        const accessToken = signToken(
            {
                email: user.email,
                iat: Math.floor(Date.now() / 1000)
            },
            process.env.JWT_ACCESS_SECRET,
            `${process.env.JWT_ACCESS_TOKEN_EXPIRES}`
        );
        const refreshToken = signToken(
            {
                email: user.email,
                iat: Math.floor(Date.now() / 1000)
            },
            process.env.JWT_REFRESH_SECRET,
            `${process.env.JWT_REFRESH_TOKEN_EXPIRES}`
        );

        if (accessToken == undefined || refreshToken == undefined) {
            return res
                .status(500)
                .send(
                    'An unexpected error occurred when generating the access token or the refreshtoken'
                );
        }

        await User.update(
            {
                isActive: true,
                refreshToken: refreshToken
            },
            {
                where: {
                    activateAccountCode: code,
                    email: email
                }
            }
        );

        const decodedObj = getDecodedPayload(accessToken);

        return res.status(200).json({
            accessToken: accessToken,
            refreshToken: refreshToken,
            accessTokenExp: decodedObj.exp
        });
    } catch (err) {
        return next(err);
    }
};

/**
 * @api {post} /user/resendCodeByEmail Resend email code
 * @apiName Resend email code
 * @apiGroup User
 * @apiDescription Activate a new account with a code sent to the user by email
 *
 * @apiHeader {String} Content-Type="application/json" ContentType of the request.
 * @apiHeader {String} Authorization='Bearer accessToken' Authorization mode
 *
 * @apiSuccess (Success 200) {Number} status 200.
 * @apiSuccess (Success 200) {String} Email has been sent
 *
 */
export const resendCodeByEmail = async (
    req: Request,
    res: ExtendedResponse,
    next: NextFunction
) => {
    try {
        // Check if Authorization header (email:password) is valid.
        const { user } = res.locals;

        let html = await getRegisterEmailCodeHtml(
            user.firstName,
            user.activateAccountCode
        );
        sendMail(
            user.email,
            process.env.NO_REPLY_MAIL!,
            process.env.NO_REPLY_MAIL_PASS!,
            html
        );

        res.status(200).send('Email has been sent');
    } catch (err) {
        return next(err);
    }
};

/**
 * @api {post} /user/signup Register
 * @apiName Register
 * @apiGroup User
 * @apiDescription Register a new user
 *
 * @apiHeader {String} Content-Type="application/json" ContentType of the request.
 * @apiHeader {String} Authorization='Basic dGVzdDQ0QGdtYWlsLmNvbTpiY2Fk' Authorization mode
 *
 * @apiParam {String} firstName="enki" first name
 * @apiParam {String} lastName="corbin" last name
 *
 * @apiSuccess (Success 201) {Number} status 201
 *
 * @apiError (Error 400 (parameter missing)) {Number} Status 400.
 * @apiError (Error 400 (parameter missing)) {String} error email or password or firstName or lastName is missing
 *
 * @apiError (Error 400 (parameter invalid)) {Number} Status 400.
 * @apiError (Error 400 (parameter invalid)) {String} error password is too short
 *
 * @apiError (Error 400 (userExist)) {Number} Status 409.
 * @apiError (Error 400 (userExist)) {String} error User already exist
 *
 */
export const signupWithCredentials = async (
    req: Request,
    res: ExtendedResponse,
    next: NextFunction
) => {
    try {
        // Check if Authorization header (email:password) is valid.
        const { name, pass } = res.locals.credentials; // name is an email

        if (!validator.isEmail(name)) {
            return res.status(400).send('Email is invalid.');
        }
        if (pass.length < 6) {
            return res.status(400).send('Password is too short.');
        }

        // Check if firstName, lastName and type keys are present in req.body
        const { firstName, lastName } = req.body;

        if (!firstName) {
            return res.status(400).send('First name is missing.');
        }
        if (!lastName) {
            return res.status(400).send('Last name is missing.');
        }

        // Check if user in not already in database.
        const userPresent = await isUserPresentInDb(name);
        if (userPresent) {
            return res.status(409).send('User already exist');
        }

        const saltRounds = 10;
        bcrypt.genSalt(saltRounds, function (err, salt) {
            bcrypt.hash(pass, salt, async function (err, hash) {
                res.locals.userInfos = new UserInfos(
                    firstName,
                    lastName,
                    name,
                    '',
                    hash,
                    false
                );
                let code = getCode(4);
                if (code == '') {
                    next(
                        'Error: Code to activate account could not be created'
                    );
                }
                res.locals.activateAccountCode = code;

                let html = await getRegisterEmailCodeHtml(firstName, code);
                sendMail(
                    name,
                    process.env.NO_REPLY_MAIL!,
                    process.env.NO_REPLY_MAIL_PASS!,
                    html
                );

                next();
            });
        });
    } catch (err) {
        return next(err);
    }
};

/**
 * @api {post} /user/signin Signin
 * @apiName Signin
 * @apiGroup User
 * @apiDescription Signup a new user
 *
 * @apiHeader {String} Authorization="Basic email:pass" Authorisation mode
 * @apiHeader {String} Content-Type="application/json" ContentType of the request.
 *
 * @apiParam {String} firstName="enki" first name
 * @apiParam {String} lastName="corbin" last name
 *
 * @apiSuccess (Success 200) {Number} status 200.
 * @apiSuccess (Success 200) {String} accessToken User access token
 * @apiSuccess (Success 200) {String} refreshToken User refresh token
 * @apiSuccess (Success 200) {String} accessTokenExp Expiration time of the accessToken
 *
 * @apiError (Error 401 (auth)) {Number} Status 401.
 * @apiError (Error 401 (auth)) {String} error Missing Authorization header with Basic
 *
 * @apiError (Error 400 (parameter missing)) {Number} Status 400.
 * @apiError (Error 400 (parameter missing) {String} error first name or last name is missing
 *
 */
export const signinWithCredentials = async (
    req: Request,
    res: ExtendedResponse,
    next: NextFunction
) => {
    try {
        // Check if Authorization header (email:password) is valid.
        const user = res.locals.user;

        res.locals.userInfos = new UserInfos(
            user.firstName,
            user.lastName,
            user.email,
            '',
            user.password,
            user.isActive
        );
        next();
    } catch (err) {
        return next(err);
    }
};

/**
 * @api {post} /user/secondaryUser Add secondary user
 * @apiName Add secondary user
 * @apiGroup User
 * @apiDescription Add a new secondary user
 *
 * @apiHeader {String} Authorization="Bearer accessToken" Authorisation mode
 * @apiHeader {String} Content-Type="application/json" ContentType of the request.
 *
 * @apiParam {String} firstName="enki" first name
 * @apiParam {String} lastName="corbin" last name
 * @apiParam {String} email="enki@gmail.com" email
 *
 * @apiSuccess (Success 201) {Number} status 201.
 * @apiSuccess (Success 201) {String} accessToken User access token
 * @apiSuccess (Success 201) {String} refreshToken User refresh token
 * @apiSuccess (Success 201) {String} accessTokenExp Expiration time of the accessToken
 *
 * @apiError (parameter missing) {Number} Status 400.
 * @apiError (parameter missing) {String} error email or first name or last name is missing
 *
 * @apiError (Error 403 (noUserFound)) {Number} Status 403.
 * @apiError (Error 403 (noUserFound)) {String} error Email or password does not match, or the account with this email does not exist
 *
 */
export const addSecondaryUser = async (
    req: Request,
    res: ExtendedResponse,
    next: NextFunction
) => {
    try {
        const { user } = res.locals;
        const {
            firstName,
            lastName,
            email
        }: {
            firstName: string;
            lastName: string;
            email: string;
        } = req.body;

        if (!firstName) {
            return res.status(400).send('First name is missing.');
        }
        if (!lastName) {
            return res.status(400).send('Last name is missing.');
        }
        if (!email) {
            return res.status(400).send('Email is missing.');
        }

        if (!validator.isEmail(email)) {
            return res.status(400).send('Email is invalid.');
        }

        // Check if user in not already in database.
        const userPresent = await isUserPresentInDb(email);
        if (userPresent) {
            return res.status(409).send('User already exist');
        }

        const secondaryUser = await user.createSecondaryUser({
            firstName,
            lastName,
            email
        });

        return res.status(201).json(secondaryUser);
    } catch (err) {
        return next(err);
    }
};

/**
 * @api {get} /user/secondaryUser Get secondary users
 * @apiName Get secondary users
 * @apiGroup User
 * @apiDescription Get all the secondary users
 *
 * @apiHeader {String} Authorization="Bearer accessToken" Authorisation mode
 * @apiHeader {String} Content-Type="application/json" ContentType of the request.
 *
 * @apiSuccess (Success 200) {Number} status 200.
 * @apiSuccess (Success 200) {json} success-response: {
 *      [<br/>
 *          { id: 1, "firstName": "Enki", "lastName": "Corbin", "email": "enki@gmail.com", [...] }<br/>
 *          { id: 2, "firstName": "Mathis", "lastName": "Calonnec", "email": "Mathis@gmail.com", [...] }<br/>
 *          { id: 3, "firstName": "Thibaut", "lastName": "Rassouli", "email": "Thibaut@gmail.com", [...] }<br/>
 *       ]
 * }
 *
 * @apiError (Error 403 (NoAccessToken)) {Number} status 403
 * @apiError (Error 403 (NoAccessToken)) {String} error Token payload is not present
 *
 */

export const getSecondaryUsers = async (
    req: Request,
    res: ExtendedResponse,
    next: NextFunction
) => {
    try {
        const { user } = res.locals;

        user.password = '';

        const secondaryUsers = await user.getSecondaryUsers();

        return res.status(200).json(secondaryUsers);
    } catch (err) {
        next(err);
    }
};

/**
 * @api {post} /user/updateNames/:id? Update names
 * @apiName Update names
 * @apiGroup User
 * @apiDescription Update the firstname and the lastname of the user or, if an id is provided, update the secondary user.
 *
 * @apiHeader {String} Authorization="Basic email:pass" Authorisation mode
 * @apiHeader {String} Content-Type="application/json" ContentType of the request.
 *
 * @apiParam {String} firstName="enki" first name
 * @apiParam {String} lastName="corbin" last name
 *
 * @apiSuccess (Success 201) {Number} status 201.
 * @apiSuccess (Success 201) {String} User profile succefully updated
 *
 * @apiError (parameter missing) {Number} Status 400.
 * @apiError (parameter missing)) {String} error firstname or lastname is missing
 *
 * @apiError (Error 403 (NoAccessToken)) {Number} status 403
 * @apiError (Error 403 (NoAccessToken)) {String} error Token payload is not present
 *
 */
export const updateNames = async (
    req: Request,
    res: ExtendedResponse,
    next: NextFunction
) => {
    try {
        const user = res.locals.user;
        const secondaryUser = res.locals.secondaryUser;

        // Check if firstName, lastName and type keys are present in req.body
        const { firstName, lastName } = req.body;

        if (!firstName) {
            return res.status(400).send('First name is missing.');
        }
        if (!lastName) {
            return res.status(400).send('Last name is missing.');
        }

        // If there is a secondary user stored in locals we should modify him
        if (secondaryUser) {
            await SecondaryUser.update(
                {
                    firstName: firstName,
                    lastName: lastName
                },
                {
                    where: {
                        id: Number(req.params.id)
                    }
                }
            );
        } else {
            await User.update(
                {
                    firstName: firstName,
                    lastName: lastName
                },
                {
                    where: {
                        email: user.email
                    }
                }
            );
        }
        // Send his JSON profile to user
        return res.status(201).send('User profile succefully updated');
    } catch (err) {
        return next(err);
    }
};

/**
 * @api {get} /user/me/:id? Get profile
 * @apiName Get profile
 * @apiGroup User
 * @apiDescription Get user's profile or a secondary user profile if an id is provided.
 *
 * @apiHeader {String} Authorization="Bearer accessToken" Authorisation mode
 * @apiHeader {String} Content-Type="application/json" ContentType of the request.
 *
 * @apiSuccess (Success 200) {Number} status 200.
 * @apiSuccess (Success 200) {json} Success-response:
 *      {<br/>
 *          id: 1, "firstName": "Enki", "lastName": "Corbin", "email": "enki@gmail.com", [...]<br/>
 *      }<br/>
 *
 * @apiError (Error 403 (NoAccessToken)) {Number} status 403
 * @apiError (Error 403 (NoAccessToken)) {String} error Could not find user
 *
 * @apiError (Error 403 (NoAccessToken)) {Number} status 403
 * @apiError (Error 403 (NoAccessToken)) {String} error You don't have access to this user
 *
 */

export const getProfile = async (
    req: Request,
    res: ExtendedResponse,
    next: NextFunction
) => {
    try {
        const { user } = res.locals;
        const { secondaryUser } = res.locals;

        console.log('Req ----->', req);

        // keep password safe
        user.password = '';
        user.refreshToken = '';

        // Send his JSON profile to user
        if (secondaryUser) {
            return res.status(200).json(secondaryUser);
        } else {
            return res.status(200).json(user);
        }
    } catch (err) {
        return next(err);
    }
};

/**
 * @api {delete} /user/me/:id? Delete user
 * @apiName Delete user
 * @apiGroup User
 * @apiDescription Delete a user or, if an id is provided, delete the secondary user.
 *
 * @apiHeader {String} Authorization="Bearer accessToken" Authorisation mode
 * @apiHeader {String} Content-Type="application/json" ContentType of the request.
 *
 * @apiSuccess (Success 200) {Number} status 200.
 *
 * @apiError (Error 403 (NoAccessToken)) {Number} status 403
 * @apiError (Error 403 (NoAccessToken)) {String} error Could not find user
 *
 * @apiError (Error 403 (NoAccessToken)) {Number} status 403
 * @apiError (Error 403 (NoAccessToken)) {String} error You don't have access to this user
 *
 */
export const deleteProfile = async (
    req: Request,
    res: ExtendedResponse,
    next: NextFunction
) => {
    try {
        const { user } = res.locals;
        const { secondaryUser } = res.locals;

        if (secondaryUser) {
            await secondaryUser.destroy();
        } else {
            await user.destroy();
        }

        return res.sendStatus(200);
    } catch (err) {
        return next(err);
    }
};

/**
 * @api {post} /user/addMutual/:id? Update mutual
 * @apiName Update mutual
 * @apiGroup User
 * @apiDescription Update the mutual of the user or, if an id is provided, update the secondary user.
 *
 * @apiHeader {String} Authorization="Bearer accessToken" Authorisation mode
 * @apiHeader {String} Content-Type="application/json" ContentType of the request.
 *
 * @apiParam {Number} amc=12345678 Social security number
 * @apiParam {Number} membershipNumber=12345678 Social security number
 * @apiParam {Number} ph2=70 Refund rate 1
 * @apiParam {Number} ph4=80 Refund rate 2
 * @apiParam {Number} ph7=55 Refund rate 3
 * @apiParam {Date} expirationDate="Thu Apr 12 2022" Expiration date
 *
 * @apiSuccess (Success 201) {Number} status 201.
 * @apiSuccess (Success 201) {String} success User profile succefully updated
 *
 * @apiError (Error 403 (NoAccessToken)) {Number} status 403
 * @apiError (Error 403 (NoAccessToken)) {String} error Token payload is not present
 *
 * @apiError (Error 400 (parameter missing)) {Number} Status 400.
 * @apiError (Error 400 (parameter missing)) {String} error amc or membershipNumber or ph2/ph4/ph7 or expDate is missing.
 *
 */
export const addmutual = async (
    req: Request,
    res: ExtendedResponse,
    next: NextFunction
) => {
    try {
        const { user } = res.locals;
        const { secondaryUser } = res.locals;
        const {
            amc,
            membershipNumber,
            ph2,
            ph4,
            ph7,
            expirationDate
        }: {
            amc: number;
            membershipNumber: number;
            ph2: number;
            ph4: number;
            ph7: number;
            expirationDate: Date;
        } = req.body;

        // keep password safe
        user.password = '';

        if (!amc || amc.toString().length != 8) {
            return res.status(400).send('amc is missing or invalid.');
        }
        if (!membershipNumber || membershipNumber.toString().length != 8) {
            return res
                .status(400)
                .send('membershipNumber is missing or invalid.');
        }
        if (!ph2 || ph2.toString().length > 3) {
            return res.status(400).send('ph2 is missing or invalid.');
        }
        if (!ph4 || ph4.toString().length > 3) {
            return res.status(400).send('ph4 is missing or invalid.');
        }
        if (!ph7 || ph7.toString().length > 3) {
            return res.status(400).send('ph7 is missing or invalid.');
        }
        if (!expirationDate) {
            return res.status(400).send('Expiration date is missing.');
        }

        if (secondaryUser) {
            await SecondaryUser.update(
                {
                    mutualAmc: amc,
                    mutualMembershipNumber: membershipNumber,
                    mutualPh2: ph2,
                    mutualPh4: ph4,
                    mutualPh7: ph7,
                    mutualExpirationDate: expirationDate
                },
                {
                    where: {
                        id: Number(req.params.id)
                    }
                }
            );
        } else {
            await User.update(
                {
                    mutualAmc: amc,
                    mutualMembershipNumber: membershipNumber,
                    mutualPh2: ph2,
                    mutualPh4: ph4,
                    mutualPh7: ph7,
                    mutualExpirationDate: expirationDate
                },
                {
                    where: {
                        email: user.email
                    }
                }
            );
        }

        // Send his JSON profile to user
        return res.status(201).send('User profile succefully updated');
    } catch (err) {
        return next(err);
    }
};

/**
 * @api {post} /user/socialSecurityNumber/:id? Update social security number
 * @apiName Update social security number
 * @apiGroup User
 * @apiDescription Update the social security number of the user or, if an id is provided, update the secondary user.
 *
 * @apiHeader {String} Authorization="Bearer accessToken" Authorisation mode
 * @apiHeader {String} Content-Type="application/json" ContentType of the request.
 *
 * @apiParam {String} socialSecurityNumber="123456789123" Social security number
 *
 * @apiSuccess (Success 201) {Number} status 201.
 * @apiSuccess (Success 201) {json} Success-Response: ```{
 *      id: 1, "firstName": "Enki", "lastName": "Corbin", "email": "enki@gmail.com", [...]<br/>
 * }
 * ```
 *
 * @apiError (Error 403 (NoAccessToken)) {Number} status 403
 * @apiError (Error 403 (NoAccessToken)) {String} error Token payload is not present
 *
 * @apiError (Error 400 (parameter invalid)) {Number} Status 400.
 * @apiError (Error 400 (parameter invalid)) {String} error Social security number should be composed of 13 numbers.
 *
 * @apiError (Error 400 (parameter missing)) {Number} Status 400.
 * @apiError (Error 400 (parameter missing)) {String} error Social security number is missing.
 *
 */
export const addSocialSecurityNumber = async (
    req: Request,
    res: ExtendedResponse,
    next: NextFunction
) => {
    try {
        const { user } = res.locals;
        const { secondaryUser } = res.locals;
        const {
            socialSecurityNumber
        }: { socialSecurityNumber: string } = req.body;

        // keep password safe
        user.password = '';

        if (!socialSecurityNumber) {
            return res.status(400).send('Social security number is missing.');
        } else if (socialSecurityNumber.toString().length != 13) {
            return res
                .status(400)
                .send(
                    'Social security number should be composed of 13 numbers.'
                );
        }

        if (secondaryUser) {
            await SecondaryUser.update(
                { socialSecurityNumber: socialSecurityNumber },
                {
                    where: {
                        id: Number(req.params.id)
                    }
                }
            );
        } else {
            await User.update(
                { socialSecurityNumber: socialSecurityNumber },
                {
                    where: {
                        email: user.email
                    }
                }
            );
        }

        // Send his JSON profile to user
        return res.status(201).json(user);
    } catch (err) {
        return next(err);
    }
};

/**
 * @api {post} /user/phoneNumber/:id? Update phone number
 * @apiName Update phone number
 * @apiGroup User
 * @apiDescription Update the phone number of the user or, if an id is provided, update the secondary user.
 *
 * @apiHeader {String} Authorization="Bearer accessToken" Authorisation mode
 * @apiHeader {String} Content-Type="application/json" ContentType of the request.
 *
 * @apiParam {String} phoneNumber="0606060606" User's phone number
 *
 * @apiSuccess (Success 201) {Number} status 201.
 * @apiSuccess (Success 201) {json} Success-Response: ```{
 *      id: 1, "firstName": "Enki", "lastName": "Corbin", "email": "enki@gmail.com", [...]<br/>
 * }
 *```
 * @apiError (Error 403 (NoAccessToken)) {Number} status 403
 * @apiError (Error 403 (NoAccessToken)) {String} error Token payload is not present
 *
 * @apiError (Error 400 (parameter missing)) {Number} Status 400.
 * @apiError (Error 400 (parameter missing)) {String} error phone number is missing
 *
 */
export const addPhoneNumber = async (
    req: Request,
    res: ExtendedResponse,
    next: NextFunction
) => {
    try {
        const { user } = res.locals;
        const { secondaryUser } = res.locals;
        const { phoneNumber }: { phoneNumber: string } = req.body;

        // keep password safe
        user.password = '';

        if (!phoneNumber) {
            return res
                .status(400)
                .send('Phone number is missing or invalid.');
        }

        if (secondaryUser) {
            await SecondaryUser.update(
                { phoneNumber: phoneNumber },
                {
                    where: {
                        id: Number(req.params.id)
                    }
                }
            );
        } else {
            await User.update(
                { phoneNumber: phoneNumber },
                {
                    where: {
                        email: user.email
                    }
                }
            );
        }

        return res.status(201).send('Phone number succefully added.');
    } catch (err) {
        return next(err);
    }
};

/**
 * @api {post} /user/preferedPharmacy Add prefered pharmacy
 * @apiName Add prefered pharmacy
 * @apiGroup User
 * @apiDescription Update the prefered pharmacy of the user or, if an id is provided, update the secondary user.
 *
 * @apiHeader {String} Authorization="Bearer accessToken" Authorisation mode
 * @apiHeader {String} Content-Type="application/json" ContentType of the request.
 *
 * @apiParam {String} pharmacyAddress="98 R JOLIOT CURIE 168 44 LOIRE ATLANTIQUE" User's prefered pharmacy
 *
 * @apiSuccess (Success 201) {Number} status 201.
 * @apiSuccess (Success 201) {String} success Favorite pharmacy succefully updated.
 *
 * @apiError (Error 403 (NoAccessToken)) {Number} status 403
 * @apiError (Error 403 (NoAccessToken)) {String} error Token payload is not present
 *
 * @apiError (Error 400 (pharmacyNotFound)) {Number} Status 400.
 * @apiError (Error 400 (pharmacyNotFound)) {String} error There is no pharmacy with this address.
 *
 */
export const addFavoritePharmacy = async (
    req: Request,
    res: ExtendedResponse,
    next: NextFunction
) => {
    try {
        const { user } = res.locals;
        const { pharmacyAddress }: { pharmacyAddress: string } = req.body;

        // keep password safe
        user.password = '';

        const pharmacy = await Pharmacy.findOne({
            where: { address: pharmacyAddress }
        });

        if (!pharmacy) {
            return res
                .status(400)
                .send('There is no pharmacy with this address.');
        }

        await User.update(
            {
                preferedPharmacyAddr: pharmacy.address,
                preferedPharmacyAddrName: pharmacy.name
            },
            {
                where: {
                    email: user.email
                }
            }
        );

        // Send his JSON profile to user
        return res.status(201).send('Favorite pharmacy succefully updated.');
    } catch (err) {
        return next(err);
    }
};

/**
 * @api {post} /user/addProfilPicture Add profile picture
 * @apiName Add profile picture
 * @apiGroup User
 * @apiDescription Update the profile picture of the user or, if an id is provided, update the secondary user.
 *
 * @apiHeader {String} Authorization="Bearer accessToken" Authorisation mode
 * @apiHeader {String} Content-Type="application/json" ContentType of the request.
 *
 * @apiParam {String} data="qsldkfjqlksjdflmkjqsfd" Datas of the profile picture
 *
 * @apiSuccess (Success 201) {Number} status 201.
 * @apiSuccess (Success 201) {String} success Upload file sucess
 *
 * @apiError (Error 403 (NoAccessToken)) {Number} status 403
 * @apiError (Error 403 (NoAccessToken)) {String} error Token payload is not present
 *
 * @apiError (Error 400 (invalidDatas)) {Number} Status 400.
 * @apiError (Error 400 (invalidDatas)) {String} error Picture datas are missing or invalid.
 *
 */
export const uploadProfilPicture = async (
    req: Request,
    res: ExtendedResponse,
    next: NextFunction
) => {
    try {
        const secondaryUser = res.locals.secondaryUser;
        var url = '';

        console.log('Req ----->', req);

        const storage = multer.diskStorage({
            destination: function (req, file, cb) {
                cb(null, './uploads');
            },
            filename: function (req, file, cb) {
                url =
                    new Date().toISOString() +
                    file.originalname.split(' ').join('');
                cb(null, url);
            }
        });

        const fileFilter = (req: any, file: any, cb: any) => {
            if (
                file.mimetype === 'image/jpeg' ||
                file.mimetype === 'image/jpg' ||
                file.mimetype === 'image/png'
            ) {
                cb(null, true);
            } else {
                console.log('Image uploaded is not of type jpg/jpeg or png');
                cb(
                    new Error('Image uploaded is not of type jpg/jpeg or png'),
                    false
                );
            }
        };

        const upload = multer({
            storage: storage,
            fileFilter: fileFilter
        }).single('image');

        upload(req, res, (error: any) => {
            if (error)
                return res.status(500).send('Error from multer: ' + error);

            if (secondaryUser) {
                SecondaryUser.update(
                    { profilPictureUrl: './uploads/' + url },
                    {
                        where: {
                            id: Number(req.params.id)
                        }
                    }
                );
            } else {
                User.update(
                    { profilPictureUrl: './uploads/' + url },
                    {
                        where: {
                            email: res.locals.user.email
                        }
                    }
                );
            }
            return res.status(201).send('profil picture uploaded');
        });
    } catch (err) {
        console.log(err);
        return next(err);
    }
};

/**
 * @api {get} /user/getProfilPicture Get profile picture
 * @apiName Get profile picture
 * @apiGroup User
 * @apiDescription Get the profile picture of the user or, if an id is provided, update the secondary user.
 *
 * @apiHeader {String} Authorization="Bearer accessToken" Authorisation mode
 * @apiHeader {String} Content-Type="application/json" ContentType of the request.
 *
 * @apiSuccess (Success 201) {Number} status 201.
 * @apiSuccess (Success 201) {Json} success-response: {
 *      "id": 1, "type": "jpg", "data": "qsldkfjqlksjdflmkjqsfd"<br/>
 * }
 *
 * @apiError (Error 403 (NoAccessToken)) {Number} status 403
 * @apiError (Error 403 (NoAccessToken)) {String} error Token payload is not present
 *
 */
export const getProfilPicture = async (
    req: Request,
    res: ExtendedResponse,
    next: NextFunction
) => {
    try {
        const { user } = res.locals;
        const secondaryUser = res.locals.secondaryUser;
        var filePath: string = '';

        if (secondaryUser) {
            if (!secondaryUser.profilPictureUrl) {
                return res
                    .status(400)
                    .send(
                        'This Secondary user does not have a profile picture'
                    );
            }
            filePath = secondaryUser.profilPictureUrl;
        } else {
            if (!user.profilPictureUrl) {
                return res
                    .status(400)
                    .send('This user does not have a profile picture');
            }
            filePath = user.profilPictureUrl;
        }

        if (!filePath || filePath == './uploads/') {
            return res.status(404).send("This user don't have profile picture");
        }

        return res.download(filePath);
    } catch (err) {
        return next(err);
    }
};

export const deleteProfilPicture = async (
    req: Request,
    res: ExtendedResponse,
    next: NextFunction
) => {
    try {
        const { user } = res.locals;
        const secondaryUser = res.locals.secondaryUser;

        if (secondaryUser) {
            if (!secondaryUser.profilPictureUrl) {
                return res
                    .status(400)
                    .send(
                        'This secondary user does not have a profile picture'
                    );
            }
            var filePath = secondaryUser.profilPictureUrl;
            fs.unlinkSync(filePath);

            SecondaryUser.update(
                { profilPictureUrl: '' },
                {
                    where: {
                        id: Number(req.params.id)
                    }
                }
            );
        } else {
            if (!user.profilPictureUrl) {
                return res
                    .status(400)
                    .send('This user does not have a profile picture');
            }
            var filePath = user.profilPictureUrl;
            fs.unlinkSync(filePath);

            User.update(
                { profilPictureUrl: '' },
                {
                    where: {
                        email: res.locals.user.email
                    }
                }
            );
        }
        return res.status(204).send('Prescription has been destroyed');
    } catch (err) {
        return next(err);
    }
};

export const addAvatarID = async (
    req: Request,
    res: ExtendedResponse,
    next: NextFunction
) => {
    try {
        const { user } = res.locals;
        const { secondaryUser } = res.locals;
        const { avatarId }: { avatarId: number } = req.body;

        // keep password safe
        user.password = '';

        if (!avatarId) {
            return res
                .status(400)
                .send('Avatar picture ID is missing or invalid.');
        }

        if (secondaryUser) {
            await SecondaryUser.update(
                { avatarId: avatarId },
                {
                    where: {
                        id: Number(req.params.id)
                    }
                }
            );
        } else {
            await User.update(
                { avatarId: avatarId },
                {
                    where: {
                        email: user.email
                    }
                }
            );
        }

        return res.status(201).send('Avatar picture ID succefully added.');
    } catch (err) {
        return next(err);
    }
};


/**
 * @api {get} /user/tutorialSeen Get tutorial seen
 * @apiName Get tutorial seen
 * @apiGroup User
 * @apiDescription Get the value of the variable tutorialSeen of the user or, if an id is provided, update the secondary user.
 *
 * @apiHeader {String} Authorization="Bearer accessToken" Authorisation mode
 * @apiHeader {String} Content-Type="application/json" ContentType of the request.
 *
 * @apiSuccess (Success 200) {Number} status 200.
 * @apiSuccess (Success 200) {Json} success-response: ```{
 *      "hasbeenSeen": true<br/>
 * }
 *```
 * @apiError (Error 403 (NoAccessToken)) {Number} status 403
 * @apiError (Error 403 (NoAccessToken)) {String} error Token payload is not present
 *
 */

export const tutorialSeen = async (
    req: Request,
    res: ExtendedResponse,
    next: NextFunction
) => {
    try {
        const { user } = res.locals;

        return res.status(200).json({ hasBeenSeen: user.tutorialSeen });
    } catch (err) {
        return next(err);
    }
};

/**
 * @api {post} /user/setTutorialSeen Set tutorial seen
 * @apiName Set tutorial seen
 * @apiGroup User
 * @apiDescription Set the value of the variable tutorialSeen of the user or, if an id is provided, update the secondary user.
 *
 * @apiHeader {String} Authorization="Bearer accessToken" Authorisation mode
 * @apiHeader {String} Content-Type="application/json" ContentType of the request.
 *
 * @apiParam {Boolean} seen=true Tuto seen value
 *
 * @apiSuccess (Success 201) {Number} status 200.
 * @apiSuccess (Success 201) {String} Tutorial state has been set to true
 *
 * @apiError (Error 403 (NoAccessToken)) {Number} status 403
 * @apiError (Error 403 (NoAccessToken)) {String} error Token payload is not present
 *
 * @apiError (Error 400 (seen)) {Number} status 403
 * @apiError (Error 400 (seen)) {String} error Token payload is not present
 *
 */
export const setTutorialSeen = async (
    req: Request,
    res: ExtendedResponse,
    next: NextFunction
) => {
    try {
        const { user } = res.locals;
        const { seen }: { seen: boolean } = req.body;

        if (!seen) {
            res.status(400).send('Variable seen is missing');
        }

        user.update({
            tutorialSeen: seen
        });

        return res.status(200).send('Tutorial state has been set to ' + seen);
    } catch (err) {
        return next(err);
    }
};

/**
 * @api {post} /user/forgotPassword forgot Password
 * @apiName forgot Password
 * @apiGroup User
 * @apiDescription Send a code by email to change the password
 *
 * @apiHeader {String} Content-Type="application/json" ContentType of the request.
 * @apiHeader {String} Authorization='No Auth' Authorization mode
 *
 * @apiParam {String} email="example@gmail.com" User's email
 *
 * @apiSuccess (Success 200) {Number} status 200.
 * @apiSuccess (Success 200) {String} Email has been sent
 *
 * @apiError (Error 400 (code)) {Number} Status 400.
 * @apiError (Error 400 (code)) {String} code is missing
 *
 * @apiError (Error 400 (code)) {Number} Status 400.
 * @apiError (Error 400 (code)) {String} Email is missing
 *
 * @apiError (Error 400 (invalid)) {Number} Status 400.
 * @apiError (Error 400 (invalid)) {String} error This code is invalid
 *
 */
export const forgotPassword = async (
    req: Request,
    res: ExtendedResponse,
    next: NextFunction
) => {
    try {
        const { email } = req.body;

        if (!email) {
            res.status(400).send('Code is missing');
        }
        let user = await User.findOne({
            where: {
                email: email
            }
        });
        if (!user) return res.status(400).send('Email is invalid');

        let code = getCode(4);
        if (code == '') {
            next('Error: Code to activate account could not be created');
        }

        await User.update(
            {
                activateAccountCode: code
            },
            {
                where: {
                    email: email
                }
            }
        );

        let html = await getForgotEmailCodeHtml(user.firstName, code);
        sendMail(
            email,
            process.env.NO_REPLY_MAIL!,
            process.env.NO_REPLY_MAIL_PASS!,
            html
        );

        res.status(200).send('Email has been sent');
    } catch (err) {
        return next(err);
    }
};

/**
 * @api {post} /user/changePassword Change Password
 * @apiName Change Password
 * @apiGroup User
 * @apiDescription Change the password after call forgotPassword
 *
 * @apiHeader {String} Content-Type="application/json" ContentType of the request.
 * @apiHeader {String} Authorization='No Auth' Authorization mode
 *
 * @apiParam {String} code="1234" Code sent by email
 * @apiParam {String} email="example@gmail.com" User's email
 * @apiParam {String} pass="passwordExemple" New password
 *
 * @apiSuccess (Success 200) {Number} status 200.
 * @apiSuccess (Success 200) {String} Password has been changed
 *
 * @apiError (Error 400 (code)) {Number} Status 400.
 * @apiError (Error 400 (code)) {String} code is missing
 *
 * @apiError (Error 400 (code)) {Number} Status 400.
 * @apiError (Error 400 (code)) {String} Email is missing
 *
 * @apiError (Error 400 (code)) {Number} Status 400.
 * @apiError (Error 400 (code)) {String} Pass is missing
 *
 * @apiError (Error 400 (code)) {Number} Status 400.
 * @apiError (Error 400 (code)) {String} Password is to short
 *
 * @apiError (Error 400 (invalid)) {Number} Status 400.
 * @apiError (Error 400 (invalid)) {String} error This code is invalid
 *
 */
export const changePassword = async (
    req: Request,
    res: ExtendedResponse,
    next: NextFunction
) => {
    try {
        const { code, email, pass } = req.body;

        if (!code) {
            res.status(400).send('Code is missing');
        }
        if (!email) {
            res.status(400).send('Email is missing');
        }
        if (!pass) {
            res.status(400).send('Pass is missing');
        }
        if (pass.length < 6) {
            return res.status(400).send('Password is too short.');
        }

        if (typeof code != 'string')
            return res.status(400).send('Code must be of type string');

        let user = await User.findOne({
            where: {
                activateAccountCode: code,
                email: email
            }
        });
        if (!user) return res.status(400).send('Email or code is invalid');

        const saltRounds = 10;
        bcrypt.genSalt(saltRounds, function (err, salt) {
            bcrypt.hash(pass, salt, async function (err, hash) {
                console.log(hash);
                await User.update(
                    {
                        password: hash
                    },
                    {
                        where: {
                            email: email
                        }
                    }
                );
                next();
            });
        });
        res.status(200).send('Password has been changed');
    } catch (err) {
        return next(err);
    }
};
