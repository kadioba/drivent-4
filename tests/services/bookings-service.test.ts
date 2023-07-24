import faker from '@faker-js/faker';
import { createEnrollmentWithAddress, createTicket, createTicketTypeRemote, createTicketTypeWithHotel, createTicketTypeWithoutHotel } from '../factories';
import { cleanDb } from '../helpers';
import bookingService from 'services/bookings-service';
import enrollmentRepository from '@/repositories/enrollment-repository';
import ticketsRepository from '@/repositories/tickets-repository';
import { init } from '@/app';

beforeAll(async () => {
  await init();
  await cleanDb();
});

beforeEach(() => {
  jest.clearAllMocks();
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
});
