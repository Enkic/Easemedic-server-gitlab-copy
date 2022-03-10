import { Response } from 'express';
import auth from 'basic-auth';
import User from '../models/User';
import SecondaryUser from '../models/SecondaryUser';
import PharmacistUser from '../models/PharmacistUser';
import { UserInfos } from './UserInfos';

export interface ExtendedResponse extends Response {
    locals: {
        credentials: auth.BasicAuthResult;
        user: User;
        pharmaUser: PharmacistUser;
        secondaryUser: SecondaryUser;
        userInfos: UserInfos;
        activateAccountCode: string;
    };
}
