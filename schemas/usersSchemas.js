import Joi from "joi";

export const signupSchema = Joi.object({
  name: Joi.string().required().trim(),
  email: Joi.string().email().required().trim(),
  password: Joi.string()
    .pattern(new RegExp(/^(?=.*?[A-Z])(?=.*?[a-z])(?=.*?[0-9]).{8,}$/))
    .required()
    .error(
      (errors) =>
        new Error(
          "The password may contain at least one upper case, one lower case English letter, one digit, and have a length of at least 8 characters"
        )
    ),
  phone: [Joi.string(), Joi.number()]
    .pattern(
      new RegExp(/^[\+]?[(]?[0-9]{3}[)]?[-\s\.]?[0-9]{3}[-\s\.]?[0-9]{4,6}$/)
    )
    .required()
    .trim()
    .error(
      (errors) =>
        new Error(
          "Must be from 10 to 12 digits (+111222333444) with or without '+'"
        )
    ),
});