import {
    DataTypes,
    Model,
    HasManyCreateAssociationMixin,
    HasManyRemoveAssociationMixin,
    Association,
    HasManyGetAssociationsMixin
} from 'sequelize';

import sequelize from '../database';

import Prescription from './Prescription';
import { IUser } from '../types/IUser';
import { UserType } from '../types/UserType';
import Reminder from './Reminder';

class SecondaryUser extends Model implements IUser {
    public id!: number;
    public readonly createdAt!: Date;
    public readonly updatedAt!: Date;
    public type!: UserType;
    public profilPictureUrl!: string;

    public isActive!: boolean;

    public firstName!: string;
    public lastName!: string;
    public email!: string;

    public socialSecurityNumber: number | undefined;
    public phoneNumber: number | undefined;
    public preferedPharmacyAddr: string | undefined;
    public preferedPharmacyName: string | undefined;

    public prescriptions: Prescription[] = [];
    public reminders: Reminder[] = [];

    public createReminder!: HasManyCreateAssociationMixin<Prescription>;
    public getReminders!: HasManyGetAssociationsMixin<Prescription>;
    public removeReminder!: HasManyRemoveAssociationMixin<
        SecondaryUser,
        Prescription
    >;

    public createPrescription!: HasManyCreateAssociationMixin<Prescription>;
    public getPrescriptions!: HasManyGetAssociationsMixin<Prescription>;
    public removePrescription!: HasManyRemoveAssociationMixin<
        SecondaryUser,
        Prescription
    >;

    public static associations: {
        prescriptions: Association<SecondaryUser, Prescription>;
        reminders: Association<SecondaryUser, Reminder>;
    };
}

SecondaryUser.init(
    {
        id: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true
        },
        isActive: {
            type: DataTypes.BOOLEAN,
            defaultValue: true,
            allowNull: false
        },
        firstName: {
            type: DataTypes.STRING,
            allowNull: false
        },
        lastName: {
            type: DataTypes.STRING,
            allowNull: false
        },
        email: {
            type: DataTypes.STRING,
            unique: true,
            allowNull: true
        },
        type: {
            type: DataTypes.INTEGER,
            allowNull: false,
            defaultValue: UserType.PRIVATE_SECONDARY_USER
        },
        profilPictureUrl: {
            type: DataTypes.STRING,
            allowNull: true
        },
        socialSecurityNumber: {
            type: DataTypes.STRING,
            allowNull: true
        },
        phoneNumber: {
            type: DataTypes.STRING,
            allowNull: true
        },
        preferedPharmacyAddr: {
            type: DataTypes.STRING,
            allowNull: true
        },
        preferedPharmacyName: {
            type: DataTypes.STRING,
            allowNull: true
        },
        mutualAmc: {
            type: DataTypes.INTEGER,
            allowNull: true
        },
        mutualMembershipNumber: {
            type: DataTypes.INTEGER,
            allowNull: true
        },
        mutualPh2: {
            type: DataTypes.INTEGER,
            allowNull: true
        },
        mutualPh4: {
            type: DataTypes.INTEGER,
            allowNull: true
        },
        mutualPh7: {
            type: DataTypes.INTEGER,
            allowNull: true
        },
        mutualExpirationDate: {
            type: DataTypes.DATE,
            allowNull: true
        }
    },
    { sequelize }
);

SecondaryUser.hasMany(Prescription, {
    as: 'prescriptions'
});

SecondaryUser.hasMany(Reminder, {
    as: 'reminders'
});

export default SecondaryUser;
