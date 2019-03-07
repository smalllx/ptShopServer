var express = require('express');
var cors = require('cors');
var bodyParser = require('body-parser');
var router = require('./router');
var app = express();

app.use(cors({
    'allowedHeaders': ['sessionId', 'Content-Type'],
    'exposedHeaders': ['sessionId'],
    'origin': '*',
    'methods': 'GET,HEAD,PUT,PATCH,POST,DELETE',
    'preflightContinue': false
}))
app.use(bodyParser.urlencoded({extended:false})); //解析application/x-www-form-urlencoded
app.use(bodyParser.json()) //解析application/json

app.use(router)
var server = app.listen(3000, function() {
    console.log('server is running...')
})