import ctrlWrapper from "../decorators/ctrlWrapper.js";
import HttpError from "../helpers/HttpError.js";
import User from "../models/User.js";
import {
  recoverPassword,
  register,
  setTokens,
  updateUser,
} from "../services/authServices.js";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";
import sendEmail from "../helpers/sendEmail.js";
import { findUser, findUserById } from "../services/userServices.js";
import bcrypt from "bcrypt";
import { generateRandomCode } from "../helpers/generateRandomCode.js";
import cloudinary from "../helpers/cloudinary.js";
import fs from "fs/promises";

dotenv.config();

const { JWT_SECRET, DEPLOY_HOST } = process.env;
const DELAY = 30 * 60 * 1000;

const signup = async (req, res) => {
  const { email, name, gender } = req.body;

  const user = await findUser({ email });
  if (user) {
    throw HttpError(409, "This email is already in use");
  }

  // ***Add user's picture
  let avatar;
  if (req.file) {
    const { url } = await cloudinary.uploader.upload(req.file.path, {
      folder: "teamchallenge",
    });
    const { path: oldPath } = req.file;

    await fs.rm(oldPath);
    avatar = url;
  } else {
    avatar =
      gender === "male"
        ? `https://avatar.iran.liara.run/public/boy?username=${name}`
        : gender === "female"
        ? `https://avatar.iran.liara.run/public/girl?username=${name}`
        : `https://avatar.iran.liara.run/username?username=${name}`;
  }

  const newUser = await register({ ...req.body, avatar });

  const payload = { id: newUser._id };
  const accessToken = jwt.sign(payload, JWT_SECRET, { expiresIn: "1h" });

  const refreshToken = jwt.sign(payload, JWT_SECRET, { expiresIn: "7d" });

  const tokens = await setTokens(newUser._id, accessToken, refreshToken);
  // console.log(tokens);

  const loggedInUser = await findUserById({ _id: newUser._id }, "-password");

  const userEmail = {
    to: email,
    subject: "Registration",
    html: `<h1>Hello, ${name}!</h1>
        <p>Congratulations!</p><p>You have registered successfully.</p>
         <p>Your next step is to add your address(addresses) to your profile by filling out the necessary form.</p>
         <p>If you have any questions, you can always contact our support team.</p>
        <p style="margin-top: 10px;">Best regards,</p>
        <p style="margin-top: 10px;">The Teamchallenge Chat Team</p>`,
  };

  await sendEmail(userEmail);

  res.status(201).json({
    loggedInUser,
  });
};

const signin = async (req, res) => {
  // console.log("req.body: ", req.body);
  const { email, password } = req.body;
  const user = await findUser({ email });
  if (!user) {
    throw HttpError(401, "Email is wrong");
  }
  const { password: hashPassword, _id } = user;
  const compare = bcrypt.compare(password, hashPassword);
  if (!compare) {
    throw HttpError(401, "Password is wrong");
  }

  const payload = { id: _id };

  const accessToken = jwt.sign(payload, JWT_SECRET, { expiresIn: "1h" });

  const refreshToken = jwt.sign(payload, JWT_SECRET, { expiresIn: "7d" });
  await setTokens(_id, accessToken, refreshToken);

  const loggedInUser = await findUserById(_id, "-password");
  // console.log("loggedInUser: ", loggedInUser);
  res.status(200).json(loggedInUser);
};

const logout = async (req, res) => {
  const { _id: id } = req.user;
  await setTokens(id);
  res.status(204).json();
};

const getCurrent = async (req, res) => {
  const userRes = { ...req.user };
  delete userRes._doc.password;
  const user = userRes._doc;
  // console.log(user);
  res.json(user);
};

const getRefreshCurrent = async (req, res) => {
  const { _id } = req.user;
  const payload = {
    id: _id,
  };
  const accessToken = jwt.sign(payload, JWT_SECRET, {
    expiresIn: "1h",
  });
  const refreshToken = jwt.sign(payload, JWT_SECRET, { expiresIn: "7d" });
  await setTokens(_id, accessToken, refreshToken);

  res.json({
    accessToken,
    refreshToken,
  });
};

const forgotPassword = async (req, res) => {
  const { email } = req.body;

  const user = await findUser({ email });
  if (!user) {
    throw HttpError(404, "User not found");
  }

  const tempCode = generateRandomCode();
  const tempCodeTime = Date.now() + DELAY;

  await updateUser({ email }, { tempCode, tempCodeTime });
  const userEmail = {
    to: email,
    subject: "Forgot password",
    html: `
        <h1>Hello, did you forget your password?</h1>
        <p>If no, ignore this email.</p>
        <p>Otherwise, please click on the link below, <span style="font-weight: bold;">but remember that this link will expire in <span style="color: red;">${
          DELAY / 60000
        } min</span></p>
        <div style="margin-bottom: 20px;">
          <a href="${DEPLOY_HOST}/update-password/${tempCode}" target="_blank" style="display: inline-block; padding: 10px 20px; background-color: #407bff; color: #fff; text-decoration: none; border-radius: 5px; margin-top: 15px;">Click to update your password!</a>
        </div>
        `,
  };

  await sendEmail(userEmail);

  res.json({
    message:
      "An email has been sent to your email address to recover your password",
  });
};

const updatePassword = async (req, res) => {
  const { tempCode } = req.params;
  const { newPassword } = req.body;

  const user = await findUser({ tempCode });
  if (!user) {
    throw HttpError(404, "User not found");
  }
  if (user.tempCodeTime < Date.now()) {
    throw HttpError(
      403,
      "Unfortunately, your link has expired, so you can't access this action. Try to recover your password again."
    );
  }

  await recoverPassword(tempCode, {
    password: newPassword,
  });

  res.status(200).json({
    message: "Your password has been updated successfully",
  });
};

const updateUserdata = async (req, res) => {
  const { _id, is_admin } = req.user;
  const keys = Object.keys(req.body);
  if (keys.length === 0) {
    throw HttpError(400, "At least one field must not be empty!");
  }
  // Prevent changing the moderator status ************
  const { buildings, ...restBody } = req.body;
  // console.log(buildings);
  // console.log("restBody: ", restBody);

  const admin = is_admin ? { is_admin: true } : { is_admin: false };
  // console.log(admin);
  const data = { ...restBody, ...admin };
  // ***************************************************
  const result = await updateUser({ _id }, data, {
    projection: { password: 0 },
  });
  res.status(200).json(result);
};

const handleResponse = (res, status, data) => {
  if (res) {
    return res.status(status).json(data);
  } else {
    return data;
  }
};

export default {
  signup: ctrlWrapper(signup),
  signin: ctrlWrapper(signin),
  logout: ctrlWrapper(logout),
  getCurrent: ctrlWrapper(getCurrent),
  getRefreshCurrent: ctrlWrapper(getRefreshCurrent),
  forgotPassword: ctrlWrapper(forgotPassword),
  updatePassword: ctrlWrapper(updatePassword),
  updateUserdata: ctrlWrapper(updateUserdata),
};
