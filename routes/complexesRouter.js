import express from "express";
import authenticate from "../middlewares/authenticate.js";
import complexesControllers from "../controllers/complexesControllers.js";
import {
  createComplexSchema,
  updateComplexSchema,
  updateComplexImagesSchema,
} from "../schemas/complexSchema.js";
import validateBody from "../decorators/validateBody.js";
import upload from "../middlewares/upload.js";
import isValidId from "../middlewares/isValidId.js";

const complexesRouter = express.Router();

const {
  createComplex,
  updateComplex,
  updateComplexImages,
  getComplexes,
  getComplex,
  deleteComplex,
} = complexesControllers;

complexesRouter.post(
  "/",
  authenticate,
  upload.array("image", 10),
  validateBody(createComplexSchema),
  createComplex
);
complexesRouter.put(
  "/:complexId",
  isValidId,
  authenticate,
  validateBody(updateComplexSchema),
  updateComplex
);
complexesRouter.patch(
  "/:complexId",
  isValidId,
  authenticate,
  upload.array("image", 10),
  validateBody(updateComplexImagesSchema),
  updateComplexImages
);
complexesRouter.get("/", getComplexes);
complexesRouter.get("/:complexId", isValidId, getComplex);
complexesRouter.delete("/:complexId", isValidId, authenticate, deleteComplex);

export default complexesRouter;
