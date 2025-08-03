const express = require('express');
const path = require('path');
const bodyParser = require('body-parser');
const con = require('../../../../connection');

const app = express();
const PORT = 3000;

app.use(bodyParser.urlencoded({ extended: false }));
app.use(express.static(path.join(__dirname, 'public')));

app.get('/add_user', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'add_user.html'));
});

app.get('/update_user', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'update_user.html'));
});

app.get('/', (req, res) => {
    res.redirect('/user');
});
