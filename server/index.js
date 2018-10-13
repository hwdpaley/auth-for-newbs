const express = require('express');
const volleyball = require('volleyball');
const cors = require('cors');

require('dotenv').config();

const app = express();

const middlewares = require('./auth/middlewares');
// const auth = require('./auth/index.js');
// const auth = require('./auth/index');
const auth = require('./auth');
const notes = require('./api/notes');
const categories = require('./api/categories');




app.use(volleyball);
// app.use(cors({
//   origin: ['http://localhost:9527']
// }));
var whitelist = ['http://localhost:9527', 'http://localhost:8080']
var corsOptionsDelegate = function (req, callback) {
  var corsOptions;
  if (whitelist.indexOf(req.header('Origin')) !== -1) {
    corsOptions = { origin: true } // reflect (enable) the requested origin in the CORS response
  } else {
    corsOptions = { origin: false } // disable CORS for this request
  }
  callback(null, corsOptions) // callback expects two parameters: error and options
}



app.use(express.json());
app.use(middlewares.checkTokenSetUser);

app.get('/', (req, res) => {
  res.json({
    message: '🦄🌈✨Hello World! 🌈✨🦄',
    user: req.user,
  });
});

app.use('/auth', cors(corsOptionsDelegate), auth);
app.use('/api', cors(corsOptionsDelegate), middlewares.isLoggedIn, notes);

function notFound(req, res, next) {
  res.status(404);
  const error = new Error('Not Found - ' + req.originalUrl);
  next(error);
}

function errorHandler(err, req, res, next) {
  res.status(res.statusCode || 500);
  res.json({
    message: err.message,
    stack: err.stack
  });
}

app.use(notFound);
app.use(errorHandler);

const port = process.env.PORT || 5000;
app.listen(port, () => {
  console.log('Listening on port', port);
});
