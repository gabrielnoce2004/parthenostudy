const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const path = require("path")
const db = require('../database/connection');


async function authenticate(username, password) {
    /*try {
        const query = 'SELECT * FROM utenti WHERE username = ?';
        const [rows] = await db.execute(query, [username]);

        if (rows.length === 0) {
            console.log("Utente non trovato:", username);
            return false;
        }

        const user = rows[0];
        const isPasswordValid = bcrypt.compareSync(password, user.password);

        if (isPasswordValid) {
            console.log("Accesso riuscito per l'utente:", user.username);
        } else {
            console.log("Password errata per l'utente:", username);
        }

        return isPasswordValid;
    } catch (err) {
        console.error('Errore durante l\'autenticazione:', err);
        return false;
    }*/
   return true;
}
const baseUrl = "https://api.uniparthenope.it";
const apiUrl = `${baseUrl}/UniparthenopeApp/v1/login`;

async function callApi(username, password) {
    const headers = new Headers({
        'Authorization': 'Basic ' + btoa(`${username}:${password}`),
    });

    try {
        const response = await fetch(apiUrl, {
            method: 'GET',
            headers: headers,
        });

        console.log("Response status: " + response.status);
        const responseBody = await response.json();
        console.log('Response API:', responseBody);

        return { status: response.status, data: responseBody };
    } catch (error) {
        console.error("API error: ", error);
        return { status: 500, error: "API error" };
    }
}

router.post('/', async (req, res) => {
    const { username, password } = req.body;

    if (await authenticate(username, password)) {
        const apiResponse = await callApi(username, password);

        if (apiResponse.status === 200) {
            req.session.username = `${apiResponse.data.user.firstName} ${apiResponse.data.user.lastName}`;
            req.session.matricola = apiResponse.data.user.trattiCarriera[0].matricola;
            req.session.matId = apiResponse.data.user.trattiCarriera[0].matId;
            req.session.stuId = apiResponse.data.user.trattiCarriera[0].stuId;
            req.session.authToken = btoa(`${username}:${password}`);
            req.session.loggedin = true;

            return res.redirect('/dashboard');
        } else if (apiResponse.status === 401) {
            return res.redirect('/login?error=true');
        } else {
            return res.redirect('/login?error=true');
        }
    } else {
        return res.redirect('/login?error=true');
    }
});

router.get('/', (req, res) => {
    const error = req.session.error;
    if(error) throw error;
    req.session.error = null;
    res.sendFile(path.resolve(__dirname, '..', 'views', 'login.html')); 
});



module.exports = router;