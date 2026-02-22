const Pet = require('./pet');
const Tag = require('./tag');

Pet.belongsToMany(Tag, {
  through: 'PetTags',
  onDelete: 'CASCADE',
  onUpdate: 'CASCADE',
});

Tag.belongsToMany(Pet, {
  through: 'PetTags',
  onDelete: 'CASCADE',
  onUpdate: 'CASCADE',
});

module.exports = { Pet, Tag };
