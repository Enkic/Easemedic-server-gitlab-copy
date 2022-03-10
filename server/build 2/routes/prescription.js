'use strict';
Object.defineProperty(exports, '__esModule', { value: true });
const express_1 = require('express');
const middlewares_1 = require('../middlewares');
const prescription_1 = require('../controllers/prescription');
const router = express_1.Router();
router.post(
    '/prescription',
    middlewares_1.saveUserBasicAuthHeader,
    middlewares_1.saveUserFromDatabase,
    prescription_1.uploadPrescription
);
router.delete(
    '/prescription/:id',
    middlewares_1.saveUserBasicAuthHeader,
    middlewares_1.saveUserFromDatabase,
    prescription_1.deletePrescription
);
exports.default = router;
