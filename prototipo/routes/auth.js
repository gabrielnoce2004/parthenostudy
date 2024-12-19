const express = require('express');
const router = express.Router();

router.get('/logout', (req, res) => {
    req.session.destroy(err => {
        if (err) return res.send('Errore durante il logout');
        res.redirect('/login');
    });
});

module.exports = { router };
