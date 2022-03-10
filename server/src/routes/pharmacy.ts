import { Router } from 'express';
import {
    pharmacistSignup,
    updatePharmaName,
    getPharmaProfile,
    updatePharmaPhoneNumber,
    deletePharmaProfile,
    signinWithPharmaCredentials,
    getPharmaciesAccounts,
    addClientToList,
    getListeClients,
    resendCodeByEmail,
    activateAccount
} from '../controllers/pharmacistUser';

import { getPharmacies, getAllPharmacies } from '../controllers/pharmacy';
import {
    getCredentials,
    getPharmaUserFromToken,
    getPharmaUserFromCredentials,
    savePharmacistUserFromDatabase,
    isAccountActivated
} from '../middlewares';

const router = Router();

router.post('/pharmacies/signup', getCredentials, pharmacistSignup);
router.post(
    '/pharmacies/signin',
    getCredentials,
    getPharmaUserFromCredentials,
    isAccountActivated,
    signinWithPharmaCredentials
);

router.post(
    '/pharmacies/resendCodeByEmail',
    getPharmaUserFromToken,
    resendCodeByEmail
);
router.post('/pharmacies/activateAccount', activateAccount);

router.post(
    '/pharmacies/updatePharmaUser',
    getPharmaUserFromToken,
    isAccountActivated,
    updatePharmaName
);
router.get(
    '/pharmacies/getUserPharmacist',
    getPharmaUserFromToken,
    isAccountActivated,
    getPharmaProfile
);

router.post(
    '/pharmacies/phonePharmaNumber',
    getPharmaUserFromToken,
    isAccountActivated,
    updatePharmaPhoneNumber
);

router.delete(
    '/pharmacies/deleteAccount',
    getPharmaUserFromToken,
    isAccountActivated,
    deletePharmaProfile
);

router.post(
    '/pharmacies/addClientList',
    getPharmaUserFromToken,
    isAccountActivated,
    addClientToList
);

router.get(
    '/pharmacies/getClientList',
    getPharmaUserFromToken,
    isAccountActivated,
    getListeClients
);

router.get('/pharmacies', getPharmacies);
router.get('/allPharmacies', getAllPharmacies);
router.get('/pharmaciesAccounts', getPharmaciesAccounts);
export default router;
