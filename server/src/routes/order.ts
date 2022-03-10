import { Router } from 'express';
import {
    getOrdersByUserID,
    getOrdersByPharmacyID,
    addOrder,
    modifyOrderStatus,
    setOrderRejected
} from '../controllers/order';

import {
    getPharmaUserFromToken,
    getUserFromToken,
    getSecondaryUserIfExist,
    isAccountActivated
} from '../middlewares';

const router = Router();

router.post(
    '/user/addOrder/:id?',
    getUserFromToken,
    isAccountActivated,
    getSecondaryUserIfExist,
    addOrder
);
router.post(
    '/pharmacies/modifyOrderStatus',
    getPharmaUserFromToken,
    isAccountActivated,
    modifyOrderStatus
);
router.post(
    '/user/setOrderRejected',
    getUserFromToken,
    isAccountActivated,
    setOrderRejected
);
router.get(
    '/user/getOrders/:id?',
    getUserFromToken,
    isAccountActivated,
    getSecondaryUserIfExist,
    getOrdersByUserID
);
router.get(
    '/pharmacies/getOrders',
    getPharmaUserFromToken,
    isAccountActivated,
    getOrdersByPharmacyID
);

export default router;
