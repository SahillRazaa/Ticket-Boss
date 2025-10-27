'use strict';
const Joi = require('joi');

const createReservationSchema = Joi.object({
  partnerId: Joi.string().min(1).required(),
  seats: Joi.number().integer().min(1).max(10).required(),
});

const cancelReservationSchema = Joi.object({
  reservationId: Joi.string().uuid().required(), 
});

exports.validate = (schema) => (req, res, next) => {
  let data;
  if (schema === createReservationSchema) {
    data = req.body;
  } else if (schema === cancelReservationSchema) {
    data = req.params;
  }

  const { error } = schema.validate(data);

  if (error) {
    return res.status(400).json({
      error: error.details[0].message,
    });
  }
  next();
};

exports.schemas = {
  createReservationSchema,
  cancelReservationSchema,
};