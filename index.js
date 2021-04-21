const express = require('express');
const path = require('path');
const PORT = process.env.PORT || 5000;
const { google } = require('googleapis');
const OAuth2Data = require('./google_key.json')

const app = express()

const CLIENT_ID = OAuth2Data.web.client_id;
const CLIENT_SECRET = OAuth2Data.web.client_secret;
const REDIRECT_URL = OAuth2Data.web.redirect_uris

console.log(CLIENT_ID)
console.log(CLIENT_SECRET)
console.log(REDIRECT_URL)

const oAuth2Client = new google.auth.OAuth2(CLIENT_ID, CLIENT_SECRET, REDIRECT_URL)
var authed = false;

app.use(express.static(path.join(__dirname, 'public')))
app.set('views', path.join(__dirname, 'views'))
app.set('view engine', 'ejs')
app.get('/home', (req, res) => res.render('pages/index')) 
app.get('/', (req, res) => {
  if (!authed) {
      // Generate an OAuth URL and redirect there
      const url = oAuth2Client.generateAuthUrl({
          access_type: 'offline',
          scope: 'https://www.googleapis.com/auth/gmail.readonly'
      });
      console.log(url)
      res.redirect(url);
  } else {
      const gmail = google.gmail({ version: 'v1', auth: oAuth2Client });
      gmail.users.labels.list({
          userId: 'me',
      }, (err, res) => {
          if (err) return console.log('The API returned an error: ' + err);
          const labels = res.data.labels;
          if (labels.length) {
              console.log('Labels:');
              labels.forEach((label) => {
                  console.log(`- ${label.name}`);
              });
          } else {
              console.log('No labels found.');
          }
      });
      res.send('Logged in')
  }
})

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
              authed = true;
              res.redirect('/')
          }
      });
  }
});

app.listen(PORT, () => console.log(`Listening on ${ PORT }`));