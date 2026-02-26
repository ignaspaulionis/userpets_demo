const request = require('supertest');
const app = require('../app');

describe('Pet-Tag relationships', () => {
  it('assigns and removes tag from pet', async () => {
    const pet = await request(app).post('/pets').send({ name: 'Buddy', type: 'dog', age: 2 });
    const tag = await request(app).post('/tags').send({ name: 'Playful' });

    const assign = await request(app).post(`/pets/${pet.body.id}/tags/${tag.body.id}`);
    expect(assign.status).toBe(200);
    expect(assign.body.Tags.length).toBe(1);

    const remove = await request(app).delete(`/pets/${pet.body.id}/tags/${tag.body.id}`);
    expect(remove.status).toBe(204);
  });

  it('returns proper errors for missing pet/tag', async () => {
    const tag = await request(app).post('/tags').send({ name: 'Solo' });
    const pet = await request(app).post('/pets').send({ name: 'Buddy', type: 'dog', age: 2 });

    const missingPet = await request(app).post(`/pets/999/tags/${tag.body.id}`);
    expect(missingPet.status).toBe(404);

    const missingTag = await request(app).post(`/pets/${pet.body.id}/tags/999`);
    expect(missingTag.status).toBe(404);
  });
});
