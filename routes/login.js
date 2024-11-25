const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const path = require("path")
const db = require('../database/connection');


async function authenticate(username, password) {
    try {
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
    }
}
router.post('/', async (req, res) => {
    const { username, password } = req.body;

    if (await authenticate(username, password)) {
        req.session.loggedin = true;
        req.session.username = username;
        res.redirect('/dashboard');
    } else {
        res.redirect('/login?error=true');
    }
});

router.get('/', (req, res) => {
    const error = req.session.error;
    req.session.error = null;
    res.sendFile(path.resolve(__dirname, '..', 'views', 'login.html')); 
});

module.exports = router;