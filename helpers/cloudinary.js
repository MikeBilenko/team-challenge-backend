import { v2 as cloudinary } from "cloudinary";
import "dotenv/config";

const { CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET } =
  process.env;

cloudinary.config({
  cloud_name: CLOUDINARY_CLOUD_NAME,
  api_key: CLOUDINARY_API_KEY,
  api_secret: CLOUDINARY_API_SECRET,
});

// const pictureUpload = cloudinary;

// const timestamp = Math.floor(Date.now() / 1000);

// const signature = cloudinary.utils.api_sign_request(
//   { timestamp, folder: "teamchallenge" },
//   CLOUDINARY_API_SECRET
// );

// export default { pictureUpload, timestamp, signature };
export default cloudinary;
