import { Router } from 'express';

import { signupOrSigninWithOauthService } from '../controllers/oauthServices';

const router = Router();

router.post(
    '/user/signupOrSigninWithOauthService',
    signupOrSigninWithOauthService
);

export default router;
