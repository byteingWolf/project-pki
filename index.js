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
var user_image = false;

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
            res.render('pages/index',{auth: auth,user_picture :user_image});
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

app.listen(PORT, () => console.log(`Listening on ${PORT}`));