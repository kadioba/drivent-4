import { notFoundError } from '@/errors';
import ticketsRepository from '@/repositories/tickets-repository';
import enrollmentRepository from '@/repositories/enrollment-repository';
import { forbiddenError } from '@/errors/forbidden-error';
import roomRepository from '@/repositories/room-repository';
import bookingRepository from '@/repositories/bookigns-repository';

async function getBookingByUserId(userId: number) {
  const booking = await bookingRepository.findBookingByUserId(userId);

  if (!booking) throw notFoundError();

  return booking;
}

async function createBooking(roomId: number, userId: number) {
  const enrollment = await enrollmentRepository.findWithAddressByUserId(userId);
  if (!enrollment) throw forbiddenError('enrollment not found');

  const ticket = await ticketsRepository.findTicketByEnrollmentId(enrollment.id);
  if (!ticket) throw forbiddenError('ticket not found');
  if (ticket.status !== 'PAID') throw forbiddenError('ticket not paid');
  if (ticket.TicketType.isRemote === true) throw forbiddenError('ticket is remote');
  if (ticket.TicketType.includesHotel === false) throw forbiddenError('ticket does not include hotel');

  const room = await roomRepository.findRoomById(roomId);
  if (!room) throw notFoundError();
  if (room.capacity <= room.Booking.length) throw forbiddenError('room is full');

  const booking = await bookingRepository.createBooking(roomId, userId);

  return booking;
}

async function updateBooking(bookingId: number, roomId: number, userId: number) {
  const enrollment = await enrollmentRepository.findWithAddressByUserId(userId);
  if (!enrollment) throw forbiddenError('enrollment not found');

  const ticket = await ticketsRepository.findTicketByEnrollmentId(enrollment.id);
  if (!ticket) throw forbiddenError('ticket not found');
  if (ticket.status !== 'PAID') throw forbiddenError('ticket not paid');
  if (ticket.TicketType.isRemote === true) throw forbiddenError('ticket is remote');
  if (ticket.TicketType.includesHotel === false) throw forbiddenError('ticket does not include hotel');

  const room = await roomRepository.findRoomById(roomId);
  if (!room) throw notFoundError();
  if (room.capacity <= room.Booking.length) throw forbiddenError('room is full');

  const booking = await bookingRepository.findBookingByUserId(userId);
  if (!booking) throw forbiddenError('booking not found');
  if (booking.id !== bookingId) throw forbiddenError('booking does not belong to user');

  const updatedBooking = await bookingRepository.updateBooking(bookingId, roomId);
  return updatedBooking;
}

const bookingService = {
  getBookingByUserId,
  createBooking,
  updateBooking,
};

export default bookingService;
