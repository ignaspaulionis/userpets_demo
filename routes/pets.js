const express = require('express');
const { Pet, Tag } = require('../models/associations');

const router = express.Router();

const validTypes = ['dog', 'cat', 'bird', 'fish', 'hamster'];
const isValidId = (id) => Number.isInteger(Number(id)) && Number(id) > 0;

// List Pets (with tags)
router.get('/', async (req, res) => {
  try {
    const pets = await Pet.findAll({ include: [{ model: Tag, through: { attributes: [] } }] });
    res.json(pets);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Add Pet
router.post('/', async (req, res) => {
  try {
    const { name, type, age, tagIds } = req.body;

    if (!name || typeof name !== 'string' || name.length < 2 || name.length > 50) {
      return res.status(400).json({ error: 'Name must be between 2 and 50 characters' });
    }

    if (age === undefined || age === null || !Number.isInteger(age) || age < 0 || age > 30) {
      return res.status(400).json({ error: 'Age must be an integer between 0 and 30' });
    }

    if (!type || typeof type !== 'string' || !validTypes.includes(type.toLowerCase())) {
      return res.status(400).json({ error: 'Type must be one of: dog, cat, bird, fish, hamster' });
    }

    if (tagIds !== undefined) {
      if (!Array.isArray(tagIds) || tagIds.some((id) => !isValidId(id))) {
        return res.status(400).json({ error: 'tagIds must be an array of valid ids' });
      }
    }

    const newPet = await Pet.create({ name, type: type.toLowerCase(), age });

    if (tagIds && tagIds.length > 0) {
      const tags = await Tag.findAll({ where: { id: tagIds } });
      if (tags.length !== [...new Set(tagIds.map(Number))].length) {
        return res.status(400).json({ error: 'One or more tags do not exist' });
      }
      await newPet.setTags(tags);
    }

    const createdPet = await Pet.findByPk(newPet.id, { include: [{ model: Tag, through: { attributes: [] } }] });
    res.status(201).json(createdPet);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Update Pet
router.put('/:id', async (req, res) => {
  try {
    if (!isValidId(req.params.id)) {
      return res.status(400).json({ error: 'Invalid pet id' });
    }

    const { name, type, age, tagIds } = req.body;
    const pet = await Pet.findByPk(req.params.id);
    if (!pet) {
      return res.status(404).json({ error: 'Pet not found' });
    }

    if (!name || typeof name !== 'string' || name.length < 2 || name.length > 50) {
      return res.status(400).json({ error: 'Name must be between 2 and 50 characters' });
    }

    if (age === undefined || age === null || !Number.isInteger(age) || age < 0 || age > 30) {
      return res.status(400).json({ error: 'Age must be an integer between 0 and 30' });
    }

    if (!type || typeof type !== 'string' || !validTypes.includes(type.toLowerCase())) {
      return res.status(400).json({ error: 'Type must be one of: dog, cat, bird, fish, hamster' });
    }

    if (tagIds !== undefined && (!Array.isArray(tagIds) || tagIds.some((id) => !isValidId(id)))) {
      return res.status(400).json({ error: 'tagIds must be an array of valid ids' });
    }

    pet.name = name;
    pet.type = type.toLowerCase();
    pet.age = age;
    await pet.save();

    if (tagIds !== undefined) {
      const tags = await Tag.findAll({ where: { id: tagIds } });
      if (tags.length !== [...new Set(tagIds.map(Number))].length) {
        return res.status(400).json({ error: 'One or more tags do not exist' });
      }
      await pet.setTags(tags);
    }

    const updatedPet = await Pet.findByPk(pet.id, { include: [{ model: Tag, through: { attributes: [] } }] });
    res.json(updatedPet);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Partially Update Pet
router.patch('/:id', async (req, res) => {
  try {
    if (!isValidId(req.params.id)) {
      return res.status(400).json({ error: 'Invalid pet id' });
    }

    const pet = await Pet.findByPk(req.params.id);
    if (!pet) {
      return res.status(404).json({ error: 'Pet not found' });
    }

    const { name, type, age, tagIds } = req.body;

    if (name !== undefined) {
      if (typeof name !== 'string' || name.length < 2 || name.length > 50) {
        return res.status(400).json({ error: 'Name must be between 2 and 50 characters' });
      }
      pet.name = name;
    }

    if (type !== undefined) {
      if (typeof type !== 'string' || !validTypes.includes(type.toLowerCase())) {
        return res.status(400).json({ error: 'Type must be one of: dog, cat, bird, fish, hamster' });
      }
      pet.type = type.toLowerCase();
    }

    if (age !== undefined) {
      if (!Number.isInteger(age) || age < 0 || age > 30) {
        return res.status(400).json({ error: 'Age must be an integer between 0 and 30' });
      }
      pet.age = age;
    }

    if (tagIds !== undefined) {
      if (!Array.isArray(tagIds) || tagIds.some((id) => !isValidId(id))) {
        return res.status(400).json({ error: 'tagIds must be an array of valid ids' });
      }
      const tags = await Tag.findAll({ where: { id: tagIds } });
      if (tags.length !== [...new Set(tagIds.map(Number))].length) {
        return res.status(400).json({ error: 'One or more tags do not exist' });
      }
      await pet.setTags(tags);
    }

    await pet.save();
    const updatedPet = await Pet.findByPk(pet.id, { include: [{ model: Tag, through: { attributes: [] } }] });
    res.json(updatedPet);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Delete Pet
router.delete('/:id', async (req, res) => {
  try {
    if (!isValidId(req.params.id)) {
      return res.status(400).json({ error: 'Invalid pet id' });
    }

    const pet = await Pet.findByPk(req.params.id);
    if (!pet) {
      return res.status(404).json({ error: 'Pet not found' });
    }

    await pet.setTags([]);
    await pet.destroy();
    res.status(204).end();
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

module.exports = router;
