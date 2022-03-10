'use strict';
var __importDefault =
    (this && this.__importDefault) ||
    function (mod) {
        return mod && mod.__esModule ? mod : { default: mod };
    };
Object.defineProperty(exports, '__esModule', { value: true });
exports.deleteProfile = exports.getProfile = exports.signup = void 0;
const validator_1 = __importDefault(require('validator'));
const User_1 = __importDefault(require('../models/User'));
const UserType_1 = require('../types/UserType');
exports.signup = async (req, res, next) => {
    try {
        // Check if Authorization header (email:password) is valid.
        const { name, pass } = res.locals.credentials; // name is an email
        if (!validator_1.default.isEmail(name)) {
            return res.status(400).send('Email is invalid.');
        }
        if (pass.length < 6) {
            return res.status(400).send('Password is too short.');
        }
        // Check if firstName, lastName and type keys are present in req.body
        const { firstName, lastName, type } = req.body;
        if (!firstName) {
            return res.status(400).send('First name is missing.');
        }
        if (!lastName) {
            return res.status(400).send('Last name is missing.');
        }
        if (Object.values(UserType_1.UserType).includes(type) === false) {
            return res.status(400).send('Type is missing or invalid.');
        }
        // Check if user in not already in database.
        const user = await User_1.default.findOne({
            where: { email: name }
        });
        if (user) {
            return res.status(409).send('User already exist');
        }
        // Store valid user in database
        const newUser = await User_1.default.create({
            firstName,
            lastName,
            email: name,
            password: pass,
            type
        });
        // keep password safe
        newUser.password = '';
        return res.status(201).json(newUser);
    } catch (err) {
        return next(err);
    }
};
exports.getProfile = async (req, res, next) => {
    try {
        const { user } = res.locals;
        // keep password safe
        user.password = '';
        // Send his JSON profile to user
        return res.status(200).json(user);
    } catch (err) {
        return next(err);
    }
};
exports.deleteProfile = async (req, res, next) => {
    try {
        const { user } = res.locals;
        // delete user from database
        await user.destroy();
        return res.sendStatus(200);
    } catch (err) {
        return next(err);
    }
};
