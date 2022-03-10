'use strict';
var __importDefault =
    (this && this.__importDefault) ||
    function (mod) {
        return mod && mod.__esModule ? mod : { default: mod };
    };
Object.defineProperty(exports, '__esModule', { value: true });
const sequelize_1 = require('sequelize');
const database_1 = __importDefault(require('../database'));
class Drug extends sequelize_1.Model {}
Drug.init(
    {
        id: {
            type: sequelize_1.DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true
        },
        PrescriptionId: {
            type: sequelize_1.DataTypes.INTEGER
        },
        name: {
            type: sequelize_1.DataTypes.STRING,
            allowNull: false
        },
        count: {
            type: sequelize_1.DataTypes.INTEGER,
            allowNull: false
        }
    },
    { sequelize: database_1.default }
);
exports.default = Drug;
