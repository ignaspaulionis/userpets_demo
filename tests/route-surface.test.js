const request = require('supertest');
const app = require('../app');

describe('Route surface contract', () => {
  it('exposes core mounted routes', async () => {
    const pets = await request(app).get('/pets');
    expect(pets.status).toBe(200);
    expect(Array.isArray(pets.body)).toBe(true);

    const tags = await request(app).get('/tags');
    expect(tags.status).toBe(200);
    expect(Array.isArray(tags.body)).toBe(true);

    const register = await request(app).post('/users/register').send({
      email: 'surface@example.com',
      password: 'password123',
      fullname: 'Surface User',
    });
    expect(register.status).toBe(201);

    const login = await request(app).post('/users/login').send({
      email: 'surface@example.com',
      password: 'password123',
    });
    expect(login.status).toBe(200);
    expect(login.body).toHaveProperty('token');
  });

  it('returns 404 for non-contract routes', async () => {
    const petTags = await request(app).get('/pet-tags');
    expect(petTags.status).toBe(404);

    const petTypes = await request(app).get('/api/pets/types');
    expect(petTypes.status).toBe(404);
  });
});
