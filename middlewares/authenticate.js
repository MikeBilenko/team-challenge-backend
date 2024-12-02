import HttpError from "../helpers/HttpError.js";
import jwt from "jsonwebtoken";
import "dotenv/config";
import { findUser } from "../services/userServices.js";

const { JWT_SECRET } = process.env;

const authenticate = async (req, res, next) => {
  const authorization = req.headers.authorization;
  if (!authorization) {
    return next(HttpError(401, "!authorization"));
  }
  const [bearer, token] = authorization.split(" ");
  if (bearer !== "Bearer") {
    return next(HttpError(401, "!Bearer"));
  }

  try {
    const { id } = jwt.verify(token, JWT_SECRET);
    const user = await findUser({ _id: id });
    if (
      !user ||
      (user.tokens.accessToken !== token && user.tokens.refreshToken !== token)
    ) {
      return next(HttpError(401, "!user || user.tokens.accessToken !== token"));
    }
    req.user = user;
    next();
  } catch (error) {
    next(HttpError(401, "error"));
  }
};

export default authenticate;
