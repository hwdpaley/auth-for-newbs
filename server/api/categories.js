const express = require('express');
const Joi = require('joi');

const db = require('../db/connection');
const categories = db.get('categories');

const schema = Joi.object().keys({
  name: Joi.string().trim().max(100).required(),
  description: Joi.string().trim().required()
});

const router = express.Router();

router.get('/categories', (req, res) => {
  categories.find()
    .then(notes => {
      res.json(notes);
    });
});

router.post('/categories', (req, res, next) => {
  const result = Joi.validate(req.body, schema);
  if (result.error === null) {
    const category = {
      ...req.body,
    };

    categories
      .insert(category)
      .then(category => {
        res.json(category);
      });
  } else {
    const error = new Error(result.error);
    res.status(422);
    next(error);
  }
});

module.exports = router;
