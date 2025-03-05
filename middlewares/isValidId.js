import { isValidObjectId } from "mongoose";
import HttpError from "../helpers/HttpError.js";

const isValidId = (req, res, next) => {
  const keys = Object.keys(req.params);

  keys.forEach((key) => {
    if (!isValidObjectId(req.params[key]) && req.params[key] !== undefined) {
      throw HttpError(404, `${req.params[key]} is not valid id`);
    }
  });

  next();
};

export default isValidId;
