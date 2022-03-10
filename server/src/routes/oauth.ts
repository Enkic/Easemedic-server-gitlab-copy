import { Router } from 'express';

import { refreshUserToken, refreshPharmacistToken } from '../controllers/oauth';

const router = Router();

router.get('/user/oauth/refresh_token', refreshUserToken);
router.get('/pharmacist/oauth/refresh_token', refreshPharmacistToken);

export default router;
