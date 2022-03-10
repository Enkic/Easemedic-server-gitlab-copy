import { DataTypes, Model } from 'sequelize';

import sequelize from '../database';

class Client extends Model {
    public id!: number;
    public readonly createdAt!: Date;
    public readonly updatedAt!: Date;

    public PharmacistUserId!: string;

    public firstName!: string;
    public lastName!: string;
    public phoneNumber!: string;
}

Client.init(
    {
        id: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true
        },
        PharmacistUserId: {
            type: DataTypes.INTEGER
        },
        firstName: {
            type: DataTypes.STRING,
            allowNull: false
        },
        lastName: {
            type: DataTypes.STRING,
            allowNull: false
        },
        phoneNumber: {
            type: DataTypes.STRING,
            allowNull: false
        }
    },
    { sequelize }
);

export default Client;
