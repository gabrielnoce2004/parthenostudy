const express = require('express');
const router = express.Router();
const db = require('../database/connection');
const { isAuthenticated } = require('./auth');

const baseUrl = "https://api.uniparthenope.it";
const apiUrl = `${baseUrl}/UniparthenopeApp/v1/students/pianoId/`; // serve il porcoddididio di stuId
const examUrl = `${baseUrl}/UniparthenopeApp/v1/students/`;

async function getPianoId(authToken) {
    const headers = new Headers({
        'Authorization': 'Basic ' + authToken,
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
async function callApi(stuId, authToken) {
    const headers = new Headers({
        'Authorization': 'Basic ' + authToken,
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
