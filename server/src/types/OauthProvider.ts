export var OauthProvider = {
    facebook: {
        name: 'facebook',
        uri: 'https://graph.facebook.com/me',
        queryTerms: 'email,first_name,last_name,picture'
    },
    google: {
        name: 'google',
        uri: 'https://openidconnect.googleapis.com/v1/userinfo',
        queryTerms: ['email', 'image']
    }
};
