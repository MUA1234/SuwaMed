import Joi from 'joi';

export const doctorRegistrationSchema = Joi.object({
  slmcRegistrationNo: Joi.string().required(),
  specialization: Joi.array().items(Joi.string()).min(1).required(),
  qualifications: Joi.array().items(
    Joi.object({
      degree: Joi.string().required(),
      institution: Joi.string().required(),
      year: Joi.number().required(),
    })
  ).optional(),
  experience: Joi.number().optional(),
  bio: Joi.string().max(500).optional(),
  consultationFee: Joi.number().min(100).required(),
  followUpFee: Joi.number().optional(),
  languages: Joi.array().items(Joi.string().valid('en', 'si', 'ta')).optional(),
});
