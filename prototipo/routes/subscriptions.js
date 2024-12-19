const express = require('express');
const router = express.Router();
const db = require('../database/connection');

router.post('/subscribe', async (req, res) => {
    const { exam_name } = req.body;
    const username = req.session.username;

    try {

        await db.query('INSERT INTO iscrizioni (user_id, username, exam_name) VALUES (?, ?, ?)', [req.session.stuId, username, exam_name]);
        res.send({ success: true, message: 'Iscritto con successo' });
    } catch (err) {
        console.error(err);
        res.status(500).send('Errore durante l\'iscrizione');
    }
});

router.post('/unsubscribe', async (req,res) => {
    const { exam_name } = req.body;

    try {
        await db.query('DELETE FROM iscrizioni WHERE user_id = ? AND exam_name = ?', [req.session.stuId, exam_name]);
        res.send({ success: true, message: 'Disinscritto con successo' });
    } catch (err) {
        console.error(err);
        res.status(500).send('Errore durante la disinscrizione');
    }
})




router.get('/get_subscribed_users', async (req, res) => {
    const { examName } = req.query;
    const userName = req.session.username; 
    
    try {
        const [results] = await db.query(`SELECT username FROM iscrizioni WHERE exam_name = ? AND username != ?;`, [examName, userName]);
        res.send(results);
    } catch(err) {
        console.error(err);
        res.status(500).send('Errore nel recupero degli utenti');
    }
})

module.exports = router;
