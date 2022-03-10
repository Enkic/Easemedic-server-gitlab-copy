'use strict';
var __importDefault =
    (this && this.__importDefault) ||
    function (mod) {
        return mod && mod.__esModule ? mod : { default: mod };
    };
Object.defineProperty(exports, '__esModule', { value: true });
const sequelize_1 = require('sequelize');
const database_1 = __importDefault(require('../database'));
const Drug_1 = __importDefault(require('./Drug'));
class Prescription extends sequelize_1.Model {}
Prescription.init(
    {
        id: {
            type: sequelize_1.DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true
        },
        UserId: {
            type: sequelize_1.DataTypes.INTEGER
        },
        doctorName: {
            type: sequelize_1.DataTypes.STRING,
            allowNull: false
        },
        date: {
            type: sequelize_1.DataTypes.DATE,
            allowNull: false
        }
    },
    { sequelize: database_1.default }
);
Prescription.hasMany(Drug_1.default, {
    as: 'drugs'
});
exports.default = Prescription;
