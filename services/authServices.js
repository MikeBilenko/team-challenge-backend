import bcrypt from "bcrypt";
import User from "../models/User.js";
import jwt from "jsonwebtoken";
import { findUser, findUserById } from "./userServices.js";
import "dotenv/config";
import HttpError from "../helpers/HttpError.js";

const { JWT_SECRET } = process.env;

export const register = async (data) => {
  const { password } = data;
  const hashPassword = await bcrypt.hash(password, 10);
  return User.create({ ...data, password: hashPassword });
};

export const setTokens = (id, accessToken = "", refreshToken = "") => {
  const tokens = { accessToken, refreshToken };
  return User.findByIdAndUpdate(id, { tokens }, { new: true });
};

export async function updateUser(filter, data, config) {
  if (data.newPassword || data.password) {
    // const { newPassword: password } = data;
    const hashPassword = await bcrypt.hash(
      data.newPassword ? data.newPassword : data.password,
      10
    ); // const salt = await bcrypt.genSalt(10);
    return User.findOneAndUpdate(
      filter,
      { ...data, password: hashPassword },
      config,
      { new: true }
    );
  } else {
    return User.findOneAndUpdate(filter, data, config, { new: true });
  }
}

export async function recoverPassword(tempCode, data) {
  const hashPassword = await bcrypt.hash(data.password, 10);
  return User.findOneAndUpdate(
    { tempCode },
    {
      password: hashPassword,
      $unset: { tempCode: "", tempCodeTime: "" },
      // $unset: { tempCode },
    } //$unset — оператор, который удаляет указанное поле из документа. Значение в $unset не имеет значения (можно использовать пустую строку или null), главное указать имя поля.MongoDB ожидает, что объект $unset будет единым, и все поля для удаления должны быть указаны в нем.
  );
}

export const signinHelper = async (email, password) => {
  try {
    console.log("📩 SigninHelper request received:", { email });

    const user = await findUser({ email });
    if (!user) {
      return { error: "Email is wrong" };
    }
    const { password: hashPassword, _id } = user;
    const compare = await bcrypt.compare(password, hashPassword);
    console.log("compare: ", compare);
    if (!compare) {
      return { error: "Invalid password" };
    }

    const payload = { id: _id };

    const accessToken = jwt.sign(payload, JWT_SECRET, { expiresIn: "1h" });

    const refreshToken = jwt.sign(payload, JWT_SECRET, { expiresIn: "7d" });
    await setTokens(_id, accessToken, refreshToken);

    const loggedInUser = await findUserById(_id, "-password");
    // console.log("loggedInUser: ", loggedInUser);

    return loggedInUser;
  } catch (error) {
    console.error("🔥 SigninHelper error:", error);
    return { error: "Server error" };
  }
};
