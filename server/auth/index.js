const express = require('express');
const Joi = require('joi');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const db = require('../db/connection');
const users = db.get('users');
users.createIndex('username', { unique: true });

const router = express.Router();

const schema = Joi.object().keys({
  username: Joi.string().regex(/(^[a-zA-Z0-9_]+$)/).min(2).max(30).required(),
  password: Joi.string().trim().min(10).required()
});
const schemaName = Joi.object().keys({
  username: Joi.string().regex(/(^[a-zA-Z0-9_]+$)/).min(2).max(30).required()
});

// const createTokenSendResponse = function(user, res, next) {
// const createTokenSendResponse = (user, res, next) => {
function createTokenSendResponse(user, res, next) {
  const payload = {
    _id: user._id,
    username: user.username
  };

  jwt.sign(payload, process.env.TOKEN_SECRET, {
    expiresIn: '1d'
  }, (err, token) => {
    if (err) {
      respondError422(res, next);
    } else {
      res.json({
        token
      });
    }
  });
}

// any route in here is pre-pended with /auth
router.get('/', (req, res) => {
  res.json({
    message: '🔐'
  });
});
router.post('/logout', (req, res) => {
  res.json({
    message: '🔐'
  });
});
router.post('/signup', (req, res, next) => {
  const result = Joi.validate(req.body, schema);
  if (result.error === null) {
    users.findOne({
      username: req.body.username
    }).then(user => {
      // if user is undefined, username is not in the db, otherwise, duplicate user detected
      if (user) {
        // there is already a user in the db with this username...
        // respond with an error!
        const error = new Error('That username is not OG. Please choose another one.');
        res.status(409);
        next(error);
      } else {
        // hash the password
        bcrypt.hash(req.body.password.trim(), 12).then(hashedPassword => {
          // insert the user with the hashed password
          const newUser = {
            username: req.body.username,
            password: hashedPassword
          };

          users.insert(newUser).then(insertedUser => {
            createTokenSendResponse(insertedUser, res, next);
          });
        });
      }
    });
  } else {
    res.status(422);
    next(result.error);
  }
});

function respondError422(res, next) {
  res.status(422);
  const error = new Error('Unable to login.');
  next(error);
}

router.post('/login', (req, res, next) => {
  const result = Joi.validate(req.body, schema);
  if (result.error === null) {
    users.findOne({
      username: req.body.username,
    }).then(user => {
      console.log(user);
      if (user) {
        console.log("user");
        bcrypt
          .compare(req.body.password, user.password)
          .then((result) => {
            console.log(result);
            if (result) {
              createTokenSendResponse(user, res, next);
            } else {
              respondError422(res, next);
            }
          });
      } else {
        respondError422(res, next);
      }
    });
  } else {
    respondError422(res, next);
  }
});

router.get('/info', (req, res, next) => {
  const authHeader = req.get('authorization');
  if (authHeader) {
    const token = authHeader.split(' ')[1];
    if (token) {
      jwt.verify(token, process.env.TOKEN_SECRET, (error, user) => {
        if (error) {
          console.log(error);
        }
        // console.log(user);
        //从数据库读出用户数据
        users.findOne({
          username: user.username,
        }).then(user => {
          console.log(user);
          if (user) {
            const admin = {
              roles: ['admin'],
              token: 'admin',
              introduction: '我是超级管理员',
              avatar: 'https://wpimg.wallstcn.com/f778738c-e4f8-4870-b634-56703b4acafe.gif',
              name: 'Super Admin'
            }
            // user.roles = ['admin'];
            res.json(admin)
          } else {
            respondError422(res, next);
          }
        });
      });
    } else {
      respondError422(res, next);
    }
  } else {
    respondError422(res, next);
  }
});

module.exports = router;
