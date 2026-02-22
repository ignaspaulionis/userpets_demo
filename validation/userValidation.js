const Joi = require('joi');

const passwordRule = Joi.string()
  .min(8)
  .pattern(/^(?=.*[A-Za-z])(?=.*\d)(?=.*[@$!%*#?&])[A-Za-z\d@$!%*#?&]{8,}$/)
  .messages({
    'string.pattern.base': 'Password must include at least one letter, one number, and one special character',
  });

const registerSchema = Joi.object({
  email: Joi.string().email().required(),
  password: passwordRule.required(),
  fullname: Joi.string().trim().min(2).max(100).required(),
});

const loginSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().required(),
});

const userSchema = Joi.object({
  email: Joi.string().email(),
  fullname: Joi.string().trim().min(2).max(100),
  issuperadmin: Joi.boolean(),
  password: passwordRule,
}).min(1);

module.exports = { registerSchema, loginSchema, userSchema };
