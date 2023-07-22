import supertest from 'supertest';
import httpStatus from 'http-status';
import faker from '@faker-js/faker';
import * as jwt from 'jsonwebtoken';
import { TicketStatus } from '@prisma/client';
import {
  createEnrollmentWithAddress,
  createHotel,
  createPayment,
  createRoomWithHotelId,
  createTicket,
  createTicketTypeWithHotel,
  createUser,
} from '../factories';
import { cleanDb, generateValidToken } from '../helpers';
import { createBooking } from '../factories/booking-factory';
import app, { init } from '@/app';

beforeAll(async () => {
  await init();
});

beforeEach(async () => {
  await cleanDb();
});

const server = supertest(app);

describe('GET /booking', () => {
  it('should respond with status 401 if no token is given', async () => {
    const response = await server.get('/booking');

    expect(response.status).toBe(httpStatus.UNAUTHORIZED);
  });

  it('should respond with status 401 if given token is not valid', async () => {
    const token = faker.lorem.word();

    const response = await server.get('/booking').set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(httpStatus.UNAUTHORIZED);
  });

  it('should respond with status 401 if there is no session for given token', async () => {
    const userWithoutSession = await createUser();
    const token = jwt.sign({ userId: userWithoutSession.id }, process.env.JWT_SECRET);

    const response = await server.get('/booking').set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(httpStatus.UNAUTHORIZED);
  });

  describe('when token is valid', () => {
    it('should respond with status 200 and return booking details when user has a booking', async () => {
      // Criar um  usuario
      const user = await createUser();
      // Criar uma sessao e um token para o usuario
      const token = generateValidToken(user);
      // Criar um cadastro para o usuario
      const enrollment = await createEnrollmentWithAddress(user);
      // Criar um tipo de ingresso
      const ticketType = await createTicketTypeWithHotel();
      // Criar um ingresso para o usuario
      const ticket = await createTicket(enrollment.id, ticketType.id, TicketStatus.PAID);
      // Criar um pagamento para o ingresso
      await createPayment(ticket.id, ticketType.price);
      // Criar um hotel
      const hotel = await createHotel();
      // Criar um quarto para o hotel
      const room = await createRoomWithHotelId(hotel.id);
      // Criar uma reserva para o quarto
      const booking = await createBooking(room.id, user.id);

      const response = await server.get('/booking').set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(httpStatus.OK);
      expect(response.body).toEqual({
        bookingId: booking.id,
        Room: {
          id: room.id,
          name: room.name,
          capacity: room.capacity,
          hotelId: room.hotelId,
          createdAt: room.createdAt.toISOString(),
          updatedAt: room.updatedAt.toISOString(),
        },
      });
    });
  });
});

describe('POST /booking', () => {
  it('should respond with status 401 if no token is given', async () => {
    const response = await server.post('/booking');

    expect(response.status).toBe(httpStatus.UNAUTHORIZED);
  });

  it('should respond with status 401 if given token is not valid', async () => {
    const token = faker.lorem.word();

    const response = await server.post('/booking').set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(httpStatus.UNAUTHORIZED);
  });

  it('should respond with status 401 if there is no session for given token', async () => {
    const userWithoutSession = await createUser();
    const token = jwt.sign({ userId: userWithoutSession.id }, process.env.JWT_SECRET);

    const response = await server.post('/booking').set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(httpStatus.UNAUTHORIZED);
  });
  describe('when token is valid', () => {
    it('should respond with status 200 and return bookingId when user has a booking', async () => {
      // Criar um  usuario
      const user = await createUser();
      // Criar uma sessao e um token para o usuario
      const token = generateValidToken(user);
      // Criar um cadastro para o usuario
      const enrollment = await createEnrollmentWithAddress(user);
      // Criar um tipo de ingresso
      const ticketType = await createTicketTypeWithHotel();
      // Criar um ingresso para o usuario
      const ticket = await createTicket(enrollment.id, ticketType.id, TicketStatus.PAID);
      // Criar um pagamento para o ingresso
      await createPayment(ticket.id, ticketType.price);
      // Criar um hotel
      const hotel = await createHotel();
      // Criar um quarto para o hotel
      const room = await createRoomWithHotelId(hotel.id);

      const body = { roomId: room.id };

      const response = await server.post('/booking').set('Authorization', `Bearer ${token}`).send(body);

      expect(response.status).toBe(httpStatus.OK);
      expect(response.body).toEqual({
        bookingId: expect.any(Number),
      });
    });
  });
});

describe('PUT /booking/bookingId', () => {
  it();
});
