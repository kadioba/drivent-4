import Joi from 'joi';
import { BookingBody } from '@/protocols';

export const createOrUpdateBookingSchema = Joi.object<BookingBody>({
  roomId: Joi.number().required(),
});
