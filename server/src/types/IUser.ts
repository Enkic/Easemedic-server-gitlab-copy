import { UserType } from './UserType';

export interface IUser {
    id: number;
    createdAt: Date;
    updatedAt: Date;

    isActive: boolean;
    firstName: string;
    lastName: string;
    email: string;
    type: UserType;
}
