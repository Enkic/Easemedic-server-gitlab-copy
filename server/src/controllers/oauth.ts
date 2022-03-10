import { Request, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { signToken, getDecodedPayload } from '../JWTUtils/tokens';
import { ExtendedResponse } from '../types/Response';
import User from '../models/User';
import PharmacistUser from '../models/PharmacistUser';

/**
 * @api {post} /user/oauth/refresh_token Refresh user accessToken
 * @apiName Refresh user token
 * @apiGroup OAuth
 * @apiDescription Refresh the accessToken of a user account
 *
 * @apiHeader {String} Content-Type="application/json" ContentType of the request.
 * @apiHeader {String} Authorization="Bearer {refreshToken}" Authorisation mode
 *
 * @apiSuccess (Success 200) {Number} status 200.
 * @apiSuccess (Success 201) {String} accessToken User access token
 * @apiSuccess (Success 201) {String} refreshToken User refresh token
 * @apiSuccess (Success 201) {String} accessTokenExp Expiration time of the accessToken
 *
 * @apiError (Error 401 (header parameter missing)) {Number} Status 401.
 * @apiError (Error 401 (header parameter missing)) {String} error Missing Authorization header with OAuth\n
 *
 * @apiError (Error 400 (parameter invalid)) {Number} Status 400.
 * @apiError (Error 400 (parameter invalid)) {String} error Invalid refreshToken
 *
 * @apiError (Error 500 (server error)) {Number} Status 500.
 * @apiError (Error 500 (server error)) {String} error An unexpected error occured when generating the refresh token or the access token
 *
 */
export const refreshUserToken = async (
    req: Request,
    res: ExtendedResponse,
    next: NextFunction
) => {
    try {
        // Get the refresh token
        const authHeader = req.headers['authorization'];
        const refreshToken = authHeader && authHeader.split(' ')[1];
        if (refreshToken == null) {
            res.setHeader('WWW-Authenticate', 'Basic realm="EaseMedic-Server"');
            return res
                .status(401)
                .send('Missing Authorization header with OAuth\n');
        }

        const user = await User.findOne({
            where: { refreshToken: refreshToken }
        });

        if (!user) {
            res.status(400).send('Invalid refreshToken');
            return;
        }

        const accessToken = signToken(
            { email: user.email, iat: Math.floor(Date.now() / 1000) },
            process.env.JWT_ACCESS_SECRET,
            `${process.env.JWT_ACCESS_TOKEN_EXPIRES}`
        );
        const newRefreshToken = signToken(
            { email: user.email, iat: Math.floor(Date.now() / 1000) },
            process.env.JWT_REFRESH_SECRET,
            `${process.env.JWT_REFRESH_TOKEN_EXPIRES}`
        );

        if (!accessToken || !newRefreshToken) {
            return res
                .status(500)
                .send(
                    'An unexpected error occured when generating the refresh token or the access token'
                );
        }

        await User.update(
            {
                refreshToken: newRefreshToken
            },
            {
                where: {
                    refreshToken: refreshToken
                }
            }
        );
        const decodedObj = getDecodedPayload(accessToken);

        return res.status(201).json({
            accessToken: accessToken,
            refreshToken: newRefreshToken,
            accessTokenExp: decodedObj.exp
        });
    } catch (err) {
        next(err);
    }
};

/**
 * @api {post} /user/oauth/refresh_token Refresh pharmacist accessToken
 * @apiName Refresh pharmacist token
 * @apiGroup OAuth
 * @apiDescription Refresh the accessToken of a pharmacist account
 *
 * @apiHeader {String} Content-Type="application/json" ContentType of the request.
 * @apiHeader {String} Authorization="Bearer {refreshToken}" Authorisation mode
 *
 * @apiSuccess (Success 200) {Number} status 200.
 * @apiSuccess (Success 201) {String} accessToken User access token
 * @apiSuccess (Success 201) {String} refreshToken User refresh token
 * @apiSuccess (Success 201) {String} accessTokenExp Expiration time of the accessToken
 *
 * @apiError (Error 401 (header parameter missing)) {Number} Status 401.
 * @apiError (Error 401 (header parameter missing)) {String} error Missing Authorization header with OAuth\n
 *
 * @apiError (Error 400 (parameter invalid)) {Number} Status 400.
 * @apiError (Error 400 (parameter invalid)) {String} error Invalid refreshToken
 *
 * @apiError (Error 500 (server error)) {Number} Status 500.
 * @apiError (Error  500 (server error)) {String} error An unexpected error occured when generating the refresh token or the access token
 *
 */
export const refreshPharmacistToken = async (
    req: Request,
    res: ExtendedResponse,
    next: NextFunction
) => {
    try {
        // Get the refresh token
        const authHeader = req.headers['authorization'];
        const refreshToken = authHeader && authHeader.split(' ')[1];
        if (refreshToken == null) {
            res.setHeader('WWW-Authenticate', 'Basic realm="EaseMedic-Server"');
            return res
                .status(401)
                .send('Missing Authorization header with OAuth\n');
        }

        const user = await PharmacistUser.findOne({
            where: { refreshToken: refreshToken }
        });

        if (!user) {
            res.status(404).send('Invalid refreshToken');
            return;
        }

        const accessToken = signToken(
            { email: user.email, iat: Math.floor(Date.now() / 1000) },
            process.env.JWT_ACCESS_SECRET,
            `${process.env.JWT_ACCESS_TOKEN_EXPIRES}`
        );
        const newRefreshToken = signToken(
            { email: user.email, iat: Math.floor(Date.now() / 1000) },
            process.env.JWT_REFRESH_SECRET,
            `${process.env.JWT_REFRESH_TOKEN_EXPIRES}`
        );

        if (!accessToken || !newRefreshToken) {
            return res
                .status(500)
                .send(
                    'An unexpected error occured when generating the refresh token or the access token'
                );
        }

        await User.update(
            {
                refreshToken: newRefreshToken
            },
            {
                where: {
                    refreshToken: refreshToken
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
        next(err);
    }
};
