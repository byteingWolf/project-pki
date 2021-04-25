const express = require('express');
const path = require('path');
const PORT = process.env.PORT || 80;
const { google } = require('googleapis');
const OAuth2Data = require('./google_key.json');

const app = express()

const CLIENT_ID = OAuth2Data.web.client_id;
const CLIENT_SECRET = OAuth2Data.web.client_secret;
const REDIRECT_URL = OAuth2Data.web.redirect_uris

var oAuth2Client = new google.auth.OAuth2(CLIENT_ID, CLIENT_SECRET, REDIRECT_URL)
var auth = false;
var user_image = null;

const GITHUB_CLIENT_ID = "925eceb3fdae85614e56";
const GITHUB_SECRET_ID = "8394e9f2a8c4d511f03a44fdf2c171742f17d516"
const GITHUB_REDIRECT_URL = "https://project-pki-test.herokuapp.com/callback"
var oAuthGitHub = new google.auth.OAuth2(GITHUB_CLIENT_ID,GITHUB_SECRET_ID,GITHUB_REDIRECT_URL)
var auth_servie = false;

app.use(express.static(path.join(__dirname, 'public')))
app.engine('pug', require('pug').__express)
app.set('views', path.join(__dirname, 'views'))
app.set('view engine', 'pug')
app.get('/', (req, res) => res.render('pages/index',{auth: auth}))
app.get('/log', (req, res) => {
    if (!auth) {
        const url = oAuth2Client.generateAuthUrl({
            access_type: 'offline',
            scope: 'https://www.googleapis.com/auth/userinfo.profile'
        });
        res.redirect(url);
    }else{
        // console.log(auth)
        const oauth_v2 = google.oauth2({ auth: oAuth2Client, version: 'v2' });
        oauth_v2.userinfo.v2.me.get(function (err, result) {
            if (err) {
                console.log(err);
            } else {
                auth = result.data.name;
                user_image = result.data.picture
            }
            auth_servie = "Google"
            res.render('pages/index',{auth: auth,user_picture :user_image,auth_servie:auth_servie});
        });
    }
});

app.get('/auth/google/callback', function (req, res) {
    const code = req.query.code
    if (code) {
        // Get an access token based on our OAuth code
        oAuth2Client.getToken(code, function (err, tokens) {
            if (err) {
                console.log('Error authenticating')
                console.log(err);
            } else {
                console.log('Successfully authenticated');
                oAuth2Client.setCredentials(tokens);
                auth = true;
                res.redirect('/log')
            }
        });
    }
});

app.get('/logout', (req, res) => {
    if(auth)
    {
        oAuth2Client.revokeCredentials();
        auth = false;
        res.redirect('/')
    }
});

app.get('/logWithGitHub', (req, res) => {
    if (!auth) {
        const url = oAuthGitHub.generateAuthUrl({
            access_type: 'offline',
            scope: 'https://github.com/login/oauth/authorize'
        });
        res.redirect(url);
    }else{
        const oauth_v2 = google.oauth2({ auth: oAuthGitHub, version: 'v2' });
        oauth_v2.userinfo.v2.me.get(function (err, result) {
            if (err) {
                console.log(err);
            } else {
                auth = result.data.name;
                user_image = result.data.picture
            }
            auth_servie = "GitHub"
            res.render('pages/index',{auth: auth,user_picture :user_image,auth_servie:auth_servie});
        });
    }
});

app.get('/callback', function (req, res) {
    const code = req.query.code
    if (code) {
        // Get an access token based on our OAuth code
        oAuthGitHub.getToken(code, function (err, tokens) {
            if (err) {
                console.log('Error authenticating')
                console.log(err);
            } else {
                console.log('Successfully authenticated');
                oAuthGitHub.setCredentials(tokens);
                auth = true;
                res.redirect('/log')
            }
        });
    }
});

app.get('/logoutGitHub', (req, res) => {
    if(auth)
    {
        oAuthGitHub.revokeCredentials();
        auth = false;
        res.redirect('/')
    }
});

app.listen(PORT, () => console.log(`Listening on ${PORT}`));