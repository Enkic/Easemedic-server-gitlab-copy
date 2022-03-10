import { Router } from 'express';

import {
    getUserFromToken,
    getPharmaUserFromToken,
    getSecondaryUserIfExist
} from '../middlewares';

import {
    uploadPrescription,
    deletePrescription,
    getPrescriptions
} from '../controllers/prescription';

import {
    sendPrescription,
    getPrescriptionsPharmacist
} from '../controllers/pharmacistUser';

const router = Router();

router.post(
    '/prescription/:id?',
    getUserFromToken,
    getSecondaryUserIfExist,
    uploadPrescription
);

router.delete('/prescription/:id', getUserFromToken, deletePrescription);

router.get(
    '/prescriptions/:id?',
    getUserFromToken,
    getSecondaryUserIfExist,
    getPrescriptions
);

router.post('/sendPrescriptionToPhamacy', getUserFromToken, sendPrescription);

router.get(
    '/pharmacies/getAllPrescriptions',
    getPharmaUserFromToken,
    getPrescriptionsPharmacist
);

export default router;
