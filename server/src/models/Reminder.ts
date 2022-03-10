import { DataTypes, Model } from 'sequelize';

import sequelize from '../database';

class Reminder extends Model {
    public id!: number;
    public name!: string;
    public SecondaryUserId!: number;
    public UserId!: number;

    public quantity!: number;
    public morning!: boolean;
    public midday!: boolean;
    public night!: boolean;

    public date!: Date;
    public duration!: number;
}

Reminder.init(
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
        date: {
            type: DataTypes.DATE,
            allowNull: false
        },
        duration: {
            type: DataTypes.INTEGER,
            allowNull: true
        }
    },
    { sequelize }
);

export default Reminder;
