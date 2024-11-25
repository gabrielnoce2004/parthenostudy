const express = require('express');
const router = express.Router();
const path = require('path');

router.get('/', (req, res) => {
    if (!req.session.loggedin) {
        return res.redirect('/login'); 
    }

    res.sendFile(path.resolve(__dirname, '..', 'views', 'dashboard.html'));
});


module.exports = router;
