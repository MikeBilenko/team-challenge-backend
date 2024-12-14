import ctrlWrapper from "../decorators/ctrlWrapper.js";
import HttpError from "../helpers/HttpError.js";
import User from "../models/User.js";
import { register, setTokens } from "../services/authServices.js";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";
import sendEmail from "../helpers/sendEmail.js";
import { findUser, updateUserByFilter } from "../services/userServices.js";
import bcrypt from "bcrypt";
import { generateRandomCode } from "../helpers/generateRandomCode.js";

dotenv.config();

const { JWT_SECRET, DEPLOY_HOST } = process.env;
const DELAY = 30 * 60 * 1000;

const signup = async (req, res) => {
  const { email, name } = req.body;

  const user = await findUser({ email });
  if (user) {
    throw HttpError(409, "This email is already in use");
  }

  const newUser = await register(req.body);

  const payload = { id: newUser._id };
  const accessToken = jwt.sign(payload, JWT_SECRET, { expiresIn: "1h" });

  const refreshToken = jwt.sign(payload, JWT_SECRET, { expiresIn: "7d" });

  const tokens = await setTokens(newUser._id, accessToken, refreshToken);
  console.log(tokens);

  const loggedInUser = await User.findById({ _id: newUser._id }, "-password");

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
  const { email, password } = req.body;
  const user = await findUser({ email });
  if (!user) {
    throw HttpError(401, "Email is wrong");
  }
  const { password: hashPassword, _id } = user;
  const compare = await bcrypt.compare(password, hashPassword);
  if (!compare) {
    throw HttpError(401, "Password is wrong");
  }

  const payload = { id: _id };

  const accessToken = jwt.sign(payload, JWT_SECRET, { expiresIn: "1h" });

  const refreshToken = jwt.sign(payload, JWT_SECRET, { expiresIn: "7d" });
  await setTokens(_id, accessToken, refreshToken);

  const loggedInUser = await findUser({ _id });

  res.status(200).json(loggedInUser);
};

const logout = async (req, res) => {
  const { _id: id } = req.user;
  await setTokens(id);
  res.status(204).json();
  // res.json("Log out successful");
};

const getCurrent = async (req, res) => {
  const userRes = { ...req.user };
  delete userRes._doc.password;
  const user = userRes._doc;
  console.log(user);
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

  await updateUserByFilter({ email }, { tempCode, tempCodeTime });
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

export default {
  signup: ctrlWrapper(signup),
  signin: ctrlWrapper(signin),
  logout: ctrlWrapper(logout),
  getCurrent: ctrlWrapper(getCurrent),
  getRefreshCurrent: ctrlWrapper(getRefreshCurrent),
  forgotPassword: ctrlWrapper(forgotPassword),
};
