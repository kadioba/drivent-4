import faker from '@faker-js/faker';
import {
  createEnrollmentWithAddress,
  createFullRoom,
  createHotel,
  createRoomWithHotelId,
  createTicket,
  createTicketTypeRemote,
  createTicketTypeWithHotel,
  createTicketTypeWithoutHotel,
} from '../factories';
import { cleanDb } from '../helpers';
import { createBooking } from '../factories/booking-factory';
import bookingService from 'services/bookings-service';
import enrollmentRepository from '@/repositories/enrollment-repository';
import ticketsRepository from '@/repositories/tickets-repository';
import { init } from '@/app';
import roomRepository from '@/repositories/room-repository';
import bookingRepository from '@/repositories/bookigns-repository';

beforeAll(async () => {
  await init();
  await cleanDb();
});

beforeEach(() => {
  jest.clearAllMocks();
});

describe('getBookingByUserId', () => {
  it('should throw notFoundError if booking is not found', async () => {
    const userId = faker.datatype.number();

    jest.spyOn(bookingRepository, 'findBookingByUserId').mockResolvedValueOnce(null);

    const promise = bookingService.getBookingByUserId(userId);

    expect(promise).rejects.toEqual({
      name: 'NotFoundError',
      message: 'No result for this search!',
    });
  });
  it('should return a booking', async () => {
    const user = await createEnrollmentWithAddress();
    const hotel = await createHotel();
    const room = await createRoomWithHotelId(hotel.id);
    const booking = await createBooking(room.id, user.userId);

    jest.spyOn(bookingRepository, 'findBookingByUserId').mockResolvedValueOnce({ id: booking.id, Room: room });

    const response = await bookingService.getBookingByUserId(user.userId);

    expect(response).toEqual({ id: booking.id, Room: room });
  });
});

