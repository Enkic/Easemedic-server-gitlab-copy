import { hashSync } from 'bcrypt';

export class UserInfos {
    firstName: string;
    lastName: string;
    email: string;
    profilePictureUrl: string | null;
    hashPass: string;
    isActive: Boolean;

    constructor(
        firstName: string,
        lastName: string,
        email: string,
        profilePictureUrl: string | null,
        hashPass: string,
        isActive: Boolean
    ) {
        this.firstName = firstName;
        this.lastName = lastName;
        this.email = email;
        this.profilePictureUrl = profilePictureUrl;
        this.hashPass = hashPass;
        this.isActive = isActive;
    }
}
