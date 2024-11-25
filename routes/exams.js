const express = require('express');
const router = express.Router();
const db = require('../database/connection');
const { isAuthenticated } = require('./auth');

router.get('/', isAuthenticated, async (req, res) => {
    try {
        const [exams] = await db.query('SELECT * FROM esami');
        res.send(exams);
    } catch (err) {
        console.error(err);
        res.status(500).send('Errore nel recupero degli esami');
    }
});



module.exports = router;
