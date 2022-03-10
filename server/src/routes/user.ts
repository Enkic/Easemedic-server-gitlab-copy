import { Router } from 'express';

import {
    signupWithCredentials,
    signinWithCredentials,
    activateAccount,
    forgotPassword,
    changePassword,
    resendCodeByEmail,
    getProfile,
    deleteProfile,
    addSocialSecurityNumber,
    addPhoneNumber,
    addFavoritePharmacy,
    addmutual,
    uploadProfilPicture,
    getProfilPicture,
    deleteProfilPicture,
    addAvatarID,
    updateNames,
    addSecondaryUser,
    getSecondaryUsers,
    register,
    signin,
    setTutorialSeen,
    tutorialSeen
} from '../controllers/user';
import {
    getCredentials,
    getUserFromToken,
    getUserFromCredentials,
    getSecondaryUserIfExist,
    isAccountActivated
} from '../middlewares';

const router = Router();

router.post('/user/signup', getCredentials, signupWithCredentials, register);
router.post(
    '/user/signin',
    getCredentials,
    getUserFromCredentials,
    isAccountActivated,
    signinWithCredentials,
    signin
);

router.post('/user/resendCodeByEmail', getUserFromToken, resendCodeByEmail);
router.post('/user/activateAccount', activateAccount);

router.post('/user/forgotPassword', forgotPassword);
router.post('/user/changePassword', changePassword);

router.post(
    '/user/secondaryUser',
    getUserFromToken,
    isAccountActivated,
    addSecondaryUser
);
router.get(
    '/user/secondaryUser',
    getUserFromToken,
    isAccountActivated,
    getSecondaryUsers
);

router.post('/user/preferedPharmacy', getUserFromToken, addFavoritePharmacy);

router.post(
    '/user/updateNames/:id?',
    getUserFromToken,
    isAccountActivated,
    getSecondaryUserIfExist,
    updateNames
);
router.post(
    '/user/phoneNumber/:id?',
    getUserFromToken,
    isAccountActivated,
    getSecondaryUserIfExist,
    addPhoneNumber
);
router.post(
    '/user/addMutual/:id?',
    getUserFromToken,
    isAccountActivated,
    getSecondaryUserIfExist,
    addmutual
);
router.post(
    '/user/socialSecurityNumber/:id?',
    getUserFromToken,
    isAccountActivated,
    getSecondaryUserIfExist,
    addSocialSecurityNumber
);

router.post(
    '/user/preferedPharmacy',
    getUserFromToken,
    isAccountActivated,
    addFavoritePharmacy
);

router.post(
    '/user/profilPicture/:id?',
    getUserFromToken,
    isAccountActivated,
    getSecondaryUserIfExist,
    uploadProfilPicture
);
router.get(
    '/user/profilPicture/:id?',
    getUserFromToken,
    isAccountActivated,
    getSecondaryUserIfExist,
    getProfilPicture
);
router.delete(
    '/user/profilPicture/:id?',
    getUserFromToken,
    isAccountActivated,
    getSecondaryUserIfExist,
    deleteProfilPicture
);
router.post(
    '/user/avatarId/:id?',
    getUserFromToken,
    isAccountActivated,
    getSecondaryUserIfExist,
    addAvatarID
);
router.post(
    '/user/setTutorialSeen',
    getUserFromToken,
    isAccountActivated,
    setTutorialSeen
);
router.get(
    '/user/tutorialSeen',
    getUserFromToken,
    isAccountActivated,
    tutorialSeen
);

router.get(
    '/user/me/:id?',
    getUserFromToken,
    isAccountActivated,
    getSecondaryUserIfExist,
    getProfile
);
router.delete(
    '/user/me/:id?',
    getUserFromToken,
    isAccountActivated,
    getSecondaryUserIfExist,
    deleteProfile
);

export default router;
