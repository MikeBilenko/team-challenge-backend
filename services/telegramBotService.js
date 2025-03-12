import TelegramBot from "node-telegram-bot-api";
import "dotenv/config";
import { signinHelper } from "./authServices.js";
import { findUser, findUsers, updateUser } from "./userServices.js";
import { addUserAddresByBot } from "../botrequests/userRequests.js";
import { login, logout, start } from "./commands.js";

const { BOT_TOKEN } = process.env;

const bot = new TelegramBot(BOT_TOKEN, { polling: true });
const users = {};
const userStates = {};

async function updateUserCommands(chatId, command = "start") {
  let commands = [];

  switch (command) {
    case "start":
      commands = start;
      break;
    case "login":
      commands = login;
      break;
    case "logout":
      commands = logout;
      break;
    default:
      commands = start;
  }

  await bot.setMyCommands(commands, {
    scope: { type: "chat", chat_id: chatId },
  });
}

console.log("🤖 Telegram Bot launched!");

export const startBot = () => {
  let userId = "";
  bot.onText(/\/start/, async (msg) => {
    const chatId = msg.chat.id;
    if (userStates[chatId] !== "start") return;
    userStates[chatId] = "login";
    await updateUserCommands(chatId, userStates[chatId]);
    bot.sendMessage(chatId, "Welcome! Now enter /login");
    return;
  });

  bot.onText(/\/login/, async (msg) => {
    const chatId = msg.chat.id;
    if (userStates[chatId] !== "login") return;
    userStates[chatId] = "logout";
    await updateUserCommands(chatId, userStates[chatId]);
    bot.sendMessage(chatId, "Enter your email:");
    users[chatId] = { step: "email" };
  });

  bot.onText(/\/logout/, async (msg) => {
    console.log("msg.text: ", msg.text);
    const chatId = msg.chat.id;
    console.log("userStates[chatId]: ", userStates[chatId]);
    if (userStates[chatId] !== "logout") return;
    userStates[chatId] = "start";
    console.log("userStates[chatId]: ", userStates[chatId]);
    await updateUserCommands(chatId, userStates[chatId]);
    bot.sendMessage(chatId, "Confirm log out, please", {
      reply_markup: {
        keyboard: [[{ text: "✅ Confirm" }, { text: "❌ Cancel" }]],
        resize_keyboard: true,
      },
    });
    users[chatId].step = "logout";
    console.log("users[chatId].step: ", users[chatId].step);
  });

  bot.on("polling_error", console.log);

  // Processing messages (email -> password -> JWT)
  bot.on("message", async (msg) => {
    const chatId = msg.chat.id;
    const text = msg.text;
    if (!userStates[chatId]) {
      userStates[chatId] = "start";
    }

    if (users[chatId]) {
      if (users[chatId].step === "email") {
        users[chatId].email = text;
        users[chatId].step = "password";
        bot.sendMessage(chatId, "Now Enter your password:");
      } else if (users[chatId].step === "password") {
        users[chatId].password = text;
        users[chatId].step = null;

        try {
          const result = await signinHelper(
            users[chatId].email,
            users[chatId].password
          );
          if (result?.tokens) {
            userId = result._id;
            console.log("result.tokens: ", result.tokens);
            const user = await updateUser(
              userId,
              { botChatId: chatId },
              { projection: { password: 0 } }
            );
            console.log("user: ", user);
            await bot.sendMessage(chatId, "✅ User logged in successfully!");
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
        delete users[chatId].step;
      } else if (users[chatId].step === "logout") {
        if (text == "❌ Cancel") {
          bot.sendMessage(chatId, "You canceled log out", {
            reply_markup: {
              remove_keyboard: true,
            },
          });

          delete users[chatId].step;
        } else if (text == "✅ Confirm") {
          try {
            const user = await updateUser(
              userId,
              { $unset: { botChatId: "" } },
              { projection: { password: 0 } }
            );
            console.log("user: ", user);
            bot.sendMessage(chatId, "You confirmed log out", {
              reply_markup: {
                remove_keyboard: true,
              },
            });
            delete users[chatId];
          } catch (error) {
            console.log(error);
            bot.sendMessage(chatId, "❌ Log out error.");
          }
        }
      } else if (users[chatId].step === "residential_complex") {
        users[chatId].residential_complex = text;
        users[chatId].step = "building";
        bot.sendMessage(chatId, "Enter your building:");
      } else if (users[chatId].step === "building") {
        users[chatId].building = text;
        users[chatId].step = "entrance";
        bot.sendMessage(chatId, "Enter your entrance:");
      } else if (users[chatId].step === "entrance") {
        users[chatId].entrance = text;
        users[chatId].step = "apartment";
        bot.sendMessage(chatId, "Enter your apartment:");
      } else if (users[chatId].step === "apartment") {
        users[chatId].apartment = text;
        users[chatId].step = null;
        try {
          console.log("chatId: ", chatId);
          const result = await addUserAddresByBot({
            chatId,
            residential_complex: users[chatId].residential_complex,
            building: users[chatId].building,
            entrance: users[chatId].entrance,
            apartment: users[chatId].apartment,
          });
          if (typeof result === "string") {
            bot.sendMessage(chatId, result);
          } else if (typeof result !== "string") {
            console.log("result: ", result);
            console.log("result.buildings: ", result.buildings);

            const userProperties = result.buildings.map((elem) => {
              elem.residential_complex_id;
              const addresses = elem.addresses.map((elem) => {
                elem.building;
                const apartments = elem.apartments.map((elem) => {
                  const apartment = `\n entrance: ${elem.entrance} apartment: ${elem.apartment}`;
                  return apartment;
                });
                const address = `\n building: ${
                  elem.building
                }\n apartments:${apartments.join()} `;

                return address;
              });
              const complex = `\n Residential complex: ${
                elem.residential_complex_id
              }\n  addresses: ${addresses.join()} `;

              return complex;
            });
            bot.sendMessage(
              chatId,
              ` ✅ Your address has been added successfully! \n${userProperties.join()}`
            );
          } else {
            bot.sendMessage(chatId, "❌ Error: Unknown error");
          }
        } catch (error) {
          console.error("🔥 Error in addUserAddresByBot: ", error);
          bot.sendMessage(chatId, "❌ Error: Server error");
        }
      }
    }
  });
};

export async function sendComplexes(data) {
  const users = await findUsers({ botChatId: { $exists: true } });
  const userBotChatIds = users.map((user) => user.botChatId);
  console.log("userBotChatIds: ", userBotChatIds);
  const botData = data.map((elem) => elem.name).join("\n");
  console.log("botData: ", botData);
  const message = `🏢 List of complexes:\n${botData}`;
  if (users) {
    for (const user of users) {
      if (user.botChatId) {
        bot.sendMessage(user.botChatId, message);
      }
    }
  }
}

bot.onText(/\/getprofile/, async (msg) => {
  const chatId = msg.chat.id;
  const { name, email, phone } = await findUser({ botChatId: chatId });

  console.log("name,email,phone,avatar: ", name, email, phone);

  bot.sendMessage(chatId, `😟 User:\n${name}\n${email}\n${phone}`);
});

bot.onText(/\/add_address/, async (msg) => {
  const chatId = msg.chat.id;
  bot.sendMessage(chatId, "Enter your residential complex:");
  users[chatId] = { step: "residential_complex" };
});
