'use strict';
var __importDefault =
    (this && this.__importDefault) ||
    function (mod) {
        return mod && mod.__esModule ? mod : { default: mod };
    };
Object.defineProperty(exports, '__esModule', { value: true });
const sequelize_1 = require('sequelize');
const database_1 = __importDefault(require('../database'));
const Prescription_1 = __importDefault(require('./Prescription'));
class User extends sequelize_1.Model {
    constructor() {
        super(...arguments);
        this.prescriptions = [];
    }
}
User.init(
    {
        id: {
            type: sequelize_1.DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true
        },
        firstName: {
            type: sequelize_1.DataTypes.STRING,
            allowNull: false
        },
        lastName: {
            type: sequelize_1.DataTypes.STRING,
            allowNull: false
        },
        email: {
            type: sequelize_1.DataTypes.STRING,
            unique: true,
            allowNull: false
        },
        password: {
            type: sequelize_1.DataTypes.STRING,
            allowNull: false
        },
        type: {
            type: sequelize_1.DataTypes.INTEGER,
            allowNull: false
        }
    },
    { sequelize: database_1.default }
);
User.hasMany(Prescription_1.default, {
    as: 'prescriptions'
});
exports.default = User;
