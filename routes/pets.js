const express = require('express');
const { Pet } = require('../models/pet');  // Import the Pet model
const { Tag } = require('../models/tag');
const { User } = require('../models/user');

const router = express.Router();

const isValidId = (value) => Number.isInteger(Number(value)) && Number(value) > 0;
const isNonEmptyString = (value) => typeof value === 'string' && value.trim().length > 0;

const serializePetWithOwner = (pet) => {
  const plainPet = pet.toJSON();
  const { owner, ...petData } = plainPet;

  return {
    ...petData,
    userId: petData.userId ?? null,
    fullname: owner ? owner.fullname : null,
  };
};

// List Pets
router.get('/', async (req, res) => {
  try {
    const pets = await Pet.findAll({
      include: [
        Tag,
        {
          model: User,
          as: 'owner',
          attributes: ['fullname'],
          required: false,
        },
      ],
    });
    res.json(pets.map(serializePetWithOwner));
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Add Pet
router.post('/', async (req, res) => {
  try {
    const { name, type, age, userId } = req.body;
    
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

    // Validate optional userId
    let resolvedUserId = null;
    if (userId !== undefined && userId !== null) {
      const normalizedUserId = Number(userId);
      if (!Number.isInteger(normalizedUserId) || normalizedUserId <= 0) {
        return res.status(400).json({ error: 'userId must be a positive integer' });
      }
      const user = await User.findByPk(normalizedUserId);
      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }
      resolvedUserId = normalizedUserId;
    }
    
    const newPet = await Pet.create({ name, type: type.toLowerCase(), age, userId: resolvedUserId });
    const petWithOwner = await Pet.findByPk(newPet.id, {
      include: [
        Tag,
        { model: User, as: 'owner', attributes: ['fullname'], required: false },
      ],
    });
    res.status(201).json(serializePetWithOwner(petWithOwner));
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
