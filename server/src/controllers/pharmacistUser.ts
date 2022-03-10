import { Request, NextFunction } from 'express';
import validator from 'validator';
import bcrypt from 'bcrypt';

import { ExtendedResponse } from '../types/Response';
import PharmacistUser from '../models/PharmacistUser';
import Pharmacy from '../models/Pharmacy';
import { signToken, getDecodedPayload } from '../JWTUtils/tokens';
import Prescription from '../models/Prescription';
import { sendMail, getRegisterEmailCodeHtml } from '../utils/emailer';
import { getCode } from '../utils/math';
import { mailChimpSignup } from '../utils/mailChimp';

/**
 * @api {post} /pharmacies/activateAccount Activate pharmacist account
 * @apiName Activate pharmacist account
 * @apiGroup PharmaUser
 * @apiDescription Activate a new account with a code sent to the user by email
 *
 * @apiHeader {String} Content-Type="application/json" ContentType of the request.
 * @apiHeader {String} Authorization='Bearer accessToken' Authorization mode
 *
 * @apiParam {String} code="1234" Code sent by email
 *
 * @apiSuccess (Success 200) {Number} status 200.
 * @apiSuccess (Success 200) {String} accessToken User access token
 * @apiSuccess (Success 200) {String} refreshToken User refresh token
 * @apiSuccess (Success 200) {String} accessTokenExp Expiration time of the accessToken
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
        // Check if Authorization header (email:password) is valid.
        const { code, email } = req.body;

        if (!code || !email) {
            res.status(400).send('Code is missing');
        }

        let pharmaUser = await PharmacistUser.findOne({
            where: {
                activateAccountCode: code,
                email: email
            }
        });

        if (!pharmaUser)
            return res.status(400).send('Email or code is invalid');

        if (pharmaUser.isActive)
            return res.status(200).send('This account is already active');

        if (!process.env.JWT_ACCESS_SECRET) {
            return res.status(500);
        } else {
            console.log('Access token exist: ' + process.env.JWT_ACCESS_SECRET);
        }

        const accessToken = signToken(
            {
                email: pharmaUser.email,
                iat: Math.floor(Date.now() / 1000)
            },
            process.env.JWT_ACCESS_SECRET,
            `${process.env.JWT_ACCESS_TOKEN_EXPIRES}`
        );
        const refreshToken = signToken(
            {
                email: pharmaUser.email,
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

        await PharmacistUser.update(
            {
                isActive: true,
                refreshToken: refreshToken
            },
            {
                where: {
                    email: pharmaUser.email
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
 * @api {post} /pharmacies/resendCodeByEmail Resend email code for pharmacist
 * @apiName Resend email code for pharmacist
 * @apiGroup PharmaUser
 * @apiDescription Activate a new account with a code sent to the user by email
 *
 * @apiHeader {String} Content-Type="application/json" ContentType of the request.
 * @apiHeader {String} Authorization='Bearer accessToken' Authorization mode
 *
 * @apiSuccess (Success 201) {Number} status 200.
 * @apiSuccess (Success 201) {String} Email has been sent
 *
 */
export const resendCodeByEmail = async (
    req: Request,
    res: ExtendedResponse,
    next: NextFunction
) => {
    try {
        // Check if Authorization header (email:password) is valid.
        const { pharmaUser } = res.locals;

        let html = await getRegisterEmailCodeHtml(
            pharmaUser.firstName,
            pharmaUser.activateAccountCode
        );
        sendMail(
            pharmaUser.email,
            process.env.NO_REPLY_MAIL!,
            process.env.NO_REPLY_MAIL_PASS!,
            html
        );

        res.status(200).send('Email has been sent');
    } catch (err) {
        return next(err);
    }
};

