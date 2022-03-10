import fs from 'fs';
import Pharmacy from './models/Pharmacy';
import { FinessPharmacy } from './types/FinessPharmacy';
import { IPharmacy } from './types/IPharmacy';

const addPharmacyToDb = (pharmacy: FinessPharmacy): IPharmacy => {
    let fullAddress = '';

    if (pharmacy.numvoie) {
        fullAddress = pharmacy.numvoie;
    }
    if (pharmacy.typvoie) {
        fullAddress = `${fullAddress} ${pharmacy.typvoie}`;
    }
    if (pharmacy.voie) {
        fullAddress = `${fullAddress} ${pharmacy.voie}`;
    }
    if (pharmacy.compvoie) {
        fullAddress = `${fullAddress} ${pharmacy.compvoie}`;
    }
    if (pharmacy.lieuditbp) {
        fullAddress = `${fullAddress} ${pharmacy.lieuditbp}`;
    }
    if (pharmacy.commune) {
        fullAddress = `${fullAddress} ${pharmacy.commune}`;
    }
    if (pharmacy.departement) {
        fullAddress = `${fullAddress} ${pharmacy.departement}`;
    }
    if (pharmacy.libdepartement) {
        fullAddress = `${fullAddress} ${pharmacy.libdepartement}`;
    }

    pharmacy.coordxet = pharmacy.coordxet === null ? -1 : pharmacy.coordxet;
    pharmacy.coordyet = pharmacy.coordyet === null ? -1 : pharmacy.coordyet;
    pharmacy.telephone = pharmacy.telephone === null ? '' : pharmacy.telephone;
    pharmacy.rs = pharmacy.rs === null ? '' : pharmacy.rs;

    return {
        coordxet: pharmacy.coordxet,
        coordyet: pharmacy.coordyet,
        phone: pharmacy.telephone,
        name: pharmacy.rs,
        address: fullAddress
    };
};

export const scheduleFinessRefresh = () => {
    fs.readFile(
        __dirname + '/../src/finess/finess_base.json',
        (err, data: any) => {
            if (err) {
                console.error(
                    `Can't read ${
                        __dirname + '/../src/finess/finess_base.json'
                    } : no such file`,
                    err
                );
            }
            const jsonData = JSON.parse(data);
            const toInsert: IPharmacy[] = [];

            Object.keys(jsonData).forEach(key =>
                toInsert.push(addPharmacyToDb(jsonData[key]))
            );

            Pharmacy.truncate().then(() => {
                Pharmacy.bulkCreate(toInsert, { logging: false })
                    .then(res => {
                        console.log(
                            `List of pharmacies successfully updated with ${res.length} items`
                        );
                    })
                    .catch(err => {
                        console.error(
                            'Update of the list of pharmacies failed: ',
                            err
                        );
                    });
            });
        }
    );
};
