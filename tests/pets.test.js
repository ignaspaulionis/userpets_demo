const request = require('supertest');
const app = require('../app');
const { Pet } = require('../models/pet');
const { Tag } = require('../models/tag');

// Wipe pets and tags before each test for isolation
beforeEach(async () => {
  // Remove junction records first, then pets and tags
  await Pet.destroy({ where: {}, truncate: true });
  await Tag.destroy({ where: {}, truncate: true });
});

describe('Pets API', () => {
  // ── GET /pets ─────────────────────────────────────────────────────────────
  describe('GET /pets', () => {
    it('returns an empty array when no pets exist', async () => {
      const res = await request(app).get('/pets');
      expect(res.status).toBe(200);
      expect(res.body).toEqual([]);
    });

    it('returns all pets with their tags', async () => {
      await Pet.create({ name: 'Buddy', type: 'dog', age: 3 });
      const res = await request(app).get('/pets');
      expect(res.status).toBe(200);
      expect(res.body).toHaveLength(1);
      expect(res.body[0]).toMatchObject({ name: 'Buddy', type: 'dog', age: 3 });
      expect(Array.isArray(res.body[0].Tags)).toBe(true);
    });
  });

  // ── POST /pets ────────────────────────────────────────────────────────────
  describe('POST /pets', () => {
    it('creates a valid pet and returns 201', async () => {
      const res = await request(app)
        .post('/pets')
        .send({ name: 'Max', type: 'cat', age: 2 });
      expect(res.status).toBe(201);
      expect(res.body).toMatchObject({ name: 'Max', type: 'cat', age: 2 });
      expect(res.body.id).toBeDefined();
    });

    it('accepts age 0 (non-negative boundary)', async () => {
      const res = await request(app)
        .post('/pets')
        .send({ name: 'Pip', type: 'bird', age: 0 });
      expect(res.status).toBe(201);
      expect(res.body.age).toBe(0);
    });

    it('lowercases the type', async () => {
      const res = await request(app)
        .post('/pets')
        .send({ name: 'Nemo', type: 'Fish', age: 1 });
      expect(res.status).toBe(201);
      expect(res.body.type).toBe('fish');
    });

    it('returns 400 for name shorter than 2 chars', async () => {
      const res = await request(app)
        .post('/pets')
        .send({ name: 'A', type: 'dog', age: 1 });
      expect(res.status).toBe(400);
    });

    it('returns 400 for name longer than 50 chars', async () => {
      const res = await request(app)
        .post('/pets')
        .send({ name: 'A'.repeat(51), type: 'dog', age: 1 });
      expect(res.status).toBe(400);
    });

    it('returns 400 for missing name', async () => {
      const res = await request(app)
        .post('/pets')
        .send({ type: 'dog', age: 1 });
      expect(res.status).toBe(400);
    });

    it('returns 400 for negative age', async () => {
      const res = await request(app)
        .post('/pets')
        .send({ name: 'BadAge', type: 'dog', age: -1 });
      expect(res.status).toBe(400);
    });

    it('returns 400 for age above 30', async () => {
      const res = await request(app)
        .post('/pets')
        .send({ name: 'OldOne', type: 'dog', age: 31 });
      expect(res.status).toBe(400);
    });

    it('returns 400 for missing age', async () => {
      const res = await request(app)
        .post('/pets')
        .send({ name: 'NoAge', type: 'dog' });
      expect(res.status).toBe(400);
    });

    it('returns 400 for invalid type', async () => {
      const res = await request(app)
        .post('/pets')
        .send({ name: 'Alien', type: 'dragon', age: 5 });
      expect(res.status).toBe(400);
    });

    it('returns 400 for missing type', async () => {
      const res = await request(app)
        .post('/pets')
        .send({ name: 'Noname', age: 5 });
      expect(res.status).toBe(400);
    });

    it('returns 400 for float age', async () => {
      const res = await request(app)
        .post('/pets')
        .send({ name: 'Float', type: 'dog', age: 2.5 });
      expect(res.status).toBe(400);
    });
  });

  // ── PUT /pets/:id ─────────────────────────────────────────────────────────
  describe('PUT /pets/:id', () => {
    it('updates a pet and returns the updated pet', async () => {
      const pet = await Pet.create({ name: 'Old', type: 'dog', age: 1 });
      const res = await request(app)
        .put(`/pets/${pet.id}`)
        .send({ name: 'New Name', type: 'cat', age: 4 });
      expect(res.status).toBe(200);
      expect(res.body).toMatchObject({ name: 'New Name', type: 'cat', age: 4 });
    });

    it('returns 404 for non-existent pet', async () => {
      const res = await request(app)
        .put('/pets/9999')
        .send({ name: 'Ghost', type: 'dog', age: 1 });
      expect(res.status).toBe(404);
    });
  });

  // ── PATCH /pets/:id ───────────────────────────────────────────────────────
  describe('PATCH /pets/:id', () => {
    it('partially updates a pet name', async () => {
      const pet = await Pet.create({ name: 'Rover', type: 'dog', age: 3 });
      const res = await request(app)
        .patch(`/pets/${pet.id}`)
        .send({ name: 'Roxy' });
      expect(res.status).toBe(200);
      expect(res.body.name).toBe('Roxy');
      expect(res.body.type).toBe('dog'); // unchanged
    });

    it('returns 404 for non-existent pet', async () => {
      const res = await request(app)
        .patch('/pets/9999')
        .send({ name: 'Ghost' });
      expect(res.status).toBe(404);
    });
  });

  // ── DELETE /pets/:id ──────────────────────────────────────────────────────
  describe('DELETE /pets/:id', () => {
    it('deletes an existing pet and returns 204', async () => {
      const pet = await Pet.create({ name: 'Delete Me', type: 'hamster', age: 1 });
      const res = await request(app).delete(`/pets/${pet.id}`);
      expect(res.status).toBe(204);

      const found = await Pet.findByPk(pet.id);
      expect(found).toBeNull();
    });

    it('returns 400 for invalid id format', async () => {
      const res = await request(app).delete('/pets/abc');
      expect(res.status).toBe(400);
    });

    it('returns 404 for non-existent pet', async () => {
      const res = await request(app).delete('/pets/9999');
      expect(res.status).toBe(404);
    });
  });

  // ── POST /pets/:petId/tags/:tagId ─────────────────────────────────────────
  describe('POST /pets/:petId/tags/:tagId (assign tag)', () => {
    it('assigns a tag to a pet', async () => {
      const pet = await Pet.create({ name: 'Taggy', type: 'dog', age: 2 });
      const tag = await Tag.create({ name: 'friendly' });

      const res = await request(app).post(`/pets/${pet.id}/tags/${tag.id}`);
      expect(res.status).toBe(200);
      expect(res.body.Tags).toBeDefined();
      const tagNames = res.body.Tags.map((t) => t.name);
      expect(tagNames).toContain('friendly');
    });

    it('returns 404 when pet does not exist', async () => {
      const tag = await Tag.create({ name: 'orphan' });
      const res = await request(app).post(`/pets/9999/tags/${tag.id}`);
      expect(res.status).toBe(404);
    });

    it('returns 404 when tag does not exist', async () => {
      const pet = await Pet.create({ name: 'Lonely', type: 'cat', age: 1 });
      const res = await request(app).post(`/pets/${pet.id}/tags/9999`);
      expect(res.status).toBe(404);
    });

    it('returns 400 for invalid petId', async () => {
      const res = await request(app).post('/pets/abc/tags/1');
      expect(res.status).toBe(400);
    });

    it('returns 400 for invalid tagId', async () => {
      const pet = await Pet.create({ name: 'Valid', type: 'fish', age: 1 });
      const res = await request(app).post(`/pets/${pet.id}/tags/0`);
      expect(res.status).toBe(400);
    });
  });

  // ── DELETE /pets/:petId/tags/:tagId ───────────────────────────────────────
  describe('DELETE /pets/:petId/tags/:tagId (remove tag)', () => {
    it('removes a tag from a pet and returns 204', async () => {
      const pet = await Pet.create({ name: 'Multi', type: 'dog', age: 4 });
      const tag = await Tag.create({ name: 'vaccinated' });
      await pet.addTag(tag);

      const res = await request(app).delete(`/pets/${pet.id}/tags/${tag.id}`);
      expect(res.status).toBe(204);

      const updated = await Pet.findByPk(pet.id, { include: Tag });
      expect(updated.Tags).toHaveLength(0);
    });

    it('returns 404 when pet does not exist', async () => {
      const tag = await Tag.create({ name: 'ghost' });
      const res = await request(app).delete(`/pets/9999/tags/${tag.id}`);
      expect(res.status).toBe(404);
    });

    it('returns 400 for invalid petId', async () => {
      const res = await request(app).delete('/pets/abc/tags/1');
      expect(res.status).toBe(400);
    });
  });
});