export const pharmacistSignup = async (
    req: Request,
    res: ExtendedResponse,
    next: NextFunction
) => {
    try {
        // Check if Authorization header (email:password) is valid.
        const { name, pass } = res.locals.credentials; // name is an email
        const { firstName, lastName, phoneNumber, addressPharma } = req.body;

        if (!validator.isEmail(name)) {
            return res.status(400).send('Email is invalid.');
        }
        if (pass.length < 6) {
            return res.status(400).send('Password is too short.');
        }
        if (!firstName) {
            return res.status(400).send('First name is missing.');
        }
        if (!lastName) {
            return res.status(400).send('Last name is missing.');
        }
        if (!phoneNumber) {
            return res.status(400).send('number is missing.');
        }
        const adresseFinesse = await Pharmacy.findOne({
            where: { address: addressPharma }
        });
        if (!adresseFinesse) {
            return res.status(400).send('adresse does not exist');
        }
        // Check if this adresse aleardy exist.
        const adresseServer = await PharmacistUser.findOne({
            where: { address: addressPharma }
        });
        if (adresseServer) {
            return res.status(409).send('adresse already used');
        }
        // Check if user in not already in database.
        const pharmaUser = res.locals.pharmaUser;

        if (pharmaUser) {
            return res.status(409).send('User already exist');
        }
        const saltRounds = 10;
        bcrypt.genSalt(saltRounds, function (err, salt) {
            bcrypt.hash(pass, salt, async function (err, hash) {
                // Store valid user in database
                let code = getCode(4);
                if (code == '') {
                    next(
                        'Error: Code to activate account could not be created'
                    );
                }

                let html = await getRegisterEmailCodeHtml(firstName, code);
                sendMail(
                    name,
                    process.env.NO_REPLY_MAIL!,
                    process.env.NO_REPLY_MAIL_PASS!,
                    html
                );

                const newUser = await PharmacistUser.create({
                    lastName: lastName,
                    firstName: firstName,
                    address: addressPharma,
                    phoneNumber: phoneNumber,
                    email: name,
                    password: hash,
                    activateAccountCode: code
                });

                mailChimpSignup(
                    newUser.firstName,
                    newUser.lastName,
                    newUser.email,
                    phoneNumber,
                    newUser.address,
                    true
                );

                // keep password safe
                newUser.password = '';

                return res.status(201).send('PharmcistUser succefully created');
            });
        });
    } catch (err) {
        console.log(err);
        return next(err);
    }
};

/**
 * @api {post} /pharmacies/signup Register
 * @apiName Register Pharma User
 * @apiGroup Pharmacist User
 * @apiDescription Register a new Pharmacist
 *
 * @apiHeader {String} Authorization='Basic email+pwd' Authorization mode
 * @apiHeader {String} Content-Type="application/json" ContentType of the request.
 *
 * @apiParam {String} firstName="enki" first name
 * @apiParam {String} lastName="corbin" last name
 * @apiParam {String} PhoneNumber="0298463748" phone number of the pharmacy
 * @apiParam {String} adressePharma="3 rue de brest" adresse of the pharmacy
 *
 * @apiSuccess (Success 201) {Number} status 201.
 * @apiSuccess (Success 201) {String} accessToken pharmacist access token
 * @apiSuccess (Success 201) {String} refreshToken pharmacist refresh token
 * @apiSuccess (Success 201) {String} accessTokenExp Expiration time of the accessToken
 *
 * @apiError (Error 400 (email)) {Number} Status 400.
 * @apiError (Error 400 (email)) {String} error Email is invalid
 *
 * @apiError (Error 400 (password)) {Number} Status 400.
 * @apiError (Error 400 (password)) {String} error Password is too short
 *
 * @apiError (Error 400 (firstName)) {Number} Status 400.
 * @apiError (Error 400 (firstName)) {String} error First name is missing
 *
 * @apiError (Error 400 (lastName)) {Number} Status 400.
 * @apiError (Error 400 (lastName)) {String} error Last name is missing
 *
 * @apiError (Error 400 (adressepharma)) {Number} Status 400.
 * @apiError (Error 400 (adressepharma)) {String} dresse does not exist
 *
 * @apiError (Error 409 (userExist)) {Number} Status 409.
 * @apiError (Error 409 (userExist)) {String} error User already exist
 *
 * @apiError (Error 409 (adressPharma)) {Number} Status 409.
 * @apiError (Error 409 (adressPharma)) {String} error adresse Pharmacist already exist
 *
 *
 * @apiError (Error 500 (Token)) {Number} Status 500.
 * @apiError (Error 500 (Token)) {String} An unexpected error occurred when generating the access token or the refreshtoken
 *
 */

export const updatePharmaName = async (
    req: Request,
    res: ExtendedResponse,
    next: NextFunction
) => {
    try {
        const { pharmaUser } = res.locals;
        // Check if firstName, lastName and type keys are present in req.body
        const { firstName, lastName } = req.body;

        if (!firstName) {
            return res.status(400).send('First name is missing.');
        }
        if (!lastName) {
            return res.status(400).send('Last name is missing.');
        }

        await PharmacistUser.update(
            {
                firstName: firstName,
                lastName: lastName
            },
            {
                where: {
                    email: pharmaUser.email
                }
            }
        );
        // Send his JSON profile to user
        return res.status(201).send('User Pharmacy profile succefully updated');
    } catch (err) {
        return next(err);
    }
};

