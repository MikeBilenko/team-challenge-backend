import ChatRoom from "../models/ChatRoom.js";

export async function getChatRooms(filter) {
  return await ChatRoom.find(filter);
}
export async function getChatRoom(filter) {
  return await ChatRoom.findOne(filter);
}

export async function createRoom(data) {
  return await ChatRoom.create(data);
}

export async function updateRoom(filter, data) {
  return await ChatRoom.findOneAndUpdate(filter, data, { new: true });
}

export async function getChatRoomById(id, expandField, getFilds) {
  return await ChatRoom.findById(id).populate(expandField, getFilds); // Указываем поля (минус перед _id — убрать его)
}
