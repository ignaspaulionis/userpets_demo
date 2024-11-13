const express = require('express');
const { Pet } = require('../models/pet');  // Import the Pet model
const { authMiddleware, isSuperadminMiddleware } = require('../middleware/auth');

const router = express.Router();

// List Pets
router.get('/', async (req, res) => {
  try {
    const pets = await Pet.findAll();
    res.json(pets);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Add Pet
router.post('/', async (req, res) => {
  try {
    const { name, type, age } = req.body;
    const newPet = await Pet.create({ name, type, age });
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

// Delete Pet
router.delete('/:id', async (req, res) => {
  try {
    const pet = await Pet.findByPk(req.params.id);
    if (!pet) {
      return res.status(404).json({ error: 'Pet not found' });
    }
    await pet.destroy();
    res.status(204).end();
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

module.exports = router;
