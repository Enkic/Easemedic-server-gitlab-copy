import { DataTypes, Model, HasManyCreateAssociationMixin } from 'sequelize';

import Prescription from './Prescription';
import sequelize from '../database';
import { OrderType } from '../types/OrderType';

class Order extends Model {
    public id!: number;

    public UserID!: number;
    public secondaryUserID!: number;
    public PharmacistID!: number;
    public createdAt!: Date;
    public willCollectAt!: Date;
    public status!: OrderType;

    public createPrescription!: HasManyCreateAssociationMixin<Prescription>;
}

Order.init(
    {
        id: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true
        },
        UserID: {
            type: DataTypes.INTEGER
        },
        secondaryUserID: {
            type: DataTypes.INTEGER
        },
        PharmacistID: {
            type: DataTypes.INTEGER
        },
        willCollectAt: {
            type: DataTypes.DATE,
            allowNull: true
        },
        status: {
            type: DataTypes.INTEGER,
            defaultValue: OrderType.IN_PREPARATION
        }
    },
    { sequelize }
);

Order.hasMany(Prescription, {
    as: 'prescriptions'
});

export default Order;
