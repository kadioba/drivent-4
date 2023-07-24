import { Router } from 'express';
import { createBooking, getBookingByUser, updateBooking } from '@/controllers/booking-controller';
import { authenticateToken, validateBody } from '@/middlewares';
import { createOrUpdateBookingSchema } from '@/schemas/booking-schemas';

const bookingsRouter = Router();

bookingsRouter
  .all('/*', authenticateToken)
  .get('/', getBookingByUser)
  .post('/', validateBody(createOrUpdateBookingSchema), createBooking)
  .put('/:bookingId', validateBody(createOrUpdateBookingSchema), updateBooking);

export { bookingsRouter };
