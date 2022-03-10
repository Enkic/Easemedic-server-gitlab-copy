import { Request, NextFunction } from 'express';
import { ExtendedResponse } from '../types/Response';
import { OauthProvider } from '../types/OauthProvider';
import { UserInfos } from '../types/UserInfos';
import User from '../models/User';
import { AnyARecord } from 'dns';
import { isUserPresentInDb, signin, register } from './user';
import { downloadPictureFromUrl } from '../utils/downloadPictureFromUrl';

const request = require('request-promise'); // import request is not working

const getFacebookUserInfos = (oauthProviderRes: any) => {
    const facebookPicturePath =
        './uploads/' + new Date().toISOString() + '_facebook_picture.jpg';

    let userInfos = new UserInfos(
        oauthProviderRes.first_name,
        oauthProviderRes.last_name,
        oauthProviderRes.email,
        facebookPicturePath,
        '',
        true
    );

    if (
        !userInfos.email ||
        !userInfos.firstName ||
        !userInfos.lastName ||
        !oauthProviderRes.picture.data.url
    ) {
        return null;
    }

    downloadPictureFromUrl(
        oauthProviderRes.picture.data.url,
        facebookPicturePath
    );

    return userInfos;
};

const getGoogleUserInfos = (oauthProviderRes: any) => {
    const googlePicturePath =
        './uploads/' + new Date().toISOString() + '_google_picture.jpg';

    let userInfos = new UserInfos(
        oauthProviderRes.given_name,
        oauthProviderRes.family_name,
        oauthProviderRes.email,
        googlePicturePath,
        '',
        true
    );

    if (
        !userInfos.email ||
        !userInfos.firstName ||
        !userInfos.lastName ||
        !oauthProviderRes.picture
    ) {
        return null;
    }

    downloadPictureFromUrl(oauthProviderRes.picture, googlePicturePath);

    return userInfos;
};

/**
 * @api {post} /user/signupOrSigninWithOauthService Signin/Signup oauth
 * @apiName Signin Signup oauth
 * @apiGroup OAuth Google Facebook
 * @apiDescription Signup or, if user already exist, signin a user from an accessToken created by Google or Facebook.
 *
 * @apiHeader {String} Content-Type="application/json" ContentType of the request.
 *
 * @apiParam {String} accessToken="qlmskdjf.lkqsdfj.sdljf" Facebook accessToken
 * @apiParam {String} provider="Facebook" Provider name
 *
 * @apiSuccess (Success 200) {Number} status 200.
 * @apiSuccess (Success 201) {String} accessToken User access token
 * @apiSuccess (Success 201) {String} refreshToken User refresh token
 * @apiSuccess (Success 201) {String} accessTokenExp Expiration time of the accessToken
 *
 * @apiError (Error 400 (parameter missing)) {Number} Status 400.
 * @apiError (Error 400 (parameter missing)) {String} error AccessToken or Provider is missing
 *
 * @apiError (Error 400 (parameter invalid)) {Number} Status 400.
 * @apiError (Error 400 (parameter invalid)) {String} error Provider is incorrect
 *
 * @apiError (Error 400 (error from oauth service)) {Number} Status 400.
 * @apiError (Error 400 (error from oauth service)) {String} error error reiceved from {service}: {the error}
 *
 * @apiError (Error 500 (server error)) {Number} Status 500.
 * @apiError (Error 500 (server error)) {String} error An error occured while getting user informations
 *
 */
export const signupOrSigninWithOauthService = async (
    req: Request,
    res: ExtendedResponse,
    next: NextFunction
) => {
    try {
        const {
            accessToken,
            provider
        }: {
            accessToken: string;
            provider: string;
        } = req.body;

        if (!accessToken) {
            return res.status(400).send('Access token is missing.');
        }
        if (!provider) {
            return res.status(400).send('Provider is missing.');
        }
        if (
            provider != OauthProvider.facebook.name &&
            provider != OauthProvider.google.name
        ) {
            return res.status(400).send('Provider is incorrect.');
        }

        var providerInfos: any;
        switch (provider) {
            case OauthProvider.facebook.name:
                providerInfos = OauthProvider.facebook;
                break;
            case OauthProvider.google.name:
                providerInfos = OauthProvider.google;
                break;
        }

        const options = {
            method: 'GET',
            uri: providerInfos?.uri,
            qs: {
                access_token: accessToken,
                fields: providerInfos?.queryTerms
            }
        };

        request(options)
            .then(async (oauthProviderRes: any) => {
                const parsedRes = JSON.parse(oauthProviderRes);

                let userInfos = null;
                switch (provider) {
                    case OauthProvider.facebook.name:
                        userInfos = getFacebookUserInfos(parsedRes);

                        if (!userInfos) {
                            res.status(400).send(
                                'It seems that your access token dont have access to one of these fields: ' +
                                    OauthProvider.facebook.queryTerms
                            );
                        }
                        break;
                    case OauthProvider.google.name:
                        userInfos = getGoogleUserInfos(parsedRes);

                        if (!userInfos) {
                            res.status(400).send(
                                'It seems that your access token dont have access to one of these fields: ' +
                                    OauthProvider.google.queryTerms
                            );
                        }
                        break;
                }

                res.locals.userInfos = userInfos!;
                const userPresent = await isUserPresentInDb(userInfos!.email);
                if (userPresent) {
                    signin(req, res);
                } else {
                    register(req, res);
                }
            })
            .catch((err: any) => {
                res.status(400).send(
                    'error reiceved from ' +
                        providerInfos.name +
                        ': ' +
                        err.message
                );
            });
    } catch (err) {
        next(err);
    }
};
