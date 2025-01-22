import ctrlWrapper from "../decorators/ctrlWrapper.js";
import cloudinary from "../helpers/cloudinary.js";
import fs from "fs/promises";
import { findComplex } from "../services/complexServices.js";
import { addNewsChannel } from "../services/newsChannelServices.js";

const createNewsChannel = async (req, res) => {
  const { is_admin, buildings } = req.user;
  const { residential_complex_id, building_id } = req.params;
  const { title } = req.body;
  console.log("Math.random() ", Math.random());
  const { url: picture } = await cloudinary.uploader.upload(req.file.path, {
    folder: "teamchallenge",
  });
  const { path: oldPath } = req.file;

  await fs.rm(oldPath);

  const searchComplex = buildings.find((elem) => {
    return (
      elem.residential_complex_id.toString() ===
      residential_complex_id.toString()
    );
  });

  if (!is_admin && !searchComplex) {
    throw HttpError(404, `The user is not related to the specified complex.`);
  }

  const moderator = is_admin ? false : searchComplex.moderator;
  console.log(moderator);
  if (!is_admin && !moderator) {
    throw HttpError(403, "You don't have access to this action!");
  }

  const complex = await findComplex({
    _id: residential_complex_id,
    buildings: {
      $elemMatch: {
        _id: building_id,
      },
    },
  });

  const result = complex
    ? await addNewsChannel({
        picture,
        title,
        residential_complex_id,
        building_id,
      })
    : await addNewsChannel({ title, residential_complex_id });

  res.status(201).json(result);
};

const getNewsChannels = async (req, res) => {
  const { is_admin, buildings } = req.user;
  const { residential_complex_id } = req.params;
  const { page = 1, limit = 20, type = "", building_id = "" } = req.query;
  const skip = (page - 1) * limit;

  const complex = buildings.find(
    (elem) =>
      elem.residential_complex_id.toString() ===
      residential_complex_id.toString()
  );

  if (!is_admin && !complex) {
    throw HttpError(403, "You don't have access to this action!");
  }
  let building;
  if (building_id) {
    building = complex.addresses.find((elem) => {
      if (elem.building_id) {
        return elem.building_id.toString() === building_id.toString();
      }
    });
  }

  if (!is_admin && building_id && !building) {
    throw HttpError(403, "You don't have access to this action!");
  }
  res.json("Check OK");
};
export default { createNewsChannel: ctrlWrapper(createNewsChannel) };
