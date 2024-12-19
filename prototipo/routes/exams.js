const express = require('express');
const router = express.Router();
const db = require('../database/connection');
const { isAuthenticated } = require('./auth');

const baseUrl = "https://api.uniparthenope.it";


router.get('/subbed', async (req, res) => {
    var arr = []
    const [rows] = await db.query("SELECT exam_name FROM iscrizioni WHERE username = ?", [req.session.username])
    rows.forEach(element => {
        arr.push(element)
    });
    res.send(arr)
})
async function callApi(matId, authToken) {
    const headers = new Headers({
        'Authorization': 'Basic ' + authToken,
    });

    
    try {
        const response = await fetch(`${baseUrl}/UniparthenopeApp/v2/students/myExams/${matId}`, {
            method: 'GET',
            headers: headers,
        });

        const responseBody = await response.json();

        return responseBody;
    } catch (error) {
        console.error("API error: ", error);
        return { status: 500, error: "API error" };
    }
}
router.get('/', async (req, res) => {
    var array = [];
    const data = await callApi(req.session.matId, req.session.authToken);

    data.filter(obj => obj.status?.esito === "F")
        .forEach(obj => {
            var name = obj.nome.split(' E ')[0];
            array.push({ name: name, anno: obj.annoId });
        });

    res.json(array);
});


module.exports = router;
