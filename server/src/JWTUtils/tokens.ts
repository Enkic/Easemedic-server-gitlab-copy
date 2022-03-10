import jwt from 'jsonwebtoken';

export interface Payload {
    email: string;
    iat: number;
}

export const getDecodedPayload = (token: string) => {
    const decoded = jwt.decode(token);

    var decodedStr = JSON.stringify(decoded);
    var decodedObj = JSON.parse(decodedStr);

    return decodedObj;
};

export const signToken = (
    payload: Payload,
    secretKey: string | undefined,
    expiresIn: string | undefined
) => {
    if (!secretKey || !expiresIn || !payload) {
        return undefined;
    }

    const token = jwt.sign(payload, secretKey, {
        expiresIn: expiresIn
    });

    return token;
};
