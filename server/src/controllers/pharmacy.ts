import { Request, NextFunction } from 'express';

import { ExtendedResponse } from '../types/Response';
import Pharmacy from '../models/Pharmacy';
import { IPharmacy } from '../types/IPharmacy';

/**
 * @api {get} /pharmacies Get pharmacies in range
 * @apiName Get pharmacies in range
 * @apiGroup Pharmacies
 * @apiDescription Get all the pharmacies in a certain range
 *
 * @apiHeader {String} Content-Type="application/json" ContentType of the request.
 *
 * @apiParam {String} longitude="48.040907" latitude (query parameter)
 * @apiParam {String} latitude="-1.685485" longitude (query parameter)
 * @apiParam {String} range="1000" Range (in meters) (query parameter)
 *
 * @apiSuccess (Success 200) {Number} status 200.
 * @apiSuccess (Success 200) {json} Success-Response: ```{
    [<br/>
        "42 R DE RENNES 208 35 ILLE ET VILAINE",<br/>
        47.9999054947,<br/>
        -1.667210211,<br/>
        "299576326",<br/>
        "SELARL PHARMACIE D'ORGERES"<br/>
    ],<br/>
    [<br/>
        "1 R NICOLAS APPERT 206 35 ILLE ET VILAINE",<br/>
        48.0416260093,<br/>
        -1.6701765325,<br/>
        "299523195",<br/>
        "PHARMACIE DES POTIERS"<br/>
    ]<br/>
 * }
 * ```
 *
 * @apiError (Error 400 (parameter missing)) {Number} Status 400.
 * @apiError (Error 400 (parameter missing)) {String} error latitude or longitude or range is missing
 *
 * @apiError (Error 500 (server error)) {Number} Status 400.
 * @apiError (Error 400 (server error)) {String} error finess base is unavailable for the moment
 *
 */
export const getPharmacies = async (
    req: Request,
    res: ExtendedResponse,
    next: NextFunction
) => {
    try {
        var { latitude, longitude, range } = req.query;

        const latitudeNum = Number(latitude);
        const longitudeNum = Number(longitude);
        const rangeNum = Number(range);

        const pharmaciesToReturn = new Array();
        const pharmacies: IPharmacy[] = await Pharmacy.findAll();

        if (!latitudeNum) {
            return res.status(400).send('latitude is missing.');
        }
        if (!longitudeNum) {
            return res.status(400).send('longitude is missing.');
        }
        if (!rangeNum) {
            return res.status(400).send('range is missing.');
        }
        if (!pharmacies || pharmacies.length == 0) {
            return res
                .status(500)
                .send('finess base is unavailable for the moment');
        }

        pharmacies.forEach((pharmacy: IPharmacy) => {
            const R = 6371e3; // metres
            const φ1 = (latitudeNum * Math.PI) / 180; // φ, λ in radians
            const φ2 = (pharmacy.coordxet * Math.PI) / 180; // coordxet = latitude
            const Δφ = ((pharmacy.coordxet - latitudeNum) * Math.PI) / 180; // coordxet = latitude
            const Δλ = ((pharmacy.coordyet - longitudeNum) * Math.PI) / 180; // coordyet = longitude

            const a =
                Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
                Math.cos(φ1) *
                    Math.cos(φ2) *
                    Math.sin(Δλ / 2) *
                    Math.sin(Δλ / 2);
            const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

            const d = R * c; // in metres

            if (d <= rangeNum) {
                pharmaciesToReturn.push([
                    pharmacy.address,
                    pharmacy.coordyet, // coordxet = latitude
                    pharmacy.coordxet, // coordyet = longitude
                    pharmacy.phone,
                    pharmacy.name
                ]);
            }
        });

        return res.status(200).json(pharmaciesToReturn);
    } catch (err) {
        return next(err);
    }
};

/**
 * @api {get} /allPharmacies Get all pharmacies
 * @apiName Get all pharmacies
 * @apiGroup Pharmacies
 * @apiDescription Get all the pharmacies stored in the finess base
 *
 * @apiHeader {String} Content-Type="application/json" ContentType of the request.
 *
 * @apiSuccess (Success 200) {Number} status 200.
 * @apiSuccess (Success 200) {json} Success-Response: ```{
    [<br/>
        "42 R DE RENNES 208 35 ILLE ET VILAINE",<br/>
        47.9999054947,<br/>
        -1.667210211,<br/>
        "299576326",<br/>
        "SELARL PHARMACIE D'ORGERES"<br/>
    ],<br/>
    [<br/>
        "1 R NICOLAS APPERT 206 35 ILLE ET VILAINE",<br/>
        48.0416260093,<br/>
        -1.6701765325,<br/>
        "299523195",<br/>
        "PHARMACIE DES POTIERS"<br/>
    ],<br/>
    [...]<br/>
 * }
 * ```
 *
 * @apiError (Error 500 (server error)) {Number} Status 400.
 * @apiError (Error 400 (server error)) {String} error finess base is unavailable for the moment
 *
 */
export const getAllPharmacies = async (
    req: Request,
    res: ExtendedResponse,
    next: NextFunction
) => {
    try {
        const pharmaciesToReturn = new Array();
        const pharmacies: IPharmacy[] = await Pharmacy.findAll();

        if (!pharmacies || pharmacies.length == 0) {
            return res
                .status(500)
                .send('finess base is unavailable for the moment');
        }

        pharmacies.forEach((pharmacy: IPharmacy) => {
            pharmaciesToReturn.push([
                pharmacy.address,
                pharmacy.coordyet, // coordxet = latitude
                pharmacy.coordxet, // coordyet = longitude
                pharmacy.phone,
                pharmacy.name
            ]);
        });

        return res.status(200).json(pharmaciesToReturn);
    } catch (err) {
        return next(err);
    }
};
