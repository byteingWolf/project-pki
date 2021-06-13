const express = require('express');
const path = require('path');
const PORT = process.env.PORT || 3000;
const { google } = require('googleapis');
const OAuth2Data = require('./google_key.json');
const { Client } = require('pg');
const app = express()

const CLIENT_ID = OAuth2Data.web.client_id;
const CLIENT_SECRET = OAuth2Data.web.client_secret;
const REDIRECT_URL = OAuth2Data.web.redirect_uris

var oAuth2Client = new google.auth.OAuth2(CLIENT_ID, CLIENT_SECRET, REDIRECT_URL)
var auth = false;
var user_image = false;

const client = new Client({
    connectionString: "postgres://qinzjcnqfmoyrs:6f227b6fc9409dedd626f7b54c8d576595a83c9bdffa3af103e948dd8d97281c@ec2-35-170-85-206.compute-1.amazonaws.com:5432/d4895c1g577mqb",
    ssl: {
        rejectUnauthorized: false
    }
})
client.connect();

app.use(express.static(path.join(__dirname, 'public')))
// app.engine('pug', require('pug').__express)
// app.set('view engine', 'pug')
app.engine('html', require('ejs').renderFile);
app.set('view engine', 'html');
app.set('views', path.join(__dirname, 'views'))
app.get('/', (req, res) => {
    const usersList = [];
    client.query('SELECT * FROM public."users"', (error, resDataBase) => {
        if (error)
            throw error
        for (let row of resDataBase.rows) {
            usersList.push(row)
        }
        if(auth){
            return res.render('pages/table', { auth: auth,usersList:usersList })
        }
        return res.render('pages/table', { auth: 'User not logged, please log in',usersList:usersList })
    })
})
app.get('/log', (req, res) => {
    if (!auth) {
        const url = oAuth2Client.generateAuthUrl({
            access_type: 'offline',
            scope: 'https://www.googleapis.com/auth/userinfo.profile'
        });
        res.redirect(url);
    } else {
        const oauth_v2 = google.oauth2({ auth: oAuth2Client, version: 'v2' });
        oauth_v2.userinfo.v2.me.get(async function (err, result) {
            if (err) {
                console.log(err);
            } else {
                auth = result.data.name;
                user_image = result.data.picture
            }
            const user = await getUser(auth).catch(e => console.log(e))
            if (user.rows.length > 0) {
                updateUserCounter(auth)
            }
            else {
                addUser(auth)
            }
            res.redirect('/')
            // res.render('pages/table', { auth: auth,usersList:usersList});
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

async function updateUserCounter(userName) {
    const timeStamp = Math.floor(Date.now() / 1000)
    client.query(`UPDATE users SET counter = counter + 1,lastvisit = to_timestamp(${timeStamp}) where name = '${userName}' `, (error, res) => {
        if (error) {
            throw error
        }
        console.log(userName + " updated");
    })
}

async function addUser(userName) {
    const timeStamp = Math.floor(Date.now() / 1000)
    const list = [userName, timeStamp, timeStamp]
    return client.query(`INSERT INTO users (name,joined,lastvisit) VALUES ($1,to_timestamp($2),to_timestamp($3))`, list, (error, res) => {
        if (error) {
            throw error
        }
        console.log(userName + " addded");
    })
}

async function getUser(userName) {
    return client.query(`select * from users where name = '${userName}'`);
}

// app.get('/getUsers', (request, response) => {
//     console.log('Pobieram dane ...');
//     client.query('SELECT * FROM public."users"', (error, res) => {
//         if (error)
//             throw error
//         console.log('Dostałem ...');
//         for (let row of res.rows) {
//             console.log(JSON.stringify(row));
//         }
//     })
//     response.send('udalo sie pobrac')
// })


// app.get('/addUser', async (request, response) => {
//     const userName = 'kotek1'
//     const user = await getUser(userName)
//     if (user.rows.length > 0) {
//         console.log("istnieje")
//         updateUserCounter(userName)
//     }
//     else {
//         console.log("nie istnieje")
//         addUser(userName)
//     }
//     response.render('pages/table', { auth: auth});
// })


app.listen(PORT, () => console.log(`Listening on ${PORT}`));
