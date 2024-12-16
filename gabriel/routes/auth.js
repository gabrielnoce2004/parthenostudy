const express = require('express');
const router = express.Router();


function isAuthenticated(req, res) {
    if (req.session.loggedin) return true;
    res.status(401).send('Non autenticato');
}

router.get('/logout', (req, res) => {
    req.session.destroy(err => {
        if (err) return res.send('Errore durante il logout');
        res.redirect('/login');
    });
});

module.exports = { router, isAuthenticated };
