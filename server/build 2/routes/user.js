'use strict';
Object.defineProperty(exports, '__esModule', { value: true });
const express_1 = require('express');
const user_1 = require('../controllers/user');
const middlewares_1 = require('../middlewares');
const router = express_1.Router();
router.post(
    '/user/signup',
    middlewares_1.saveUserBasicAuthHeader,
    user_1.signup
);
router.get(
    '/user/me',
    middlewares_1.saveUserBasicAuthHeader,
    middlewares_1.saveUserFromDatabase,
    user_1.getProfile
);
router.delete(
    '/user/me',
    middlewares_1.saveUserBasicAuthHeader,
    middlewares_1.saveUserFromDatabase,
    user_1.deleteProfile
);
exports.default = router;
