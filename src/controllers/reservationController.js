'use strict';
const { Event, Reservation, sequelize } = require('../../models');
const { v4: uuidv4 } = require('uuid');

exports.getEventSummary = async (req, res, next) => {
  try { 
    const eventId = 'node-meetup-2025';
    const event = await Event.findByPk(eventId);

    if (!event) {
      return res.status(404).json({ error: 'Event not found' });
    }

    const reservationCount = await Reservation.count({
      where: { eventId: eventId, status: 'confirmed' },
    });

    res.status(200).json({
      eventId: event.eventId,
      name: event.name,
      totalSeats: event.totalSeats,
      availableSeats: event.availableSeats,
      reservationCount: reservationCount,
      version: event.version,
    });
  } catch (error) {
    if (error.name === 'SequelizeConnectionAcquireTimeoutError') {
      return res.status(503).json({
        error: 'Server is too busy. Please try again in a moment.',
      });
    }
    next(error);
  }
};

exports.createReservation = async (req, res, next) => {
  const { partnerId, seats } = req.body;
  const eventId = 'node-meetup-2025';
  const seatsToBook = parseInt(seats, 10);

  try {
    const result = await sequelize.transaction(async (t) => {
      const event = await Event.findByPk(eventId, {
        lock: t.LOCK.UPDATE,
      });

      if (event.availableSeats < seatsToBook) {
        throw new Error('Not enough seats left');
      }

      const newAvailableSeats = event.availableSeats - seatsToBook;
      const [updatedRows] = await Event.update(
        {
          availableSeats: newAvailableSeats,
          version: event.version + 1,
        },
        {
          where: {
            eventId: eventId,
            version: event.version,
          },
          transaction: t,
        }
      );

      if (updatedRows === 0) {
        throw new Error('Conflict: Event data was modified. Please try again.');
      }

      const newReservation = await Reservation.create(
        {
          reservationId: uuidv4(),
          partnerId,
          seats: seatsToBook,
          status: 'confirmed',
          eventId: eventId,
        },
        { transaction: t }
      );

      return newReservation;
    });

    res.status(201).json({
      reservationId: result.reservationId,
      seats: result.seats,
      status: result.status,
    });
  } catch (error) {
    if (error.name === 'SequelizeConnectionAcquireTimeoutError') {
      return res.status(503).json({
        error: 'Server is too busy. Please try again in a moment.',
      });
    }
    if (
      error.message === 'Not enough seats left' ||
      error.message.includes('Conflict')
    ) {
      res.status(409).json({ error: error.message });
    } else {
      next(error);
    }
  }
};

exports.cancelReservation = async (req, res, next) => {
  const { reservationId } = req.params;
  const eventId = 'node-meetup-2025';

  try {
    await sequelize.transaction(async (t) => {
      const reservation = await Reservation.findOne({
        where: { reservationId, status: 'confirmed' },
        transaction: t,
      });

      if (!reservation) {
        throw new Error('Reservation not found or already cancelled');
      }

      const event = await Event.findByPk(eventId, {
        lock: t.LOCK.UPDATE,
        transaction: t,
      });

      await Event.update(
        {
          availableSeats: event.availableSeats + reservation.seats,
          version: event.version + 1,
        },
        {
          where: { eventId },
          transaction: t,
        }
      );

      await reservation.update(
        { status: 'cancelled' },
        { transaction: t }
      );

      return true;
    });

    res.status(204).send();
  } catch (error) {
    if (error.message.includes('Reservation not found')) {
      res.status(404).json({ error: error.message }); 
    } else {
      next(error);
    }
  }
};