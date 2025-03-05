import Joi from "joi";

export const createComplexSchema = Joi.object({
  name: Joi.string().required().trim(),
  description: Joi.string(),
  ltd: Joi.string(),
  lng: Joi.string(),
  images: Joi.array().items(Joi.string()),
  parking: Joi.boolean().default(false),
  security: Joi.boolean().default(false),
  access_control: Joi.boolean().default(false),
  concierge: Joi.boolean().default(false),
  playground: Joi.boolean().default(false),
  closed_area: Joi.boolean().default(false),
  video_surveillance: Joi.boolean().default(false),
  floors: Joi.number().default(1),
  entrances: Joi.number().default(1),
  addresses: Joi.array().items(Joi.string().required().trim()),
});

export const updateComplexSchema = Joi.object({
  name: Joi.string().trim(),
  images: Joi.array().items(Joi.string()),
  properties: Joi.object({
    parking: Joi.boolean(),
    security: Joi.boolean(),
    access_control: Joi.boolean(),
    concierge: Joi.boolean(),
    playground: Joi.boolean(),
    closed_area: Joi.boolean(),
    video_surveillance: Joi.boolean(),
    floors: Joi.number(),
    entrances: Joi.number(),
  }),
  buildings: Joi.array().items(
    Joi.object({
      address: Joi.string(),
      apartments: Joi.array().items(
        Joi.object({
          number: Joi.number(),
          entrance: Joi.number(),
          services_debt: Joi.number(),
        })
      ),
    })
  ),
});
