const express = require('express');
const router = express.Router();
const path = require('path');





router.get('/', (req, res) => {
    if (!req.session.loggedin) {
        return res.redirect('/login'); 
    }
    res.sendFile(path.resolve(__dirname, '..', 'views', 'dashboard.html'));
});

router.get('/username', (req, res) => {
    res.json({username: req.session.username});
})
router.get('/matricola', (req, res) => {
    res.json({matricola: req.session.matricola});
})

async function callApi(authToken, persId) {
    const headers = new Headers({
        'Authorization': 'Basic ' + authToken,
        'Accept': 'image/*',
    });

    try {
        const response = await fetch(`https://api.uniparthenope.it/UniparthenopeApp/v1/general/image/${persId}`, {
            method: 'GET',
            headers: headers,
        });

        if (!response.ok) {
            throw new Error(`Errore nella richiesta dell'immagine: ${response.status}`);
        }

        const contentType = response.headers.get('Content-Type');
        if (!contentType || !contentType.startsWith('image/')) {
            throw new Error('La risposta non è un\'immagine valida.');
        }

        const arrayBuffer = await response.arrayBuffer(); 
        const imageBuffer = Buffer.from(arrayBuffer);

        return { buffer: imageBuffer, contentType };
    } catch (error) {
        throw new Error(error.message);
    }
}

router.get('/image', async (req, res) => {
    try {
        const { buffer, contentType } = await callApi(req.session.authToken, req.session.persId);
        console.log('Sending image...');
        res.set('Content-Type', contentType);
        res.send(buffer);
    } catch (error) {
        console.error('Error handling /image route:', error);
        res.status(500).json({ error: 'Impossibile caricare l\'immagine' });
    }
});


module.exports = router;
