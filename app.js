import express from "express";
import morgan from "morgan";
import cors from "cors";
import mongoose from "mongoose";
import dotenv from "dotenv";
// import expressOasGenerator from "express-oas-generator";
// import swaggerUi from "swagger-ui-express";
import fs from "fs";
import swaggerUi from "swagger-ui-express";
import YAML from "yaml";
// import { createServer } from "node:http";
// import swaggerDocument from "./docs/swagger.json" assert { type: "json" };
// import contactsRouter from "./routes/contactsRouter.js";
import authRouter from "./routes/authRouter.js";
import usersRouter from "./routes/usersRouter.js";
import complexesRouter from "./routes/complexesRouter.js";
import chatRoomsRouter from "./routes/chatRoomsRouter.js";
import notificationsRouter from "./routes/notificationsRouter.js";
import votingsRouter from "./routes/votingsRouter.js";
import newsChannelRouter from "./routes/newsChannelRouter.js";
import newsRouter from "./routes/NewsRouter.js";
import contactInfoRouter from "./routes/contactInfoRouter.js";
// import { startBot } from "./services/telegramBotService.js";

// import googleAuthRouter from "./routes/googleAuthRouter.js";

dotenv.config();

const app = express();

// const oasPath = "./oas.json";
// expressOasGenerator.init(app, { specOutputPath: "./docs/oas.json" });
// Инициализация express-oas-generator
// expressOasGenerator.init(app, {});
// expressOasGenerator.handleResponses(app, {});

app.use(morgan("tiny"));
app.use(cors());
app.use(express.json());

app.use(express.static("upload/images"));

app.use("/auth", authRouter);
app.use("/users", usersRouter);
app.use("/complexes", complexesRouter);
app.use("/chat_rooms", chatRoomsRouter);
app.use("/notifications", notificationsRouter);
app.use("/votings", votingsRouter);
app.use("/news_channels", newsChannelRouter);
app.use("/news", newsRouter);
app.use("/contact_info", contactInfoRouter);
// app.use("/", googleAuthRouter);

const file = fs.readFileSync("./docs/swagger.yaml", "utf8");
const swaggerDocument = YAML.parse(file);
app.use("/docs", swaggerUi.serve, swaggerUi.setup(swaggerDocument));

app.use((_, res) => {
  res.status(404).json({ message: "Route not found" });
});

app.use((err, req, res, next) => {
  const { status = 500, message = "Server error" } = err;
  res.status(status).json({ message });
});

// Проверяем наличие файла oas.json
// if (!fs.existsSync(oasPath)) {
//   console.log(
//     "oas.json не найден. Он будет создан после первого запуска приложения."
//   );
//   fs.writeFileSync(oasPath, JSON.stringify({}), "utf-8"); // Создаем пустой файл
// }

// Подключаем Swagger UI
// try {
//   const oasJson = JSON.parse(fs.readFileSync(oasPath, "utf-8"));
//   app.use("/docs", swaggerUi.serve, swaggerUi.setup(oasJson));
// } catch (error) {
//   console.error("Ошибка парсинга oas.json:", error.message);
// }

// expressOasGenerator.handleRequests();
// if (fs.existsSync(oasPath)) {
//   const oasJson = JSON.parse(fs.readFileSync(oasPath, "utf-8"));
//   app.use("/docs", swaggerUi.serve, swaggerUi.setup(oasJson));
// } else {
//   console.warn("oas.json does not exist yet. Run the server to generate it.");
// }

const { DB_HOST, PORT = 3000 } = process.env;

mongoose
  .connect(DB_HOST)
  .then(() => {
    console.log("Database connection successful");

    // startBot();

    app.listen(PORT, () => {
      console.log(`Server is running. Use our API on port: ${PORT}`);
    });
  })
  .catch((error) => {
    console.log(error.message);
    process.exit(1);
  });
