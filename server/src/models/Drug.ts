import { DataTypes, Model } from 'sequelize';

import sequelize from '../database';

class Drug extends Model {
    public id!: number;
    public readonly createdAt!: Date;
    public readonly updatedAt!: Date;

    public PrescriptionId!: number;

    public name!: string;
    public quantity!: number;
    public morning!: boolean;
    public midday!: boolean;
    public night!: boolean;
    public duration!: number;
    public renewable!: number;

}

Drug.init(
    {
        id: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true
        },
        PrescriptionId: {
            type: DataTypes.INTEGER
        },
        name: {
            type: DataTypes.STRING,
            allowNull: false
        },
        quantity: {
            type: DataTypes.INTEGER,
            allowNull: false
        },
        morning: {
            type: DataTypes.BOOLEAN,
            allowNull: true
        },
        midday: {
            type: DataTypes.BOOLEAN,
            allowNull: true
        },
        night: {
            type: DataTypes.BOOLEAN,
            allowNull: true
        },
        duration: {
            type: DataTypes.INTEGER,
            allowNull: false
        },
        renewable: {
            type: DataTypes.INTEGER,
            allowNull: true
        }
    },
    { sequelize }
);

export default Drug;
