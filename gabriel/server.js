const express = require('express');
const session = require('express-session');
const bodyParser = require('body-parser');
const path = require('path');
const config = require('./config.json');
const authRoutes = require('./routes/auth');
const examRoutes = require('./routes/exams');
const loginRoute = require('./routes/login')
const dashboardRoute = require('./routes/dashboard')

const subscriptionRoutes = require('./routes/subscriptions');

const app = express();

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(session({
    secret: 'secretKey',
    resave: false,
    saveUninitialized: true
}));

app.use(express.static(path.join(__dirname, 'views')));

app.use('/login', loginRoute)
app.use('/auth', authRoutes.router);
app.use('/exams', examRoutes);
app.use('/api/', subscriptionRoutes);
app.use('/dashboard', dashboardRoute)

app.listen(config.listen_port, () => {
    console.log(`Server in ascolto su http://localhost:${config.listen_port}`);
});
