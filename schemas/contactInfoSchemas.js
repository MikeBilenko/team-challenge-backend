import Joi from "joi";

export const createContactInfoSchema = Joi.object({
  title: Joi.string().required(),
  titleUA: Joi.string().required(),
  description: Joi.string().required(),
  descriptionUA: Joi.string().required(),
  location: Joi.string(),
});

export const updateContactInfoSchema = Joi.object({
  title: Joi.string(),
  titleUA: Joi.string(),
  description: Joi.string(),
  descriptionUA: Joi.string(),
  location: Joi.string(),
});
