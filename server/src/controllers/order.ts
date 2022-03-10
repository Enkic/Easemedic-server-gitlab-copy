import { Request, NextFunction } from 'express';
import { ExtendedResponse } from '../types/Response';
import Order from '../models/Order';
import PharmacistUser from '../models/PharmacistUser';
import Prescription from '../models/Prescription';
import Drug from '../models/Drug';
import User from '../models/User';
import { OrderType } from '../types/OrderType';

/**
 * @api {post} /user/addOrder Add order
 * @apiName Add order
 * @apiGroup User
 * @apiDescription Add an order of a user to a pharmacist with one or more prescription
 *
 * @apiHeader {String} Content-Type="application/json" ContentType of the request.
 * @apiHeader {String} Authorization='Bearer accessToken' Authorization mode
 *
 * @apiParam {Number} pharmacistID="24" is the id of the pharmcist
 * @apiParam {Array} prescriptionIDs="[ 12, 24 ]" is the ids of the prescriptions
 *
 * @apiSuccess (Success 200) {Number} status 201.
 * @apiSuccess (Success 200) {String} New orders created
 *
 * @apiError (Error 400 (code)) {Number} Status 400.
 * @apiError (Error 400 (code)) {String} Pharmacist ID is missing.
 *
 * @apiError (Error 400 (code)) {Number} Status 400.
 * @apiError (Error 400 (code)) {String} This Pharmacist ID does not exist.
 *
 * @apiError (Error 400 (code)) {Number} Status 400.
 * @apiError (Error 400 (code)) {String} Prescription IDs are missing.
 *
 * @apiError (Error 400 (invalid)) {Number} Status 400.
 * @apiError (Error 400 (invalid)) {String} prescription ID : x not found
 *
 */
export const addOrder = async (
    req: Request,
    res: ExtendedResponse,
    next: NextFunction
) => {
    try {
        var {
            pharmacistID,
            prescriptionIDs
        }: { pharmacistID: number; prescriptionIDs: [number] } = req.body;
        const secondaryUser = res.locals.secondaryUser;
        var pharmacistUser = await PharmacistUser.findOne({
            where: { id: pharmacistID }
        });
        if (!pharmacistID) {
            return res.status(400).send('Pharmacist ID is missing.');
        }
        if (!pharmacistUser) {
            return res.status(400).send('This Pharmacist ID does not exist.');
        }
        if (!prescriptionIDs) {
            return res.status(400).send('Prescription IDs are missing.');
        }

        let prescriptionsTab: Prescription[] = [];

        var newOrder = await Order.create({
            UserID: res.locals.user.id,
            PharmacistID: pharmacistID,
            secondaryUserID: secondaryUser ? secondaryUser.id : null
        });

        Promise.all(
            prescriptionIDs.map(async (prescriptionID: number) => {
                var prescription = await Prescription.findOne({
                    where: { id: prescriptionID }
                });
                if (!prescription) {
                    return res
                        .status(400)
                        .send(
                            'prescription ID :' +
                                prescriptionID.toString() +
                                ' not found'
                        );
                }

                prescriptionsTab.push(prescription);
            })
        ).then(() => {
            prescriptionsTab.forEach((prescription: Prescription) => {
                prescription.update({
                    OrderId: newOrder.id,
                    SecondaryUserId: secondaryUser ? secondaryUser.id : null
                });
            });

            return res.status(200).json('New orders created');
        });
    } catch (err) {
        return next(err);
    }
};