describe('createBooking', () => {
  it('should throw forbiddenError if enrollment is not found', async () => {
    const roomId = faker.datatype.number();
    const userId = faker.datatype.number();
    // mockar enrollmentRepository.findWithAddressByUserId para retornar null
    jest.spyOn(enrollmentRepository, 'findWithAddressByUserId').mockResolvedValueOnce(null);

    const promise = bookingService.createBooking(roomId, userId);

    expect(promise).rejects.toEqual({
      name: 'ForbiddenError',
      message: 'Forbidden! enrollment not found',
    });
  });
  it('should throw forbiddenError if ticket is not found', async () => {
    const roomId = faker.datatype.number();
    const enrollment = await createEnrollmentWithAddress();
    // mockar enrollmentRepository.findWithAddressByUserId para retornar enrollment
    jest.spyOn(enrollmentRepository, 'findWithAddressByUserId').mockResolvedValueOnce(enrollment);
    // mockar ticketsRepository.findTicketByEnrollmentId para retornar null
    jest.spyOn(ticketsRepository, 'findTicketByEnrollmentId').mockResolvedValueOnce(null);

    const promise = bookingService.createBooking(roomId, enrollment.userId);

    expect(promise).rejects.toEqual({
      name: 'ForbiddenError',
      message: 'Forbidden! ticket not found',
    });
  });
  it('should throw forbiddenError if ticket status is not PAID', async () => {
    const roomId = faker.datatype.number();
    const enrollment = await createEnrollmentWithAddress();
    const ticketType = await createTicketTypeWithHotel();
    const ticket = await createTicket(enrollment.id, ticketType.id, 'RESERVED');

    jest.spyOn(enrollmentRepository, 'findWithAddressByUserId').mockResolvedValueOnce(enrollment);
    jest
      .spyOn(ticketsRepository, 'findTicketByEnrollmentId')
      .mockResolvedValueOnce({ ...ticket, TicketType: ticketType });

    const promise = bookingService.createBooking(roomId, enrollment.userId);

    expect(promise).rejects.toEqual({
      name: 'ForbiddenError',
      message: 'Forbidden! ticket not paid',
    });
  });
  it('should throw forbiddenError if ticketType is remote', async () => {
    const roomId = faker.datatype.number();
    const enrollment = await createEnrollmentWithAddress();
    const ticketType = await createTicketTypeRemote();
    const ticket = await createTicket(enrollment.id, ticketType.id, 'PAID');

    jest.spyOn(enrollmentRepository, 'findWithAddressByUserId').mockResolvedValueOnce(enrollment);
    jest
      .spyOn(ticketsRepository, 'findTicketByEnrollmentId')
      .mockResolvedValueOnce({ ...ticket, TicketType: ticketType });

    const promise = bookingService.createBooking(roomId, enrollment.userId);

    expect(promise).rejects.toEqual({
      name: 'ForbiddenError',
      message: 'Forbidden! ticket is remote',
    });
  });
  it('should throw forbiddenError if ticketType does not includes hotel', async () => {
    const roomId = faker.datatype.number();
    const enrollment = await createEnrollmentWithAddress();
    const ticketType = await createTicketTypeWithoutHotel();
    const ticket = await createTicket(enrollment.id, ticketType.id, 'PAID');

    jest.spyOn(enrollmentRepository, 'findWithAddressByUserId').mockResolvedValueOnce(enrollment);
    jest
      .spyOn(ticketsRepository, 'findTicketByEnrollmentId')
      .mockResolvedValueOnce({ ...ticket, TicketType: ticketType });

    const promise = bookingService.createBooking(roomId, enrollment.userId);

    expect(promise).rejects.toEqual({
      name: 'ForbiddenError',
      message: 'Forbidden! ticket does not include hotel',
    });
  });
  it('should throw notFoundError if room is not found', async () => {
    const roomId = faker.datatype.number();
    const enrollment = await createEnrollmentWithAddress();
    const ticketType = await createTicketTypeWithHotel();
    const ticket = await createTicket(enrollment.id, ticketType.id, 'PAID');

    jest.spyOn(enrollmentRepository, 'findWithAddressByUserId').mockResolvedValueOnce(enrollment);
    jest
      .spyOn(ticketsRepository, 'findTicketByEnrollmentId')
      .mockResolvedValueOnce({ ...ticket, TicketType: ticketType });
    jest.spyOn(roomRepository, 'findRoomById').mockResolvedValueOnce(null);

    const promise = bookingService.createBooking(roomId, enrollment.userId);

    expect(promise).rejects.toEqual({
      name: 'NotFoundError',
      message: 'No result for this search!',
    });
  });
  it('should throw forbiddenError if room is full', async () => {
    const enrollment = await createEnrollmentWithAddress();
    const ticketType = await createTicketTypeWithHotel();
    const ticket = await createTicket(enrollment.id, ticketType.id, 'PAID');
    const hotel = await createHotel();
    const userInRoom = await createEnrollmentWithAddress();
    const room = await createFullRoom(hotel.id, userInRoom.userId);

    jest.spyOn(enrollmentRepository, 'findWithAddressByUserId').mockResolvedValueOnce(enrollment);
    jest
      .spyOn(ticketsRepository, 'findTicketByEnrollmentId')
      .mockResolvedValueOnce({ ...ticket, TicketType: ticketType });
    jest.spyOn(roomRepository, 'findRoomById').mockResolvedValueOnce(room);

    const promise = bookingService.createBooking(room.id, enrollment.userId);

    expect(promise).rejects.toEqual({
      name: 'ForbiddenError',
      message: 'Forbidden! room is full',
    });
  });
  it('should create a booking', async () => {
    const enrollment = await createEnrollmentWithAddress();
    const ticketType = await createTicketTypeWithHotel();
    const ticket = await createTicket(enrollment.id, ticketType.id, 'PAID');
    const hotel = await createHotel();
    const room = await createRoomWithHotelId(hotel.id);
    const booking = await createBooking(room.id, enrollment.userId);

    jest.spyOn(enrollmentRepository, 'findWithAddressByUserId').mockResolvedValueOnce(enrollment);
    jest
      .spyOn(ticketsRepository, 'findTicketByEnrollmentId')
      .mockResolvedValueOnce({ ...ticket, TicketType: ticketType });
    jest.spyOn(roomRepository, 'findRoomById').mockResolvedValueOnce({ ...room, Booking: [] });
    jest.spyOn(bookingRepository, 'createBooking').mockResolvedValueOnce(booking);

    const response = await bookingService.createBooking(room.id, enrollment.userId);

    expect(response).toEqual(booking);
  });
});

