import { DataTypes, Model } from 'sequelize';

import sequelize from '../database';
import { IPharmacy } from '../types/IPharmacy';

class Pharmacy extends Model implements IPharmacy {
    public id!: number;
    public readonly createdAt!: Date;
    public readonly updatedAt!: Date;

    public address!: string;
    public coordxet!: number;
    public coordyet!: number;
    public phone!: string;
    public name!: string;
}

Pharmacy.init(
    {
        id: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true
        },
        address: {
            type: DataTypes.STRING,
            allowNull: false
        },
        coordxet: {
            type: DataTypes.DOUBLE,
            allowNull: false
        },
        coordyet: {
            type: DataTypes.DOUBLE,
            allowNull: false
        },
        phone: {
            type: DataTypes.STRING,
            allowNull: true
        },
        name: {
            type: DataTypes.STRING,
            allowNull: false
        }
    },
    { sequelize }
);

export default Pharmacy;
