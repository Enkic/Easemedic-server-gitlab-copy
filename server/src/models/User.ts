import {
    DataTypes,
    Model,
    HasManyCreateAssociationMixin,
    HasManyRemoveAssociationMixin,
    Association,
    HasOneCreateAssociationMixin,
    HasOneGetAssociationMixin,
    HasManyGetAssociationsMixin
} from 'sequelize';

import sequelize from '../database';

import Prescription from './Prescription';
import SecondaryUser from './SecondaryUser';
import Reminder from './Reminder';
import { UserType } from '../types/UserType';
import { IPharmacy } from '../types/IPharmacy';
import { IUser } from '../types/IUser';

class User extends Model implements IUser {
    public id!: number;
    public readonly createdAt!: Date;
    public readonly updatedAt!: Date;

    public isActive!: boolean;

    public firstName!: string;
    public lastName!: string;
    public email!: string;
    public type!: UserType;
    public profilPictureUrl!: string;
    public activateAccountCode!: string;
    public avatarId!: number;

    public password!: string;

    public socialSecurityNumber: number | undefined;
    public phoneNumber: number | undefined;
    public preferedPharmacyAddr: string | undefined;
    public preferedPharmacyName: string | undefined;

    public refreshToken!: string;

    public prescriptions: Prescription[] = [];
    public secondaryUsers: SecondaryUser[] = [];
    public reminders: Reminder[] = [];

    public createReminder!: HasManyCreateAssociationMixin<Prescription>;
    public getReminders!: HasManyGetAssociationsMixin<Prescription>;
    public removeReminder!: HasManyRemoveAssociationMixin<User, Prescription>;

    public tutorialSeen!: boolean;

    public createSecondaryUser!: HasManyCreateAssociationMixin<SecondaryUser>;
    public getSecondaryUsers!: HasManyGetAssociationsMixin<SecondaryUser>;
    public removeSecondaryUser!: HasManyRemoveAssociationMixin<
        User,
        SecondaryUser
    >;

    public createPrescription!: HasManyCreateAssociationMixin<Prescription>;
    public getPrescriptions!: HasManyGetAssociationsMixin<Prescription>;
    public removePrescription!: HasManyRemoveAssociationMixin<
        User,
        Prescription
    >;

    public static associations: {
        secondaryUsers: Association<User, SecondaryUser>;
        prescriptions: Association<User, Prescription>;
        reminders: Association<User, Reminder>;
    };
}

User.init(
    {
        id: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true
        },
        isActive: {
            type: DataTypes.BOOLEAN,
            defaultValue: false,
            allowNull: false
        },
        activateAccountCode: {
            type: DataTypes.STRING,
            defaultValue: '0000',
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
            allowNull: false
        },
        type: {
            type: DataTypes.INTEGER,
            allowNull: false,
            defaultValue: UserType.PRIVATE
        },
        profilPictureUrl: {
            type: DataTypes.STRING,
            allowNull: true
        },
        avatarId: {
            type: DataTypes.INTEGER,
            allowNull: true
        },
        password: {
            type: DataTypes.STRING,
            allowNull: true
        },
        tutorialSeen: {
            type: DataTypes.BOOLEAN,
            defaultValue: false
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
        },
        refreshToken: {
            type: DataTypes.STRING,
            allowNull: true
        }
    },
    { sequelize }
);

User.hasMany(SecondaryUser, {
    as: 'secondaryUsers'
});

User.hasMany(Prescription, {
    as: 'prescriptions'
});

User.hasMany(Reminder, {
    as: 'reminders'
});

export default User;
