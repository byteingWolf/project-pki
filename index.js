const express = require('express');
const path = require('path');
const PORT = process.env.PORT || 3000;
const { google } = require('googleapis');
const OAuth2Data = require('./google_key.json');
const { Pool } = require('pg');
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
app.get('/', (req, res) => res.render('pages/index', { auth: auth }))
app.get('/log', (req, res) => {
    if (!auth) {
        const url = oAuth2Client.generateAuthUrl({
            access_type: 'offline',
            scope: 'https://www.googleapis.com/auth/userinfo.profile'
        });
        res.redirect(url);
    } else {
        const oauth_v2 = google.oauth2({ auth: oAuth2Client, version: 'v2' });
        oauth_v2.userinfo.v2.me.get(function (err, result) {
            if (err) {
                console.log(err);
            } else {
                auth = result.data.name;
                user_image = result.data.picture
            }
            res.render('pages/index', { auth: auth, user_picture: user_image });
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
    if (auth) {
        oAuth2Client.revokeCredentials();
        auth = false;
        res.redirect('/')
    }
});

const getPool = () => new Pool({
    connectionString: "postgres://qinzjcnqfmoyrs:6f227b6fc9409dedd626f7b54c8d576595a83c9bdffa3af103e948dd8d97281c@ec2-35-170-85-206.compute-1.amazonaws.com:5432/d4895c1g577mqb"
})

const client = getPool();
client.connect();

app.get('/getUsers', (request, response) => {
    console.log('Pobieram dane ...');
    client.query('SELECT * FROM public."Users"', (error, res) => {
        if (error) {
            throw error
        }
        console.log('Dostałem ...');
        for (let row of res.rows) {
            console.log(JSON.stringify(row));
        }
    })
})
app.listen(PORT, () => console.log(`Listening on ${PORT}`));
