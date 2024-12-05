import ctrlWrapper from "../decorators/ctrlWrapper.js";
import HttpError from "../helpers/HttpError.js";
import { addComplex, findComplex } from "../services/complexServices.js";

const createComplex = async (req, res) => {
  const {
    name,
    images,
    parking,
    addresses,
    // apartmentsNumber,
    entrances,
    security,
    access_control,
    concierge,
    playground,
    closed_area,
    video_surveillance,
    floors,
  } = req.body;

  const complex = await findComplex({ name });

  if (complex) {
    throw HttpError(403, `You can't add complex, which already exists`);
  }

  // const apartmentNumbers = [];
  // for (let i = 1; i <= apartmentsNumber; i += 1) {
  //   apartmentNumbers.push(i);
  // }
  // console.log(apartmentNumbers);
  const buildings = [];

  addresses.forEach((address) => {
    const building = {};
    // building.apartments = [];
    building.address = address;

    // apartmentNumbers.forEach((apartmentNumber) => {
    //   const apartmentsPerEntrance = Math.ceil(apartmentsNumber / entrances);
    //   const apartment = {
    //     number: apartmentNumber,
    //     entrance:
    //       apartmentNumber <= apartmentsPerEntrance
    //         ? 1
    //         : apartmentNumber > apartmentsPerEntrance &&
    //           apartmentNumber <= 2 * apartmentsPerEntrance
    //         ? 2
    //         : apartmentNumber > 2 * apartmentsPerEntrance &&
    //           apartmentNumber <= 3 * apartmentsPerEntrance
    //         ? 3
    //         : apartmentNumber > 3 * apartmentsPerEntrance &&
    //           apartmentNumber <= 4 * apartmentsPerEntrance
    //         ? 5
    //         : 6,
    //   };
    //   building.apartments.push(apartment);
    // });
    buildings.push(building);
  });
  // console.log(buildings);

  const data = {
    name,
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

export default { createComplex: ctrlWrapper(createComplex) };