/**
 * @api {post} /pharmacies/updatePharmaUser Update Pharmacist User name
 * @apiName Update Pharma User
 * @apiGroup Pharmacist User
 * @apiDescription Update a new Pharmacist
 *
 * @apiHeader {String} Content-Type="application/json" ContentType of the request.
 * @apiHeader {String} Authorization='Basic email+pwd' Authorization mode
 *
 * @apiParam {String} firstName="enki" first name
 * @apiParam {String} lastName="corbin" last name
 * @apiParam {String} Email=" enki.corbin@test.fr" last name
 *
 * @apiSuccess (Success 201) {Number} status 201.
 *
 * @apiError (Error 401 (auth)) {Number} Status 401.
 * @apiError (Error 401 (auth)) {String} error Missing Authorization header with Basic
 *
 * @apiError (Error 400 (FirstName)) {Number} Status 400.
 * @apiError (Error 400 (firstName)) {String} First name is missing.
 *
 * @apiError (Error 400 (lastName)) {Number} Status 400.
 * @apiError (Error 400 (lastName)) {String} Last name is missing.
 *
 */

export const getPharmaProfile = async (
    req: Request,
    res: ExtendedResponse,
    next: NextFunction
) => {
    try {
        const { pharmaUser } = res.locals;

        // keep password safe
        pharmaUser.password = '';

        if (!pharmaUser) return res.status(400).send('User can t get find');

        // Send his JSON profile to user
        return res.status(200).json(pharmaUser);
    } catch (err) {
        return next(err);
    }
};

/**
 * @api {get} /pharmacies/getUserPharmacist Get profile
 * @apiName Get profile Pharma User
 * @apiGroup Pharmacist User
 * @apiDescription Get Pharmacist User's profile.
 *
 * @apiHeader {String} Authorization="Bearer accessToken" Authorisation mode
 * @apiHeader {String} Content-Type="application/json" ContentType of the request.
 *
 * @apiSuccess (Success 200) {Number} status 200.
 * @apiSuccess (Success 200) {json} Success-response:
 *      {
 *          "firstName": "Enki", "lastName": "Corbin", "email": "enki@gmail.com", "adresse": "Adresse de la pharmacie" [...]
 *      }
 *
 * @apiError (Error 401 (auth)) {Number} Status 401.
 * @apiError (Error 401 (auth)) {String} error Missing Authorization header with Basic
 *
 * @apiError (Error 400 (NoAccessToken)) {Number} status 400
 * @apiError (Error 400 (NoAccessToken)) {String} error Could not find Pharmacist User
 *
 * @apiError (Error 403 (NoAccessToken)) {Number} status 403
 * @apiError (Error 403 (NoAccessToken)) {String} error You don't have access to this Pharmacist User
 *
 */

export const deletePharmaProfile = async (
    req: Request,
    res: ExtendedResponse,
    next: NextFunction
) => {
    try {
        const { pharmaUser } = res.locals;
        // delete pharmaUser from database
        await pharmaUser.destroy();

        return res.sendStatus(200);
    } catch (err) {
        return next(err);
    }
};

/**
 * @api {delete} /pharmacies/deleteAccount Delete Pharmacist user
 * @apiName Delete Pharmacist user
 * @apiGroup Pharmacist User
 * @apiDescription Delete a Pharmacist user.
 *
 * @apiHeader {String} Authorization="Bearer accessToken" Authorisation mode
 * @apiHeader {String} Content-Type="application/json" ContentType of the request.
 *
 * @apiSuccess (Success 200) {Number} status 200.
 *
 * @apiError (Error 401 (auth)) {Number} Status 401.
 * @apiError (Error 401 (auth)) {String} error Missing Authorization header with Basic
 *
 * @apiError (Error 403 (Bad AccessToken)) {Number} status 403
 * @apiError (Error 403 (Bad AccessToken)) {String} error Could not find Pharmacist user
 *
 * @apiError (Error 403 (NoAccessToken)) {Number} status 403
 * @apiError (Error 403 (NoAccessToken)) {String} error You don't have access to this Pharmacist user
 *
 */

