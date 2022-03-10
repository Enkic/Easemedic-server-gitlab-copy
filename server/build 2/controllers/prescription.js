'use strict';
Object.defineProperty(exports, '__esModule', { value: true });
exports.deletePrescription = exports.uploadPrescription = void 0;
exports.uploadPrescription = async (req, res, next) => {
    try {
        const { user } = res.locals;
        const { doctorName, date, drugs } = req.body;
        // Check if doctorName, date, and drugs are present in req.body
        if (!doctorName) {
            return res.status(400).send('doctorName is missing.');
        }
        if (!date) {
            return res.status(400).send('date is missing.');
        }
        if (!drugs) {
            return res.status(400).send('drugs is missing.');
        }
        if (drugs.length === 0) {
            return res.status(400).send('drugs is empty.');
        }
        // Check if each drug contains a name and a count in drugs
        drugs.forEach((drug, i) => {
            if (!drug.name) {
                return res
                    .status(400)
                    .send(`drugs[${i}].name is undefined or empty`);
            }
            if (!drug.count || drug.count < 1) {
                return res
                    .status(400)
                    .send(`drugs[${i}].count is undefined, negative or zero`);
            }
        });
        // Store valid prescription in database
        const prescription = await user.createPrescription({
            doctorName,
            date
        });
        // Store each drugs of the new prescription in database
        drugs.forEach(async drug => {
            await prescription.createDrug({
                name: drug.name,
                count: drug.count
            });
        });
        return res.status(201).json(prescription);
    } catch (err) {
        return next(err);
    }
};
exports.deletePrescription = async (req, res, next) => {
    try {
        const { user } = res.locals;
        const { id } = req.params;
        if (!id) {
            return res.status(400).send('id is missing.');
        }
        if (user.prescriptions) {
            const toRemove = user
                .get('prescriptions')
                .find(prescription => prescription.id === parseInt(id));
            if (toRemove) {
                await toRemove.destroy();
            } else {
                return res
                    .status(400)
                    .send("id refers to a prescription that doesn't exist.");
            }
        }
        return res.sendStatus(204);
    } catch (err) {
        return next(err);
    }
};
