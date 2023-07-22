import ticketService from '../tickets-service';
import { notFoundError } from '@/errors';
import ticketsRepository from '@/repositories/tickets-repository';
import enrollmentRepository from '@/repositories/enrollment-repository';
import { forbiddenError } from '@/errors/forbidden-error';
import roomRepository from '@/repositories/room-repository';

async function getBookingByUserId(userId: number) {
  const booking = await bookingRepository.findByUserId(userId);

  if (!booking) throw notFoundError();

  return booking;
}

async function createBooking(roomId: number, userId: number) {
  const enrollment = await enrollmentRepository.findWithAddressByUserId(userId);
  if (!enrollment) throw forbiddenError();

  const ticket = await ticketsRepository.findTicketByEnrollmentId(enrollment.id);
  if (!ticket) throw forbiddenError();
  if (ticket.status !== 'RESERVED') throw forbiddenError();
  if (ticket.TicketType.isRemote === true) throw forbiddenError();
  if (ticket.TicketType.includesHotel === false) throw forbiddenError();

  const room = await roomRepository.findRoomById(roomId);
  if (!room) throw notFoundError();
  if (room.capacity <= room.Booking.length) throw forbiddenError();

  const booking = await bookingRepository.create(roomId, userId);

  return booking;
}

async function updateBooking(bookingId: number, roomId: number, userId: number) {
  const enrollment = await enrollmentRepository.findWithAddressByUserId(userId);
  if (!enrollment) throw forbiddenError();

  const ticket = await ticketsRepository.findTicketByEnrollmentId(enrollment.id);
  if (!ticket) throw forbiddenError();
  if (ticket.status !== 'RESERVED') throw forbiddenError();
  if (ticket.TicketType.isRemote === true) throw forbiddenError();
  if (ticket.TicketType.includesHotel === false) throw forbiddenError();

  const room = await roomRepository.findRoomById(roomId);
  if (!room) throw notFoundError();
  if (room.capacity <= room.Booking.length) throw forbiddenError();

  const updatedBooking = await bookingRepository.updateBooking(bookingId, roomId, userId);
  return updatedBooking;
}
