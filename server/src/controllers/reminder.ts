import { Request, NextFunction } from 'express';

import { ExtendedResponse } from '../types/Response';
import Reminder from '../models/Reminder';

/**
 * @api {post} /reminder Add a reminder
 * @apiName Add a reminder
 * @apiGroup Reminder
 * @apiDescription Add a reminder for a User
 *
 * @apiHeader {String} Authorization="Bearer accessToken" Authorisation mode
 * @apiHeader {String} Content-Type="application/json" ContentType of the request.
 *
 * @apiParam {Number} id="1" Id of reminder
 * @apiParam {Number} quantity="2" Quantity of pills
 * @apiParam {String} name="Aspartame" Name of the drug
 * @apiParam {Number} number="7" Duration
 * @apiParam {Boolean} morning="false" Taken in the morning
 * @apiParam {Boolean} midday="false" Taken at the midday
 * @apiParam {Boolean} night="false" Taken in the evening
 * @apiParam {Date} date="12/03/2020" Date
 * @apiParam {Number} duration="7" Duration
 *
 * @apiSuccess (UploadSuccess) {Number} status 201.
 * @apiSuccess (UploadSuccess) {String} sucess Reminder uploaded
 *
 * @apiError (Error 400 (ParameterMissing)) {Number} Status 400.
 * @apiError (Error 400 (ParameterMissing)) {String} error "Name of parameter" is missing
 *
 */

export const uploadReminder = async (
    req: Request,
    res: ExtendedResponse,
    next: NextFunction
) => {
    try {
        const { user } = res.locals;
        const secondaryUser = res.locals.secondaryUser;
        const {
            name,
            quantity,
            morning,
            midday,
            night,
            date,
            duration,
        }: {
            name: string;
            quantity: number;
            morning: boolean;
            midday: boolean;
            night: boolean;
            date: Date;
            duration: number;
        } = req.body;

        // Check if doctorName, date, and drugs are present in req.body
        if (!name) {
            return res.status(400).send('name is missing.');
        }
        if (!quantity) {
            return res.status(400).send('quantity is missing.');
        }
        if (!date) {
            return res.status(400).send('morning is missing.');
        }

        var reminder = null;
        // Store valid prescription in database
        if (secondaryUser) {
            reminder = await secondaryUser.createReminder({
                UserId: user.id,
                SecondaryUser: secondaryUser.id,
                name,
                quantity,
                morning,
                midday,
                night,
                date,
                duration
            });
        } else {
            reminder = await user.createReminder({
                UserId: user.id,
                name,
                quantity,
                morning,
                midday,
                night,
                date,
                duration,
            });
        }
        return res.status(201).json(reminder);
    } catch (err) {
        return next(err);
    }
};

/**
 * @api {get} /reminder Get all reminders
 * @apiName Get all reminders
 * @apiGroup Reminder
 * @apiDescription Get all the reminders of one user
 *
 * @apiHeader {String} Authorization="Bearer accessToken" Authorisation mode
 * @apiHeader {String} Content-Type="application/json" ContentType of the request.
 *
 * @apiSuccess (Success 200) {Number} status 200.
 * @apiSuccess (Success 200) {json} success-response: {
 *      [<br/>
 *             { "id": "1", "quantity" : "2", "name": "Advil", "number": "7", [...] }<br/>
 *             { "id": "2", "quantity" : "1", "name": "Aspirine", "number": "3", [...] }<br/>
 *             { "id": "3", "quantity" : "2", "name": "Medoc", "number": "15", [...] }<br/>
 *       ]
 * }
 *
 * @apiError (Error 403 (NoAccessToken)) {Number} status 403
 * @apiError (Error 403 (NoAccessToken)) {String} error Token payload is not present
 *
 */

export const getReminders = async (
    req: Request,
    res: ExtendedResponse,
    next: NextFunction
) => {
    try {
        const { user } = res.locals;
        const secondaryUser = res.locals.secondaryUser;
        var reminders = null;

        if (secondaryUser) {
            reminders = await Reminder.findAll({
                where: {
                    UserId: user.id,
                    SecondaryUserId: secondaryUser.id
                }
            });
        } else {
            reminders = await Reminder.findAll({
                where: {
                    UserId: user.id,
                    SecondaryUserId: null
                }
            });
        }

        return res.status(200).json(reminders);
    } catch (err) {
        next(err);
    }
};

/**
 * @api {delete} /reminder/:id? Delete reminder
 * @apiName Delete reminder
 * @apiGroup Reminder
 * @apiDescription Delete a reminer.
 *
 * @apiHeader {String} Authorization="Bearer accessToken" Authorisation mode
 * @apiHeader {String} Content-Type="application/json" ContentType of the request.
 *
 * @apiSuccess (Success 204) {Number} status 204.
 * @apiSuccess (Success 204) {String} success Prescription has been destroyed
 
 *
 * @apiError (Error 400 (id FormatError)) {Number} status 400
 * @apiError (Error 400 (id FormatError)) {String} error id is missing.
 * @apiError (Error 400 (id FormatError)) {String} error id must be a number.
 *
 * @apiError (Error 403 (Bad id)) {Number} status 403
 * @apiError (Error 403 (Bad id)) {String} error No reminder with this id found
 *
 */

export const deleteReminder = async (
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

        const reminder = await Reminder.findOne({
            where: {
                id: id
            }
        });

        if (!reminder) {
            return res.status(403).send('No reminder with this id found');
        }

        reminder.destroy();

        return res.status(204).send('Reminder has been destroyed');
    } catch (err) {
        return next(err);
    }
};
