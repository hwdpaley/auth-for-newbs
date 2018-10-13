const monk = require('monk');

const db = monk('mongodb://hwdpaley:hwd191800@ds247852.mlab.com:47852/myfirstdb');
// const db = monk('localhost/auth-for-noobs');

module.exports = db;
