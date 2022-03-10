import {
    DataTypes,
    Model,
    HasManyCreateAssociationMixin,
    HasManyRemoveAssociationMixin,
    Association,
    HasManyGetAssociationsMixin
} from 'sequelize';

import sequelize from '../database';

import Drug from './Drug';

class Prescription extends Model {
    public id!: number;
    public readonly createdAt!: Date;
    public readonly updatedAt!: Date;

    public UserId!: number;
    public SecondaryUserId!: number;
    public PharmmacistId!: number;
    public OrderId!: number;

    public doctorName!: string;
    public doctorAdress!: string
    public doctorType!: string

    public date!: Date;

    public createDrug!: HasManyCreateAssociationMixin<Drug>;
    public getDrugs!: HasManyGetAssociationsMixin<Drug>;
    public removeDrug!: HasManyRemoveAssociationMixin<Prescription, Drug>;

    public static associations: {
        drugs: Association<Prescription, Drug>;
    };
}

Prescription.init(
    {
        id: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true
        },
        UserId: {
            type: DataTypes.INTEGER,
            allowNull: false
        },
        SecondaryUserId: {
            type: DataTypes.INTEGER,
            allowNull: true
        },
        PharmmacistId: {
            type: DataTypes.INTEGER,
            allowNull: true
        },
        OrderId: {
            type: DataTypes.INTEGER,
            allowNull: true
        },
        doctorName: {
            type: DataTypes.STRING,
            allowNull: false
        },
        doctorAdress: {
            type: DataTypes.STRING,
            allowNull: false
        },
        doctorType: {
            type: DataTypes.STRING,
            allowNull: false
        },
        date: {
            type: DataTypes.DATE,
            allowNull: false
        }
    },
    { sequelize }
);

Prescription.hasMany(Drug, {
    as: 'drugs'
});

export default Prescription;
