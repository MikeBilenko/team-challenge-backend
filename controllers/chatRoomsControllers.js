import ctrlWrapper from "../decorators/ctrlWrapper.js";
import HttpError from "../helpers/HttpError.js";
import {
  createRoom,
  getChatRoom,
  getChatRoomById,
  getChatRooms,
  updateRoom,
} from "../services/chatRoomservices.js";
import { findComplex } from "../services/complexServices.js";
import { findUserById } from "../services/userServices.js";

const getUserChatRooms = async (req, res) => {
  const { _id } = req.user;
  console.log(_id);
  const result = await getChatRooms({
    users: {
      $all: [_id], //The $all operator selects the documents where the value of a field is an array that contains all the specified elements.
    },
  });
  res.status(200).json(result);
};

const getActiveChat = async (req, res) => {
  const { _id: userId } = req.user;
  console.log(userId);
  const { chatId: _id } = req.params;
  const chat = await getChatRoom({
    _id,
    users: userId,
  });

  if (!chat) {
    throw HttpError(404, `Sorry, such a chat doesn't exist`);
  }
  const result = await findUserById(userId, "-password");
  res.status(200).json(result);
};

const createChatRooom = async (req, res) => {
  const { _id } = req.user;
  const { userId } = req.params;
  const { residential_complex, building } = req.query;
  const { is_admin } = await findUserById(_id);
  if (!is_admin) {
    throw HttpError(
      403,
      `Sorry, but you don't have access to commit  this action`
    );
  }

  const { buildings } = await findComplex({
    name: residential_complex,
  });
  const { _id: building_id } = buildings.find(
    (elem) => elem.address === building
  );

  const name = residential_complex.concat(" ", building);
  const chat = await getChatRoom({
    name,
    building_id,
  });
  console.log(chat);
  let result;
  if (chat) {
    chat.users.push(userId);
    result = await updateRoom({ _id: chat._id }, chat);
  } else {
    const users = [userId];
    const newChatRoom = { name, building_id, users };
    result = await createRoom(newChatRoom);
  }
  console.log(result);
  res.status(201).json({ message: "User address data was approved", result });
  //   const result=await
};

const createChatForTwo = async (req, res) => {
  const { _id: userRequest_id } = req.user;
  const { userReply_id: _id } = req.body;
  console.log(_id);
  const userReply = await findUserById(_id);
  if (!userReply) {
    throw HttpError(
      404,
      `Sorry, but the user you're looking for does not exist`
    );
  }
  const chat = await getChatRoom({
    building_id: null,
    users: {
      $all: [userRequest_id, _id],
    },
  });
  if (chat) {
    throw HttpError(400, `Sorry, such a chat already exists`);
  }
  const newChat = {
    building_id: null,
    users: [userRequest_id, _id],
  };
  const result = await createRoom(newChat);
  res.status(201).json(result);
};

const getIsUserChatModerator = async (req, res) => {
  const { chatId: _id } = req.params;
  const { buildings } = req.user;
  if (buildings.length === 0) {
    throw HttpError(404, "You don't have any apartments");
  }

  const { building_id } = await getChatRoom({ _id });
  // console.log("building_id: ", building_id);

  const { _id: residential_complex_id } = await findComplex({
    buildings: {
      $elemMatch: {
        _id: building_id,
      },
    },
  });
  // console.log("residential_complex_id: ", residential_complex_id);
  const { moderator } = buildings.find(
    (elem) =>
      elem.residential_complex_id.toString() ===
      residential_complex_id.toString()
  );
  // console.log("moderator: ", moderator);
  if (!moderator) {
    throw HttpError(404, "You are not  a moderator");
  }
  const userAsModerator = { ...req.user };
  delete userAsModerator._doc.password;
  const user = userAsModerator._doc;

  res.json(user);
};

const getChatMembers = async (req, res) => {
  const { chatId: _id } = req.params;
  const { _id: userId } = req.user;

  // const expendFild = "users";
  // const getFilds = "-password";

  const chatRoom = await getChatRoomById(_id, "users", "-password"); // Указываем поля (минус перед _id — убрать его)
  if (!chatRoom) {
    throw HttpError(404, "Chat room not found");
  }
  console.log("chatRoom: ", chatRoom);

  const userInChat = chatRoom.users.find(
    (elem) => elem._id.toString() === userId.toString()
  );
  console.log("userInChat: ", userInChat);
  if (!userInChat) {
    throw HttpError(403, "You're not from this chat");
  }

  res.json(chatRoom.users);
};

export default {
  getUserChatRooms: ctrlWrapper(getUserChatRooms),
  getActiveChat: ctrlWrapper(getActiveChat),
  createChatRooom: ctrlWrapper(createChatRooom),
  createChatForTwo: ctrlWrapper(createChatForTwo),
  getIsUserChatModerator: ctrlWrapper(getIsUserChatModerator),
  getChatMembers: ctrlWrapper(getChatMembers),
};
