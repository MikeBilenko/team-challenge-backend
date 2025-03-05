import TelegramBot from "node-telegram-bot-api";
import "dotenv/config";
import { signinHelper } from "./authServices.js";

const { BOT_TOKEN } = process.env;

const bot = new TelegramBot(BOT_TOKEN, { polling: true });
const users = {};

console.log("🤖 Telegram Bot launched!");

export const startBot = () => {
  //User's email request
  bot.onText(/\/login/, (msg) => {
    const chatId = msg.chat.id;
    bot.sendMessage(chatId, "Enter your email:");
    users[chatId] = { step: "email" };
    console.log("users: ", users);
    console.log("users[chatId]: ", users[chatId]);
  });

  // Processing messages (email -> password -> JWT)
  bot.on("message", async (msg) => {
    const chatId = msg.chat.id;
    const text = msg.text;
    console.log("chatId: ", chatId);

    if (users[chatId]) {
      if (users[chatId].step === "email") {
        users[chatId].email = text;
        users[chatId].step = "password";
        bot.sendMessage(chatId, "Now Enter your password:");
        console.log("users[chatId]: ", users[chatId]);
      } else if (users[chatId].step === "password") {
        users[chatId].password = text;
        users[chatId].step = null;
        console.log("users[chatId]: ", users[chatId]);

        try {
          console.log("Calling signinHelper from bot...");
          const result = await signinHelper(
            users[chatId].email,
            users[chatId].password
          );
          console.log("📨 Result from signinHelper:", result);
          if (result?.tokens) {
            bot.sendMessage(chatId, "✅ User logged in successfully!");
            console.log("You logged in successfully:", result);
          } else {
            bot.sendMessage(
              chatId,
              `❌ Error: ${result?.error || "Unknown error"}`
            );
          }
        } catch (error) {
          console.error("🔥 Authorization error:", error);
          bot.sendMessage(chatId, "❌ Server error. Try later.");
        }
        delete users[chatId];
      }
    }
  });
};
