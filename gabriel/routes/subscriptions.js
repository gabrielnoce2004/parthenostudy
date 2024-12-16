const express = require('express');
const router = express.Router();
const db = require('../database/connection');
const { isAuthenticated } = require('./auth');

router.post('/subscribe', async (req, res) => {
    const { exam_name } = req.body;
    const username = req.session.username;

    try {
        const [[user]] = await db.query('SELECT ID FROM utenti WHERE username = ?', [username]);
        if (!user) return res.status(400).send('Utente non trovato');

        await db.query('INSERT INTO iscrizioni (user_id, username, exam_name) VALUES (?, ?, ?)', [user.ID, username, exam_name]);
        res.send({ success: true, message: 'Iscritto con successo' });
    } catch (err) {
        console.error(err);
        res.status(500).send('Errore durante l\'iscrizione');
    }
});

router.post('/unsubscribe', async (req,res) => {
    const { exam_name } = req.body;
    const username = req.session.username;

    try {
        const [[user]] = await db.query('SELECT ID FROM utenti WHERE username = ?', [username]);
        if (!user) return res.status(400).send('Utente non trovato');

        await db.query('DELETE FROM iscrizioni WHERE user_id = ? AND exam_name = ?', [user.ID, exam_name]);
        res.send({ success: true, message: 'Disinscritto con successo' });
    } catch (err) {
        console.error(err);
        res.status(500).send('Errore durante la disinscrizione');
    }
})

router.get('/user-exams', async (req, res) => {
    const username = req.session.username;

    try {
        const [[user]] = await db.query('SELECT ID FROM utenti WHERE username = ?', [username]);
        if (!user) return res.status(400).send('Utente non trovato');

        const [results] = await db.query(`
            SELECT i.exam_name AS nome, e.docente 
            FROM iscrizioni i
            LEFT JOIN esami e ON e.nome = i.exam_name
            WHERE i.user_id = ?
        `, [user.ID]);

        res.send(results);
    } catch (err) {
        console.error(err);
        res.status(500).send('Errore nel recupero degli esami');
    }
});


router.get('/get_username', (req,res) => {
    return res.send(req.session.username);
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
