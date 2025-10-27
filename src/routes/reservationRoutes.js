'use strict';
const express = require('express');
const router = express.Router();
const controller = require('../controllers/reservationController');
const { validate, schemas } = require('../validators/reservationValidator');

router.post(
  '/reservations',
  validate(schemas.createReservationSchema),
  controller.createReservation
);

router.delete(
  '/reservations/:reservationId',
  validate(schemas.cancelReservationSchema), 
  controller.cancelReservation
);

router.get('/reservations', controller.getEventSummary);

module.exports = router;