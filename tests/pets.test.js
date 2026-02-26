const request = require('supertest');
const app = require('../app');

describe('Pets API', () => {
  const validPet = { name: 'Buddy', type: 'dog', age: 3 };

  it('creates and validates pet payloads', async () => {
    const ok = await request(app).post('/pets').send(validPet);
    expect(ok.status).toBe(201);
    expect(ok.body.name).toBe('Buddy');

    const ageZero = await request(app).post('/pets').send({ name: 'Kitty', type: 'cat', age: 0 });
    expect(ageZero.status).toBe(201);

    const badType = await request(app).post('/pets').send({ name: 'Birdy', type: 'snake', age: 2 });
    expect(badType.status).toBe(400);

    const badName = await request(app).post('/pets').send({ name: 'A', type: 'dog', age: 2 });
    expect(badName.status).toBe(400);

    const badAge = await request(app).post('/pets').send({ name: 'Oldie', type: 'dog', age: -1 });
    expect(badAge.status).toBe(400);
  });

  it('handles invalid id and missing resources', async () => {
    const invalidDelete = await request(app).delete('/pets/abc');
    expect(invalidDelete.status).toBe(400);

    const missingDelete = await request(app).delete('/pets/999');
    expect(missingDelete.status).toBe(404);

    const missingPut = await request(app).put('/pets/999').send(validPet);
    expect(missingPut.status).toBe(404);
  });
});