export const updatePharmaPhoneNumber = async (
    req: Request,
    res: ExtendedResponse,
    next: NextFunction
) => {
    try {
        const { pharmaUser } = res.locals;
        const { phoneNumber }: { phoneNumber: string } = req.body;

        // keep password safe
        pharmaUser.password = '';

        if (!phoneNumber) {
            return res
                .status(400)
                .send('Phone number number is missing or invalid.');
        }

        let userDb = await PharmacistUser.findOne({
            where: {
                email: pharmaUser.email
            }
        });

        if (!userDb) {
            return res.status(400).send('No user found');
        } else {
            await PharmacistUser.update(
                { phoneNumber: phoneNumber },
                {
                    where: {
                        email: pharmaUser.email
                    }
                }
            );

            return res.status(201).send('Phone number succefully added.');
        }
    } catch (err) {
        return next(err);
    }
};

/**
 * @api {post} /pharmacies/phonePharmaNumber Post Phone number
 * @apiName Post new phone Number for Pharmacist user
 * @apiGroup Pharmacist User
 * @apiDescription Post a Pharmacist user.
 *
 * @apiHeader {String} Authorization="Bearer accessToken" Authorisation mode
 * @apiHeader {String} Content-Type="application/json" ContentType of the request.
 *
 * @apiParam {String} phoneNumber="0298384589" Phone Number

 * 
 * @apiSuccess (Success 200) {Number} status 200.
 * 
 * @apiError (Error 401 (auth)) {Number} Status 401.
 * @apiError (Error 401 (auth)) {String} error Missing Authorization header with Basic
 *
 * @apiError (Error 400 (Phone Number)) {Number} status 400
 * @apiError (Error 400 (Phone Number)) {String} Phone number number is missing or invalid.
 *
 * @apiError (Error 400 (Bad access Token)) {Number} status 400
 * @apiError (Error 400 (Bad access Token)) {String} No user found.
 *
 */

