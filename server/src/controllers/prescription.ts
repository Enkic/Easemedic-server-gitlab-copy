import { Request, NextFunction } from 'express';

import { ExtendedResponse } from '../types/Response';
import Drug from '../models/Drug';
import Prescription from '../models/Prescription';
import SecondaryUser from '../models/SecondaryUser';

/**
 * @api {post} /prescription Upload prescription
 * @apiName Upload prescription
 * @apiGroup Prescription
 * @apiDescription Upload a new prescription
 *
 * @apiHeader {String} Content-Type="application/json" ContentType of the request.
 * @apiHeader {String} Authorization='Bearer dGVzdDQ0QGdtYWlsLmNvbTpiY2Fk' Authorization mode
 *
 * @apiParam {String} doctorName="Jean neymar" Doctor name
 * @apiParam {String} doctorAdress="12 rue du médecin" Doctor Adress
 * @apiParam {String} doctorType="Généraliste" Doctor Type
 * @apiParam {String} date="Thu Apr 12 2022" Prescription date
 * @apiParam {Array} drugs Array of drugs
 *
 * @apiSuccess (Success 201) {Number} status 201.
 * @apiSuccess (Success 201) {json} prescription Prescription that have been uploaded
 *
 * @apiError (Error 400 (parameter missing)) {Number} Status 400.
 * @apiError (Error 400 (parameter missing)) {String} error doctorName or doctor Adress or date or drugs is missing
 *
 * @apiError (Error 400 (parameter empty)) {Number} Status 400.
 * @apiError (Error 400 (parameter empty)) {String} error drugs[?].name is undefined or empty
 *
 */
export const uploadPrescription = async (
    req: Request,
    res: ExtendedResponse,
    next: NextFunction
) => {
    try {
        const { user, secondaryUser } = res.locals;
        const {
            doctorName,
            doctorAdress,
            doctorType,
            date,
            drugs
        }: { doctorName: string; doctorAdress: string; doctorType: string; date: Date; drugs: Drug[] } = req.body;

        // Check if doctorName, doctorAdress, doctorType, date, and drugs are present in req.body
        if (!doctorName) {
            return res.status(400).send('doctorName is missing.');
        }
        if (!doctorAdress) {
            return res.status(400).send('doctorAdress is missing.');
        }
        if (!doctorType) {
            return res.status(400).send('doctorType is missing.');
        }
        if (!date) {
            return res.status(400).send('date is missing.');
        }
        if (!drugs) {
            return res.status(400).send('drugs is missing.');
        }
        if (drugs.length === 0) {
            return res.status(400).send('drugs is empty.');
        }

        // Check if each drug contains a name and a quantity in drugs
        drugs.forEach((drug, i) => {
            if (!drug.name) {
                return res
                    .status(400)
                    .send(`drugs[${i}].name is undefined or empty`);
            }
            if (!drug.quantity || drug.quantity < 1) {
                return res
                    .status(400)
                    .send(`drugs[${i}].quantity is undefined, negative or zero`);
            }
            if (!drug.duration) {
                return res
                    .status(400)
                    .send(`drugs[${i}].duration is undefined or empty`);
            }

        });

        // If there is a secondary user stored in locals we should modify him
        let prescription: any = null;
        if (secondaryUser) {
            prescription = await secondaryUser.createPrescription({
                UserId: user.id,
                SecondaryUser: secondaryUser.id,
                doctorName: doctorName,
                doctorAdress: doctorAdress,
                doctorType: doctorType,
                date: date
            });
        } else {
            prescription = await user.createPrescription({
                UserId: user.id,
                doctorName: doctorName,
                doctorAdress: doctorAdress,
                doctorType: doctorType,
                date: date
            });
        }

        // Store each drugs of the new prescription in database
        drugs.forEach(async drug => {
            await prescription.createDrug({
                name: drug.name,
                quantity: drug.quantity,
                morning: drug.morning,
                midday: drug.midday,
                night: drug.night,
                duration: drug.duration,
                renewable: drug.renewable
            });
        });

        return res.status(201).json(prescription);
    } catch (err) {
        return next(err);
    }
};

/**
 * @api {get} /prescriptions Get all prescriptions
 * @apiName Get all prescriptions
 * @apiGroup Prescription
 * @apiDescription Get all prescriptions of a particular user
 *
 * @apiHeader {String} Content-Type="application/json" ContentType of the request.
 * @apiHeader {String} Authorization='Bearer dGVzdDQ0QGdtYWlsLmNvbTpiY2Fk' Authorization mode
 *
 * @apiSuccess (Success 200) {Number} status 200.
 * @apiSuccess (Success 200) {String} prescriptions Array of all the user's prescriptions
 *
 */
export const getPrescriptions = async (
    req: Request,
    res: ExtendedResponse,
    next: NextFunction
) => {
    try {
        const { user, secondaryUser } = res.locals;

        let prescriptions: any = null;
        if (secondaryUser) {
            prescriptions = await Prescription.findAll({
                include: [
                    {
                        model: Drug,
                        as: 'drugs'
                    }
                ],
                where: { SecondaryUserId: secondaryUser.id }
            });
        } else {
            prescriptions = await Prescription.findAll({
                include: [
                    {
                        model: Drug,
                        as: 'drugs'
                    }
                ],
                where: {
                    UserId: user.id,
                    SecondaryUserId: null
                }
            });
        }

        return res.status(200).json(prescriptions);
    } catch (err) {
        next(err);
    }
};

/**
 * @api {delete} /prescription/:id Delete prescription
 * @apiName Delete prescription
 * @apiGroup Prescription
 * @apiDescription Delete a user's prescription
 *
 * @apiHeader {String} Content-Type="application/json" ContentType of the request.
 * @apiHeader {String} Authorization='Bearer dGVzdDQ0QGdtYWlsLmNvbTpiY2Fk' Authorization mode
 *
 * @apiSuccess (Success 204) {Number} status 201.
 * @apiSuccess (Success 204) {json} prescription Prescription has been destroyed
 *
 * @apiError (Error 400 (parameter missing)) {Number} Status 400.
 * @apiError (Error 400 (parameter missing)) {String} error id is missing
 *
 * @apiError (Error 400 (parameter invalid)) {Number} Status 400.
 * @apiError (Error 400 (parameter invalid)) {String} error id must be a number
 *
 * @apiError (Error 400 (invalid request)) {Number} Status 400.
 * @apiError (Error 400 (invalid request)) {String} error No prescription with this id found or user dont have access to this prescrition
 */
export const deletePrescription = async (
    req: Request,
    res: ExtendedResponse,
    next: NextFunction
) => {
    try {
        const { user } = res.locals;
        const { id } = req.params;

        if (!id) {
            return res.status(400).send('id is missing.');
        }

        if (!Number(id)) {
            return res.status(400).send('id must be a number.');
        }

        const prescription = await Prescription.findOne({
            where: {
                id: id,
                UserId: user.id
            }
        });

        if (!prescription) {
            return res
                .status(400)
                .send(
                    'No prescription with this id found or user dont have access to this prescrition'
                );
        }

        prescription.destroy();

        return res.status(204).send('Prescription has been destroyed');
    } catch (err) {
        return next(err);
    }
};

export const addOrder = (OrderId: number) => {};
