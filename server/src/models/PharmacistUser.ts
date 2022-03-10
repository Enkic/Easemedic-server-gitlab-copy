import {
    DataTypes,
    Model,
    Association,
    HasManyCreateAssociationMixin,
    HasManyRemoveAssociationMixin,
    HasManyGetAssociationsMixin
} from 'sequelize';

import sequelize from '../database';

import Client from './Client';
import { UserType } from '../types/UserType';
import { IUser } from '../types/IUser';

class PharmacistUser extends Model implements IUser {
    public id!: number;
    public readonly createdAt!: Date;
    public readonly updatedAt!: Date;

    public isActive!: boolean;

    public firstName!: string;
    public lastName!: string;
    public address!: string;
    public email!: string;
    public password!: string;
    public type!: UserType;
    public activateAccountCode!: string;

    public refreshToken!: string;

    public phoneNumber: number | undefined;

    public createClient!: HasManyCreateAssociationMixin<Client>;
    public getClients!: HasManyGetAssociationsMixin<Client>;
    public removeListeClient!: HasManyRemoveAssociationMixin<
        PharmacistUser,
        Client
    >;

    public static associations: {
        clients: Association<PharmacistUser, Client>;
    };
}

PharmacistUser.init(
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
        address: {
            type: DataTypes.STRING,
            unique: true,
            allowNull: false
        },
        password: {
            type: DataTypes.STRING,
            allowNull: false
        },
        phoneNumber: {
            type: DataTypes.STRING,
            allowNull: true
        },
        refreshToken: {
            type: DataTypes.STRING,
            allowNull: true
        },
        type: {
            type: DataTypes.INTEGER,
            allowNull: false,
            defaultValue: UserType.PHARMACIST
        }
    },
    { sequelize }
);

PharmacistUser.hasMany(Client, {
    as: 'clients'
});

export default PharmacistUser;