export const signinWithPharmaCredentials = async (
    req: Request,
    res: ExtendedResponse,
    next: NextFunction
) => {
    try {
        // Check if Authorization header (email:password) is valid.
        const user = res.locals.pharmaUser;

        if (process.env.JWT_ACCESS_SECRET == null) {
            return res.status(500);
        }

        const accessToken = signToken(
            { email: user.email, iat: Math.floor(Date.now() / 1000) },
            process.env.JWT_ACCESS_SECRET,
            `${process.env.JWT_ACCESS_TOKEN_EXPIRES}`
        );
        const refreshToken = signToken(
            { email: user.email, iat: Math.floor(Date.now() / 1000) },
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

        await PharmacistUser.update(
            {
                refreshToken: refreshToken
            },
            {
                where: {
                    email: user.email
                }
            }
        );

        const decodedObj = getDecodedPayload(accessToken);

        return res.status(201).json({
            accessToken: accessToken,
            refreshToken: refreshToken,
            accessTokenExp: decodedObj.exp
        });
    } catch (err) {
        return next(err);
    }
};

/**
 * @api {post} /pharmacies/signin Signin
 * @apiName Signin with Pharma user
 * @apiGroup Pharmacist User
 * @apiDescription Signup a new pharmacist
 *
 * @apiHeader {String} Authorization="Basic email:pass" Authorisation mode
 * @apiHeader {String} Content-Type="application/json" ContentType of the request.
 *
 * @apiParam {String} Email="enki.corbain@test.eu" first name
 * @apiParam {String} lastName="corbin" last name
 *
 * @apiSuccess (Success 201) {Number} status 201.
 * @apiSuccess (Success 201) {String} accessToken pharmacist access token
 * @apiSuccess (Success 201) {String} refreshToken pharmacist refresh token
 * @apiSuccess (Success 201) {String} accessTokenExp Expiration time of the accessToken
 *
 * @apiError (Error 401 (auth)) {Number} Status 401.
 * @apiError (Error 401 (auth)) {String} error Missing Authorization header with Basic
 *
 * @apiError (Error 400 (firstName)) {Number} Status 400.
 * @apiError (Error 400 (firstName)) {String} error First name is missing
 *
 * @apiError (Error 400 (lastName)) {Number} Status 400.
 * @apiError (Error 400 (lastName)) {String} error Last name is missing
 *
 * @apiError (Error 500 (lastName)) {Number} Status 500.
 * @apiError (Error 500 (lastName)) {String} An unexpected error occurred when generating the access token or the refreshtoken
 *
 */

//send prescription to the pharmacist account
export const sendPrescription = async (
    req: Request,
    res: ExtendedResponse,
    next: NextFunction
) => {
    try {
        const { pharmaUser } = res.locals;
        const {
            idPrescription,
            IDPharma
        }: {
            idPrescription: number;
            IDPharma: number;
        } = req.body;

        if (idPrescription == undefined)
            return res
                .status(400)
                .send('idPrescription is missing or invalid.');
        let prescriptions = await Prescription.update(
            {
                PharmmacistId: IDPharma
            },
            {
                where: {
                    id: idPrescription
                }
            }
        );

        if (!prescriptions)
            return res
                .status(500)
                .send('Serveur failed to update prescriptions');

        return res.status(201).send('Send Prescription sucess');
    } catch (err) {
        return next(err);
    }
};

/**
 * @api {post} /sendPrescriptionToPhamacy Send Prescription
 * @apiName Send Prescription
 * @apiGroup Pharmacist User
 * @apiDescription Send a prescription to a pharmacist
 *
 * @apiHeader {String} Authorization="Bearer AccessToken" Authorisation mode
 * @apiHeader {String} Content-Type="application/json" ContentType of the request.
 *
 * @apiParam {Number} idPrescription="3" id of the prescription
 *
 * @apiSuccess (Success 201) {Number} status 201.
 *
 * @apiError (Error 401 (auth)) {Number} Status 401.
 * @apiError (Error 401 (auth)) {String} error Missing Authorization header with Basic
 *
 * @apiError (Error 400 (firstName)) {Number} Status 400.
 * @apiError (Error 400 (firstName)) {String} idPrescription is missing or invalid.
 *
 * @apiError (Error 500 (servError)) {Number} Status 500.
 * @apiError (Error 500 (servError)) {String} Serveur failed to update prescriptions.
 *
 */

//send prescription of the pharmacist account
export const getPrescriptionsPharmacist = async (
    req: Request,
    res: ExtendedResponse,
    next: NextFunction
) => {
    try {
        const { pharmaUser } = res.locals;

        const prescriptions = await Prescription.findAll({
            where: {
                PharmmacistId: pharmaUser.id
            }
        });

        return res.status(200).json(prescriptions);
    } catch (err) {
        return next(err);
    }
};

/**
 * @api {get} /pharmacies/getAllPrescriptions Get prescription from a client
 * @apiName get all prescriptions of a Pharmacist User
 * @apiGroup Pharmacist User
 * @apiDescription get a prescription to a client user
 *
 * @apiHeader {String} Authorization="Bearer AccessToken" Authorisation mode
 * @apiHeader {String} Content-Type="application/json" ContentType of the request.
 *
 * @apiParam {Number} idPrescription="3" id of the prescription
 *
 * @apiSuccess (Success 200) {Number} status 200 Send Prescription sucess.
 * @apiSuccess (Success 200) {json} Success-response:
 *      {
 *          "doctorName":"jack", Drugs:[Drug: "doliprane", Drug:"efferalegan"]
 *      }
 *
 */

export const getPharmaciesAccounts = async (
    req: Request,
    res: ExtendedResponse,
    next: NextFunction
) => {
    try {
        const { pharmacyAddress } = req.query;

        if (!pharmacyAddress) {
            res.status(400).send('Pharmacy address missing');
        }

        var pharmacyAccount = await PharmacistUser.findOne({
            where: {
                address: pharmacyAddress
            }
        });

        if (!pharmacyAccount) {
            return res
                .status(401)
                .send('No pharmacy account found for this address');
        }

        pharmacyAccount!.password = '';
        pharmacyAccount!.refreshToken = '';

        return res.status(200).json(pharmacyAccount);
    } catch (err) {
        return next(err);
    }
};

/**
 * @api {get} /pharmaciesAccounts Get prescription from a client
 * @apiName get pharmacist user account
 * @apiGroup Pharmacist User
 * @apiDescription get a prescription to a client user
 *
 * @apiHeader {String} Authorization="Bearer AccessToken" Authorisation mode
 * @apiHeader {String} Content-Type="application/json" ContentType of the request.
 *
 * @apiParam {String} pharmacyAdress="3 rue de Brest" adress of the Pharmacye
 *
 * @apiSuccess (Success 200) {Number} status 200 Send Prescription sucess.
 * @apiSuccess (Success 200) {json} Success-response:
 *      {
 *          "firstName": "Enki", "lastName": "Corbin", "email": "enki@gmail.com", "adresse": "Adresse de la pharmacie" [...]
 *      }
 *
 * @apiError (Error 400 (Adress Pharmacy)) {Number} Status 400.
 * @apiError (Error 400 (Adress Pharmacy)) {String} Pharmacy address missing
 *
 * @apiError (Error 401 (PharmaAccount)) {Number} Status 401.
 * @apiError (Error 401 (PharmaAccount)) {String} No pharmacy account found for this address
 *
 */

export const addClientToList = async (
    req: Request,
    res: ExtendedResponse,
    next: NextFunction
) => {
    try {
        const { pharmaUser } = res.locals;
        const {
            firstName,
            lastName,
            clientPhoneNumber
        }: {
            firstName: string;
            lastName: string;
            clientPhoneNumber: string;
        } = req.body;

        if (!lastName) {
            return res.status(400).send('Last Name is missing');
        }
        if (!firstName) {
            return res.status(400).send('First Name is missing');
        }
        if (!clientPhoneNumber) {
            return res.status(400).send('Phone Number is missing');
        }
        const lClient = await PharmacistUser.findOne({
            where: { phoneNumber: clientPhoneNumber }
        });
        if (lClient) {
            return res.status(409).send('client already existe');
        }
        const Client = await pharmaUser.createClient({
            firstName: firstName,
            lastName: lastName,
            phoneNumber: clientPhoneNumber
        });

        if (!Client) {
            return res.status(401).send('Client cant be create');
        }

        return res.status(201).json(pharmaUser);
    } catch (err) {
        return next(err);
    }
};

/**
 * @api {post} /pharmacies/addClientList add client in the liste
 * @apiName addClientListe
 * @apiGroup Pharmacist User
 * @apiDescription add a client to the liste of pharmacies
 *
 * @apiHeader {String} Authorization="Bearer AccessToken" Authorisation mode
 * @apiHeader {String} Content-Type="application/json" ContentType of the request.
 *
 * @apiParam {String} firstName="enki" first name
 * @apiParam {String} lastName="corbin" last name
 * @apiParam {String} PhoneNumber="0637292934" Phone Number
 *
 * @apiSuccess (Success 201) {Number} status 201.
 *
 * @apiError (Error 401 (auth)) {Number} Status 401.
 * @apiError (Error 401 (auth)) {String} error Missing Authorization header with Basic
 *
 * @apiError (Error 400 (auth)) {Number} Status 401.
 * @apiError (Error 400 (auth)) {String} error Missing Authorization header with Basic
 *
 * @apiError (Error 400 (firstName)) {Number} Status 400.
 * @apiError (Error 400 (firstName)) {String} error First name is missing
 *
 * @apiError (Error 400 (lastName)) {Number} Status 400.
 * @apiError (Error 400 (lastName)) {String} error Last name is missing
 *
 * @apiError (Error 400 (Phone Number)) {Number} Status 400.
 * @apiError (Error 400 (phone Number)) {String} error Last name is missing
 *
 * @apiError (Error 401 (client)) {Number} Status 401.
 * @apiError (Error 401 (client)) {String} Client cant be create
 *
 * @apiError (Error 409 (Access token)) {Number} Status 409.
 * @apiError (Error 409 (Access token)) {String} client already existe
 *
 */

export const getListeClients = async (
    req: Request,
    res: ExtendedResponse,
    next: NextFunction
) => {
    try {
        const { pharmaUser } = res.locals;

        const listeClients = await pharmaUser.getClients();

        if (!listeClients) {
            return res.status(400).send('cant find liste clients');
        }

        return res.status(201).json(listeClients);
    } catch (err) {
        return next(err);
    }
};

/**
 * @api {get} /pharmacies/getClientList get liste client
 * @apiName getClientListe
 * @apiGroup Pharmacist User
 * @apiDescription get a liste of client in a pharmacies User
 *
 * @apiHeader {String} Authorization="Bearer AccessToken" Authorisation mode
 * @apiHeader {String} Content-Type="application/json" ContentType of the request.
 *
 * @apiParam {String} firstName="enki" first name
 * @apiParam {String} lastName="corbin" last name
 * @apiParam {String} clientPhoneNumber="0637292934" Phone Number
 *
 * @apiSuccess (Success 201) {Number} status 201.
 *
 * @apiError (Error 400 (auth)) {Number} Status 400.
 * @apiError (Error 400 (auth)) {String} cant find liste clients
 *
 */
