import { Schema, model } from "mongoose";
import { handleSaveError, setUpdateSetting } from "./hooks.js";

const chatRoomShema = new Schema(
  {
    name: {
      type: String,
      default: "",
      //   required: [true, "Name is required"],
    },
    picture: {
      type: String,
      default: "",
    },
    building_id: {
      type: Schema.Types.ObjectId,
      ref: "residential_complex",
    },
    users: [
      {
        type: Schema.Types.ObjectId,
        ref: "user",
      },
    ],
  },
  { versionKey: false }
);

chatRoomShema.post("save", handleSaveError);
chatRoomShema.pre("findOneAndUpdate", setUpdateSetting);
chatRoomShema.post("findOneAndUpdate", handleSaveError);

const ChatRoom = model("chat_room", chatRoomShema);
export default ChatRoom;