/**
 * @api {post} /pharmacies/modifyOrderStatus Modify order status
 * @apiName Modify order status
 * @apiGroup Pharmacies
 * @apiDescription Modify status of an order
 *
 * @apiHeader {String} Content-Type="application/json" ContentType of the request.
 * @apiHeader {String} Authorization='Bearer accessToken' Authorization mode
 *
 * @apiParam {Number} id="24" is the id of the order
 * @apiParam {Number} status="1" is the new status (0=IN_PREPARATION 1=READY 2=COLLECTED 3=REJECTED)
 *
 * @apiSuccess (Success 201) {Number} status 201.
 * @apiSuccess (Success 201) {String} Order status updated
 *
 * @apiError (Error 400 (code)) {Number} Status 400.
 * @apiError (Error 400 (code)) {String} Order ID is missing.
 *
 * @apiError (Error 400 (code)) {Number} Status 400.
 * @apiError (Error 400 (code)) {String} Status is missing.
 *
 * @apiError (Error 400 (code)) {Number} Status 400.
 * @apiError (Error 400 (code)) {String} Status invalid.
 *
 * @apiError (Error 400 (invalid)) {Number} Status 400.
 * @apiError (Error 400 (invalid)) {String} Order ID not attributed.
 *
 */
export const modifyOrderStatus = async (
    req: Request,
    res: ExtendedResponse,
    next: NextFunction
) => {
    try {
        var { id, status }: { id: number; status: number } = req.body;

        if (!id) {
            return res.status(400).send('Order ID is missing.');
        }
        if (!status) {
            return res.status(400).send('Status is missing.');
        }
        if (status > OrderType.REJECTED || status < 0) {
            return res.status(400).send('Status invalid.');
        }

        var order = await Order.findOne({
            where: { id: id }
        });
        if (!order) {
            return res.status(400).send('Order ID not attributed.');
        }
        await Order.update(
            {
                status: status
            },
            {
                where: {
                    id: id
                }
            }
        );
        return res.status(201).json('Order status updated');
    } catch (err) {
        return next(err);
    }
};

/**
 * @api {post} /user/setOrderRejected Set order rejected
 * @apiName Set order rejected
 * @apiGroup User
 * @apiDescription Set an order rejected
 *
 * @apiHeader {String} Content-Type="application/json" ContentType of the request.
 * @apiHeader {String} Authorization='Bearer accessToken' Authorization mode
 *
 * @apiParam {Number} id="24" is the id of the order
 *
 * @apiSuccess (Success 201) {Number} status 201.
 * @apiSuccess (Success 201) {String} Order status updated
 *
 * @apiError (Error 400 (code)) {Number} Status 400.
 * @apiError (Error 400 (code)) {String} Order ID is missing.
 *
 * @apiError (Error 400 (invalid)) {Number} Status 400.
 * @apiError (Error 400 (invalid)) {String} Order ID not attributed.
 *
 */

export const setOrderRejected = async (
    req: Request,
    res: ExtendedResponse,
    next: NextFunction
) => {
    try {
        var { id }: { id: number } = req.body;

        if (!id) {
            return res.status(400).send('Order ID is missing.');
        }

        var order = await Order.findOne({
            where: { id: id }
        });
        if (!order) {
            return res.status(400).send('Order ID not attributed.');
        }
        await Order.update(
            {
                status: 3
            },
            {
                where: {
                    id: id
                }
            }
        );
        return res.status(201).json('Order status updated');
    } catch (err) {
        return next(err);
    }
};

/**
 * @api {get} /user/getOrders Get all user order
 * @apiName Get all user order
 * @apiGroup User
 * @apiDescription Get all user order
 *
 * @apiHeader {String} Content-Type="application/json" ContentType of the request.
 * @apiHeader {String} Authorization='Bearer accessToken' Authorization mode
 *
 * @apiSuccess (Success 201) {Number} status 201.
 * @apiSuccess (Success 201) {json} success-response: {
 *      [<br/>
 *          { OrderId: 1, "UserID": "13", "status": "0", "prescriptions": [...] }<br/>
 *          { OrderId: 2, "UserID": "24", "status": "1", "prescriptions": [...] }<br/>
 *          { OrderId: 3, "UserID": "54", "status": "0", "prescriptions": [...] }<br/>
 *       ]
 * }
 *
 * @apiError (Error 403 (NoAccessToken)) {Number} status 403
 * @apiError (Error 403 (NoAccessToken)) {String} error Token payload is not present
 */
