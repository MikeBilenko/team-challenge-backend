import express from "express";
import authenticate from "../middlewares/authenticate.js";
import usersControllers from "../controllers/usersControllers.js";
import validateBody from "../decorators/validateBody.js";
import { addUserAddressesSchema } from "../schemas/usersSchemas.js";
import isValidId from "../middlewares/isValidId.js";
import chatRoomsControllers from "../controllers/chatRoomsControllers.js";

const usersRouter = express.Router();

usersRouter.use(authenticate);

const {
  addUserAddresses,
  deleteUserAddress,
  approveUserAddress,
  setModeratorStatus,
  getUser,
  getContactInfoForUser,
} = usersControllers;
const { createChatRooom } = chatRoomsControllers;

usersRouter.put(
  "/addresses",
  validateBody(addUserAddressesSchema),
  addUserAddresses
);
usersRouter.delete(
  "/addresses",
  validateBody(addUserAddressesSchema),
  deleteUserAddress
);
usersRouter.patch(
  "/addresses/:userId",
  isValidId,
  approveUserAddress,
  createChatRooom
);
usersRouter.patch(
  "/addresses/:userId/:complex_id",
  isValidId,
  setModeratorStatus
);
usersRouter.get("/user/:userId", isValidId, getUser);
usersRouter.get("/contact_info", getContactInfoForUser);

export default usersRouter;