describe('updateBooking', () => {
  it('should throw forbiddenError if enrollment is not found', async () => {
    const roomId = faker.datatype.number();
    const userId = faker.datatype.number();
    const bookingId = faker.datatype.number();
    // mockar enrollmentRepository.findWithAddressByUserId para retornar null
    jest.spyOn(enrollmentRepository, 'findWithAddressByUserId').mockResolvedValueOnce(null);

    const promise = bookingService.updateBooking(bookingId, roomId, userId);

    expect(promise).rejects.toEqual({
      name: 'ForbiddenError',
      message: 'Forbidden! enrollment not found',
    });
  });
  it('should throw forbiddenError if ticket is not found', async () => {
    const roomId = faker.datatype.number();
    const enrollment = await createEnrollmentWithAddress();
    const bookingId = faker.datatype.number();
    // mockar enrollmentRepository.findWithAddressByUserId para retornar enrollment
    jest.spyOn(enrollmentRepository, 'findWithAddressByUserId').mockResolvedValueOnce(enrollment);
    // mockar ticketsRepository.findTicketByEnrollmentId para retornar null
    jest.spyOn(ticketsRepository, 'findTicketByEnrollmentId').mockResolvedValueOnce(null);

    const promise = bookingService.updateBooking(bookingId, roomId, enrollment.userId);

    expect(promise).rejects.toEqual({
      name: 'ForbiddenError',
      message: 'Forbidden! ticket not found',
    });
  });
  it('should throw forbiddenError if ticket status is not PAID', async () => {
    const roomId = faker.datatype.number();
    const bookingId = faker.datatype.number();
    const enrollment = await createEnrollmentWithAddress();
    const ticketType = await createTicketTypeWithHotel();
    const ticket = await createTicket(enrollment.id, ticketType.id, 'RESERVED');

    jest.spyOn(enrollmentRepository, 'findWithAddressByUserId').mockResolvedValueOnce(enrollment);
    jest
      .spyOn(ticketsRepository, 'findTicketByEnrollmentId')
      .mockResolvedValueOnce({ ...ticket, TicketType: ticketType });

    const promise = bookingService.updateBooking(bookingId, roomId, enrollment.userId);

    expect(promise).rejects.toEqual({
      name: 'ForbiddenError',
      message: 'Forbidden! ticket not paid',
    });
  });
  it('should throw forbiddenError if ticketType is remote', async () => {
    const roomId = faker.datatype.number();
    const bookingId = faker.datatype.number();
    const enrollment = await createEnrollmentWithAddress();
    const ticketType = await createTicketTypeRemote();
    const ticket = await createTicket(enrollment.id, ticketType.id, 'PAID');

    jest.spyOn(enrollmentRepository, 'findWithAddressByUserId').mockResolvedValueOnce(enrollment);
    jest
      .spyOn(ticketsRepository, 'findTicketByEnrollmentId')
      .mockResolvedValueOnce({ ...ticket, TicketType: ticketType });

    const promise = bookingService.updateBooking(bookingId, roomId, enrollment.userId);

    expect(promise).rejects.toEqual({
      name: 'ForbiddenError',
      message: 'Forbidden! ticket is remote',
    });
  });
  it('should throw forbiddenError if ticketType does not includes hotel', async () => {
    const roomId = faker.datatype.number();
    const bookingId = faker.datatype.number();
    const enrollment = await createEnrollmentWithAddress();
    const ticketType = await createTicketTypeWithoutHotel();
    const ticket = await createTicket(enrollment.id, ticketType.id, 'PAID');

    jest.spyOn(enrollmentRepository, 'findWithAddressByUserId').mockResolvedValueOnce(enrollment);
    jest
      .spyOn(ticketsRepository, 'findTicketByEnrollmentId')
      .mockResolvedValueOnce({ ...ticket, TicketType: ticketType });

    const promise = bookingService.updateBooking(bookingId, roomId, enrollment.userId);

    expect(promise).rejects.toEqual({
      name: 'ForbiddenError',
      message: 'Forbidden! ticket does not include hotel',
    });
  });
  it('should throw notFoundError if room is not found', async () => {
    const roomId = faker.datatype.number();
    const bookingId = faker.datatype.number();
    const enrollment = await createEnrollmentWithAddress();
    const ticketType = await createTicketTypeWithHotel();
    const ticket = await createTicket(enrollment.id, ticketType.id, 'PAID');

    jest.spyOn(enrollmentRepository, 'findWithAddressByUserId').mockResolvedValueOnce(enrollment);
    jest
      .spyOn(ticketsRepository, 'findTicketByEnrollmentId')
      .mockResolvedValueOnce({ ...ticket, TicketType: ticketType });
    jest.spyOn(roomRepository, 'findRoomById').mockResolvedValueOnce(null);

    const promise = bookingService.updateBooking(bookingId, roomId, enrollment.userId);

    expect(promise).rejects.toEqual({
      name: 'NotFoundError',
      message: 'No result for this search!',
    });
  });
  it('should throw forbiddenError if room is full', async () => {
    const bookingId = faker.datatype.number();
    const enrollment = await createEnrollmentWithAddress();
    const ticketType = await createTicketTypeWithHotel();
    const ticket = await createTicket(enrollment.id, ticketType.id, 'PAID');
    const hotel = await createHotel();
    const userInRoom = await createEnrollmentWithAddress();
    const room = await createFullRoom(hotel.id, userInRoom.userId);

    jest.spyOn(enrollmentRepository, 'findWithAddressByUserId').mockResolvedValueOnce(enrollment);
    jest
      .spyOn(ticketsRepository, 'findTicketByEnrollmentId')
      .mockResolvedValueOnce({ ...ticket, TicketType: ticketType });
    jest.spyOn(roomRepository, 'findRoomById').mockResolvedValueOnce(room);

    const promise = bookingService.updateBooking(bookingId, room.id, enrollment.userId);

    expect(promise).rejects.toEqual({
      name: 'ForbiddenError',
      message: 'Forbidden! room is full',
    });
  });
  it('should throw forbiddenError if booking is not found', async () => {
    const bookingId = faker.datatype.number();
    const enrollment = await createEnrollmentWithAddress();
    const ticketType = await createTicketTypeWithHotel();
    const ticket = await createTicket(enrollment.id, ticketType.id, 'PAID');
    const hotel = await createHotel();
    const room = await createRoomWithHotelId(hotel.id);

    jest.spyOn(enrollmentRepository, 'findWithAddressByUserId').mockResolvedValueOnce(enrollment);
    jest
      .spyOn(ticketsRepository, 'findTicketByEnrollmentId')
      .mockResolvedValueOnce({ ...ticket, TicketType: ticketType });
    jest.spyOn(roomRepository, 'findRoomById').mockResolvedValueOnce({ ...room, Booking: [] });
    jest.spyOn(bookingRepository, 'findBookingByUserId').mockResolvedValueOnce(null);

    const promise = bookingService.updateBooking(bookingId, room.id, enrollment.userId);

    expect(promise).rejects.toEqual({
      name: 'ForbiddenError',
      message: 'Forbidden! booking not found',
    });
  });
  it('should throw forbiddenError if booking does not belong to user', async () => {
    const enrollment = await createEnrollmentWithAddress();
    const ticketType = await createTicketTypeWithHotel();
    const ticket = await createTicket(enrollment.id, ticketType.id, 'PAID');
    const hotel = await createHotel();
    const room = await createRoomWithHotelId(hotel.id);
    const booking = await createBooking(room.id, enrollment.userId);
    const sentBookingId = faker.datatype.number();

    jest.spyOn(enrollmentRepository, 'findWithAddressByUserId').mockResolvedValueOnce(enrollment);
    jest
      .spyOn(ticketsRepository, 'findTicketByEnrollmentId')
      .mockResolvedValueOnce({ ...ticket, TicketType: ticketType });
    jest.spyOn(roomRepository, 'findRoomById').mockResolvedValueOnce({ ...room, Booking: [] });
    jest.spyOn(bookingRepository, 'findBookingByUserId').mockResolvedValueOnce({ Room: room, id: booking.id });

    const promise = bookingService.updateBooking(sentBookingId, room.id, enrollment.userId);

    expect(promise).rejects.toEqual({
      name: 'ForbiddenError',
      message: 'Forbidden! booking does not belong to user',
    });
  });
  it('should update a booking', async () => {
    const enrollment = await createEnrollmentWithAddress();
    const ticketType = await createTicketTypeWithHotel();
    const ticket = await createTicket(enrollment.id, ticketType.id, 'PAID');
    const hotel = await createHotel();
    const room = await createRoomWithHotelId(hotel.id);
    const newRoom = await createRoomWithHotelId(hotel.id);
    const booking = await createBooking(room.id, enrollment.userId);

    jest.spyOn(enrollmentRepository, 'findWithAddressByUserId').mockResolvedValueOnce(enrollment);
    jest
      .spyOn(ticketsRepository, 'findTicketByEnrollmentId')
      .mockResolvedValueOnce({ ...ticket, TicketType: ticketType });
    jest.spyOn(roomRepository, 'findRoomById').mockResolvedValueOnce({ ...room, Booking: [] });
    jest.spyOn(bookingRepository, 'findBookingByUserId').mockResolvedValueOnce({ Room: room, id: booking.id });
    jest.spyOn(bookingRepository, 'updateBooking').mockResolvedValueOnce({ ...booking, roomId: newRoom.id });

    const response = await bookingService.updateBooking(booking.id, newRoom.id, enrollment.userId);

    expect(response).toEqual({ ...booking, roomId: newRoom.id });
  });
});
