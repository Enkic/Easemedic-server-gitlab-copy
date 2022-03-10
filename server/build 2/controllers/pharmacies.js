'use strict';
Object.defineProperty(exports, '__esModule', { value: true });
exports.getPharmacies = void 0;
const app_1 = require('../app');
exports.getPharmacies = async (req, res, next) => {
    try {
        // const {
        //     latitude,
        //     longitude,
        //     range
        // }: { latitude: number; longitude: number; range: number } = req.body;
        var { latitude, longitude, range } = req.query;
        const latitudeNum = Number(latitude);
        const longitudeNum = Number(longitude);
        const rangeNum = Number(range);
        if (!latitudeNum) {
            return res.status(400).send('latitude is missing.');
        }
        if (!longitudeNum) {
            return res.status(400).send('longitude is missing.');
        }
        if (!rangeNum) {
            return res.status(400).send('range is missing.');
        }
        if (!app_1.finess) {
            return res
                .status(500)
                .send('internal error: no pharmacies available');
        }
        var pharmacies = new Array();
        app_1.finess.forEach(pharmacy => {
            const R = 6371e3; // metres
            const φ1 = (latitudeNum * Math.PI) / 180; // φ, λ in radians
            const φ2 = (pharmacy.latitude * Math.PI) / 180;
            const Δφ = ((pharmacy.latitude - latitudeNum) * Math.PI) / 180;
            const Δλ = ((pharmacy.longitude - longitudeNum) * Math.PI) / 180;
            const a =
                Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
                Math.cos(φ1) *
                    Math.cos(φ2) *
                    Math.sin(Δλ / 2) *
                    Math.sin(Δλ / 2);
            const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
            const d = R * c; // in metres
            if (d <= rangeNum) {
                pharmacies.push([
                    pharmacy.name,
                    pharmacy.address,
                    pharmacy.latitude,
                    pharmacy.longitude
                ]);
            }
        });
        return res.status(201).json(pharmacies);
    } catch (err) {
        return next(err);
    }
};