export const getOrdersByUserID = async (
    req: Request,
    res: ExtendedResponse,
    next: NextFunction
) => {
    try {
        const ordersToReturn = new Array();
        const orders: Order[] = await Order.findAll();
        const secondaryUserId = res.locals.secondaryUser
            ? res.locals.secondaryUser.id
            : null;

        Promise.all(
            orders.map(async (order: Order) => {
                if (
                    order.UserID === res.locals.user.id &&
                    order.secondaryUserID === secondaryUserId
                ) {
                    const prescriptions = await Prescription.findAll({
                        include: [
                            {
                                model: Drug,
                                as: 'drugs'
                            }
                        ],
                        where: {
                            OrderId: order.id,
                            SecondaryUserId: secondaryUserId
                        }
                    });
                    var pharmacy = await PharmacistUser.findOne({
                        where: { id: order.PharmacistID }
                    });
                    ordersToReturn.push({
                        OrderId: order.id,
                        UserID: order.UserID,
                        SecondaryUserId: order.secondaryUserID,
                        Pharmacist: {
                            id: order.PharmacistID,
                            firstName: pharmacy?.firstName,
                            lastName: pharmacy?.lastName,
                            address: pharmacy?.address,
                            phoneNumber: pharmacy?.phoneNumber,
                            email: pharmacy?.email
                        },
                        status: order.status,
                        willCollectAt: order.willCollectAt,
                        createdAt: order.createdAt,
                        prescriptions
                    });
                }
            })
        ).then(() => {
            return res.status(201).json(ordersToReturn);
        });
    } catch (err) {
        return next(err);
    }
};

/**
 * @api {get} /pharmacies/getOrders Get all pharmacist order
 * @apiName Get all pharmacist order
 * @apiGroup Pharmacies
 * @apiDescription Get all pharmacist order
 *
 * @apiHeader {String} Content-Type="application/json" ContentType of the request.
 * @apiHeader {String} Authorization='Bearer accessToken' Authorization mode
 *
 * @apiSuccess (Success 201) {Number} status 201.
 * @apiSuccess (Success 201) {json} success-response: {
 *      [<br/>
 *          { OrderId: 1, "PharmacistID": "12", "status": "0", "prescriptions": [...] }<br/>
 *          { OrderId: 2, "PharmacistID": "42", "status": "1", "prescriptions": [...] }<br/>
 *          { OrderId: 3, "PharmacistID": "53", "status": "0", "prescriptions": [...] }<br/>
 *       ]
 * }
 *
 * @apiError (Error 403 (NoAccessToken)) {Number} status 403
 * @apiError (Error 403 (NoAccessToken)) {String} error Token payload is not present
 */
export const getOrdersByPharmacyID = async (
    req: Request,
    res: ExtendedResponse,
    next: NextFunction
) => {
    try {
        const ordersToReturn = new Array();
        const orders: Order[] = await Order.findAll();

        Promise.all(
            orders.map(async (order: Order) => {
                if (order.PharmacistID === res.locals.pharmaUser.id) {
                    const prescriptions = await Prescription.findAll({
                        include: [
                            {
                                model: Drug,
                                as: 'drugs'
                            }
                        ],
                        where: { OrderId: order.id }
                    });
                    var user = await User.findOne({
                        where: { id: order.UserID }
                    });
                    ordersToReturn.push({
                        OrderId: order.id,
                        UserID: order.UserID,
                        user: {
                            id: order.UserID,
                            firstName: user?.firstName,
                            lastName: user?.lastName,
                            phoneNumber: user?.phoneNumber,
                            email: user?.email
                        },
                        PharmacistID: order.PharmacistID,
                        status: order.status,
                        prescriptions
                    });
                }
            })
        ).then(() => {
            return res.status(201).json(ordersToReturn);
        });
    } catch (err) {
        return next(err);
    }
};
