import ctrlWrapper from "../decorators/ctrlWrapper.js";
import cloudinary from "../helpers/cloudinary.js";
import HttpError from "../helpers/HttpError.js";
import fs from "fs/promises";
import {
  addComplex,
  findComplex,
  findComplexById,
  getListOfComplexes,
  removeComplex,
  updateComplexById,
} from "../services/complexServices.js";

const createComplex = async (req, res) => {
  const { is_admin } = req.user;
  if (!is_admin) {
    throw HttpError(403, `You must be an administrator to commit this action`);
  }
  const {
    name,
    description,
    ltd,
    lng,
    parking,
    addresses,
    entrances,
    security,
    access_control,
    concierge,
    playground,
    closed_area,
    video_surveillance,
    floors,
  } = req.body;
  console.log("first*******************");
  console.log(req.files);
  // ***For uploading one file***
  // const { url: image } = await cloudinary.uploader.upload(req.file.path, {
  //   folder: "teamchallenge",
  // });
  // const { path: oldPath } = req.file;
  // await fs.rm(oldPath);

  // ***For uploading a few files***
  const uploadedResults = await Promise.all(
    req.files.map((file) =>
      cloudinary.uploader.upload(file.path, {
        folder: "teamchallenge",
      })
    )
  );
  const images = uploadedResults.map((elem) => elem.url);
  const paths = req.files.map((elem) => elem.path);

  console.log("images: ", images);
  console.log("paths: ", paths);

  await paths.forEach((elem) => fs.rm(elem));

  const complex = await findComplex({ name });

  if (complex) {
    throw HttpError(403, `You can't add complex, which already exists`);
  }

  // The first variant
  // const buildings = [];

  // addresses.forEach((address) => {
  //   const building = {};
  //   building.address = address;

  //   buildings.push(building);
  // });

  // The second variant
  const buildings = addresses.map((address) => {
    return { address };
  });

  const data = {
    name,
    description,
    location: {
      ltd,
      lng,
    },
    images,
    properties: {
      parking,
      security,
      access_control,
      concierge,
      playground,
      closed_area,
      video_surveillance,
      floors,
      entrances,
    },
    buildings,
  };
  const result = await addComplex(data);
  res.status(201).json(result);
};

const updateComplex = async (req, res) => {
  const { is_admin } = req.user;
  if (!is_admin) {
    throw HttpError(403, `You must be an administrator to commit this action`);
  }
  const { complexId: _id } = req.params;

  const result = await updateComplexById(_id, req.body);
  res.status(200).json(result);
};

const getComplexes = async (req, res) => {
  const result = await getListOfComplexes();
  res.json(result);
};

const getComplex = async (req, res) => {
  const { complexId: _id } = req.params;
  const result = await findComplexById(_id);
  res.json(result);
};

const deleteComplex = async (req, res) => {
  const { is_admin } = req.user;
  if (!is_admin) {
    throw HttpError(403, `You must be an administrator to commit this action`);
  }
  const { complexId: _id } = req.params;
  const result = await removeComplex(_id);

  res.json(result);
};

export default {
  createComplex: ctrlWrapper(createComplex),
  updateComplex: ctrlWrapper(updateComplex),
  getComplexes: ctrlWrapper(getComplexes),
  getComplex: ctrlWrapper(getComplex),
  deleteComplex: ctrlWrapper(deleteComplex),
};

// const createComplex = async (req, res) => {
//   const {
//     name,
//     images,
//     parking,
//     addresses,
//     apartmentsNumber,
//     entrances,
//     security,
//     access_control,
//     concierge,
//     playground,
//     closed_area,
//     video_surveillance,
//     floors,
//   } = req.body;

//   const complex = await findComplex({ name });

//   if (complex) {
//     throw HttpError(403, `You can't add complex, which is allready exists`);
//   }

//   const apartmentNumbers = [];
//   for (let i = 1; i <= apartmentsNumber; i += 1) {
//     apartmentNumbers.push(i);
//   }
//   console.log(apartmentNumbers);
//   const buildings = [];

//   addresses.forEach((address) => {
//     const building = {};
//     building.apartments = [];
//     building.address = address;

//     apartmentNumbers.forEach((apartmentNumber) => {
//       const apartmentsPerEntrance = Math.ceil(apartmentsNumber / entrances);
//       const apartment = {
//         number: apartmentNumber,
//         entrance:
//           apartmentNumber <= apartmentsPerEntrance
//             ? 1
//             : apartmentNumber > apartmentsPerEntrance &&
//               apartmentNumber <= 2 * apartmentsPerEntrance
//             ? 2
//             : apartmentNumber > 2 * apartmentsPerEntrance &&
//               apartmentNumber <= 3 * apartmentsPerEntrance
//             ? 3
//             : apartmentNumber > 3 * apartmentsPerEntrance &&
//               apartmentNumber <= 4 * apartmentsPerEntrance
//             ? 5
//             : 6,
//       };
//       building.apartments.push(apartment);
//     });
//     buildings.push(building);
//   });
//   // console.log(buildings);

//   const data = {
//     name,
//     images,
//     properties: {
//       parking,
//       security,
//       access_control,
//       concierge,
//       playground,
//       closed_area,
//       video_surveillance,
//       floors,
//       entrances,
//     },
//     buildings,
//   };
//   const result = await addComplex(data);
//   res.status(201).json(result);
// };
