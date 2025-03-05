import express from "express";
import chatRoomsControllers from "../controllers/chatRoomsControllers.js";
import authenticate from "../middlewares/authenticate.js";
import isValidId from "../middlewares/isValidId.js";
import isValidIdInBody from "../middlewares/isValidIdInBody.js";

const chatRoomsRouter = express.Router();

chatRoomsRouter.use(authenticate);

const {
  getUserChatRooms,
  getActiveChat,
  createChatForTwo,
  getIsUserChatModerator,
  getChatMembers,
} = chatRoomsControllers;

chatRoomsRouter.get("/", getUserChatRooms);
chatRoomsRouter.get("/:chatId", isValidId, getActiveChat);
chatRoomsRouter.post("/", isValidIdInBody, createChatForTwo);
chatRoomsRouter.get("/is_moderaror/:chatId", isValidId, getIsUserChatModerator);
chatRoomsRouter.get("/members/:chatId", isValidId, getChatMembers);

export default chatRoomsRouter;
