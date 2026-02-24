const express = require('express');
const { Op } = require('sequelize');
const { Pet } = require('../models/pet');  // Import the Pet model
const { Tag } = require('../models/tag');

const router = express.Router();

const isValidId = (value) => Number.isInteger(Number(value)) && Number(value) > 0;
const isNonEmptyString = (value) => typeof value === 'string' && value.trim().length > 0;

// List Pets
router.get('/', async (req, res) => {
  try {
    const { minAge, maxAge } = req.query;

    const parseAgeParam = (value, paramName) => {
      if (value === undefined) {
        return undefined;
      }

      if (value === '' || !/^\d+$/.test(value)) {
        throw new Error(`${paramName} must be a non-negative integer`);
      }

      return Number(value);
    };

    const parsedMinAge = parseAgeParam(minAge, 'minAge');
    const parsedMaxAge = parseAgeParam(maxAge, 'maxAge');

    if (parsedMinAge !== undefined && parsedMaxAge !== undefined && parsedMinAge > parsedMaxAge) {
      return res.status(400).json({ error: 'minAge cannot be greater than maxAge' });
    }

    const where = {};
    if (parsedMinAge !== undefined || parsedMaxAge !== undefined) {
      where.age = {};
      if (parsedMinAge !== undefined) {
        where.age[Op.gte] = parsedMinAge;
      }
      if (parsedMaxAge !== undefined) {
        where.age[Op.lte] = parsedMaxAge;
      }
    }

    const pets = await Pet.findAll({ include: Tag, where });
    res.json(pets);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Add Pet
router.post('/', async (req, res) => {
  try {
    const { name, type, age } = req.body;
    
    // Validate name
    if (!name || typeof name !== 'string' || name.length < 2 || name.length > 50) {
      return res.status(400).json({ error: "Name must be between 2 and 50 characters" });
    }
    
    // Validate age
    if (age === undefined || age === null || !Number.isInteger(age) || age < 0 || age > 30) {
      return res.status(400).json({ error: "Age must be an integer between 0 and 30" });
    }
    
    // Validate type
    const validTypes = ['dog', 'cat', 'bird', 'fish', 'hamster'];
    if (!type || typeof type !== 'string' || !validTypes.includes(type.toLowerCase())) {
      return res.status(400).json({ error: "Type must be one of: dog, cat, bird, fish, hamster" });
    }
    
    const newPet = await Pet.create({ name, type: type.toLowerCase(), age });
    res.status(201).json(newPet);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Update Pet
router.put('/:id', async (req, res) => {
  try {
    const { name, type, age } = req.body;
    const pet = await Pet.findByPk(req.params.id);
    if (!pet) {
      return res.status(404).json({ error: 'Pet not found' });
    }
    pet.name = name;
    pet.type = type;
    pet.age = age;
    await pet.save();
    res.json(pet);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Partially Update Pet
router.patch('/:id', async (req, res) => {
  try {
    const pet = await Pet.findByPk(req.params.id);
    if (!pet) {
      return res.status(404).json({ error: 'Pet not found' });
    }
    const { name, type, age } = req.body;
    pet.name = name || pet.name;
    pet.type = type || pet.type;
    pet.age = age || pet.age;
    await pet.save();
    res.json(pet);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Assign tag to pet
router.post('/:petId/tags/:tagId', async (req, res) => {
  try {
    const { petId, tagId } = req.params;

    if (!isValidId(petId) || !isValidId(tagId)) {
      return res.status(400).json({ error: 'Invalid pet id or tag id' });
    }

    const pet = await Pet.findByPk(petId);
    if (!pet) {
      return res.status(404).json({ error: 'Pet not found' });
    }

    const tag = await Tag.findByPk(tagId);
    if (!tag) {
      return res.status(404).json({ error: 'Tag not found' });
    }

    await pet.addTag(tag);
    const updatedPet = await Pet.findByPk(petId, { include: Tag });
    res.json(updatedPet);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Remove tag from pet
router.delete('/:petId/tags/:tagId', async (req, res) => {
  try {
    const { petId, tagId } = req.params;

    if (!isValidId(petId) || !isValidId(tagId)) {
      return res.status(400).json({ error: 'Invalid pet id or tag id' });
    }

    const pet = await Pet.findByPk(petId);
    if (!pet) {
      return res.status(404).json({ error: 'Pet not found' });
    }

    const tag = await Tag.findByPk(tagId);
    if (!tag) {
      return res.status(404).json({ error: 'Tag not found' });
    }

    await pet.removeTag(tag);
    res.status(204).end();
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Delete Pet
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    if (!isValidId(id)) {
      return res.status(400).json({ error: 'Invalid pet id' });
    }

    const pet = await Pet.findByPk(id, { include: Tag });
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
