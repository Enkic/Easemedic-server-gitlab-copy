'use strict';
Object.defineProperty(exports, '__esModule', { value: true });
const express_1 = require('express');
const pharmacies_1 = require('../controllers/pharmacies');
const router = express_1.Router();
router.get('/pharmacies', pharmacies_1.getPharmacies);
exports.default = router;
