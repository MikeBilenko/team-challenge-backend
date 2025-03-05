import ctrlWrapper from "../decorators/ctrlWrapper.js";
import HttpError from "../helpers/HttpError.js";
import sendEmail from "../helpers/sendEmail.js";
import { findComplex } from "../services/complexServices.js";
import {
  findUser,
  findUserById,
  updateUser,
  updateUserAddress,
} from "../services/userServices.js";
import "dotenv/config";

const { DEPLOY_HOST } = process.env;

const addUserAddresses = async (req, res) => {
  const { _id, email, name } = req.user;
  const { residential_complex, building, entrance, apartment } = req.body;

  const existedAddress = await findComplex({
    name: residential_complex,
    buildings: {
      $elemMatch: {
        address: building,
        apartments: { $elemMatch: { number: apartment, entrance: entrance } },
      },
    },
  });
  if (!existedAddress) {
    throw HttpError(
      400,
      `The address: residential complex - ${residential_complex}, building - ${building}, entrance - ${entrance}, apartment - ${apartment} does not exist! Enter the correct data`
    );
  }

  const { _id: building_id } = existedAddress.buildings.find(
    (elem) => elem.address === building
  );

  const { buildings } = await findUserById(_id);

  const existedUserAddress = await findUser({
    _id,
    buildings: {
      $elemMatch: {
        residential_complex_id: existedAddress._id,
        addresses: {
          $elemMatch: {
            building,
            apartments: { $elemMatch: { entrance, apartment } },
          },
        },
      },
    },
  });

  if (existedUserAddress) {
    throw HttpError(
      409,
      `This address already exists, so you can't write down this address once more`
    );
  }

  const searchComplexIndex = buildings.findIndex((elem) => {
    return (
      elem.residential_complex_id.toString() === existedAddress._id.toString()
    );
  });

  if (searchComplexIndex > -1) {
    const searchBuildingIndex = buildings[
      searchComplexIndex
    ].addresses.findIndex((elem) => elem.building === building);

    if (searchBuildingIndex > -1) {
      const newBuilding = buildings[searchComplexIndex].addresses[
        searchBuildingIndex
      ].apartments.push({ entrance, apartment });
    } else
      buildings[searchComplexIndex].addresses.push({
        building_id,
        building,
        apartments: [{ entrance, apartment }],
      });
  } else {
    buildings.push({
      residential_complex_id: existedAddress._id,
      addresses: [
        { building_id, building, apartments: [{ entrance, apartment }] },
      ],
    });
  }

  const result = await updateUser(
    _id,
    { buildings },
    { projection: { password: 0 } }
  );

  const { email: adminEmail } = await findUser({ is_admin: true });
  // console.log(`adminEmail: ${adminEmail}`);
  // xegoxa5375sw@cantozil.com
  // peqogyjy@cyclelove.cc
  const userEmail = {
    to: email,
    subject: "Your addresses",
    html: `<h1>Hello, ${name}!</h1>
        <p>Congratulations!</p><p>Your addresses <span style='font-weight: bold; color: green;'>(residential complex - ${residential_complex}, building - ${building}, entrance - ${entrance}, apartment - ${apartment})</span> have been successfully added to your profile.</p>
         <p>Now you need to wait for the moderator's approval.</p>
         <p>You will be notified of this by email.</p>
         <p>If you have any questions, you can always contact our support team.</p>
        <p style="margin-top: 10px;">Best regards,</p>
        <p style="margin-top: 10px;">The Teamchallenge Chat Team</p>`,
  };

  const emailOfAdmin = {
    to: adminEmail,
    subject: "For approving",
    html: `<p>The user ${name} has applied for approving his address <span style='font-weight: bold; color: green;'>(residential complex - ${residential_complex}, building - ${building}, entrance - ${entrance}, apartment - ${apartment})</span></p>
    <p>Please follow the link below to approve</p>
    <a href='${DEPLOY_HOST}/approve/${_id}?residential_complex=${residential_complex}&building=${building}&entrance=${entrance}&apartment=${apartment}' style='margin-top: 20px; font-size:18px; font-weight:bold; color:red' target='_blank'>Click to approve</a>
    `,
  };

  await sendEmail(userEmail);
  await sendEmail(emailOfAdmin);
  res.status(200).json(result);
};

const deleteUserAddress = async (req, res) => {
  const { _id, email, name } = req.user;
  const { residential_complex, building, entrance, apartment } = req.body;

  const { _id: complexId } = await findComplex({
    name: residential_complex,
  });

  let { buildings } = await findUserById(_id);

  const existedUserAddress = await findUser({
    _id,
    buildings: {
      $elemMatch: {
        residential_complex_id: complexId,
        addresses: {
          $elemMatch: {
            building,
            apartments: { $elemMatch: { entrance, apartment } },
          },
        },
      },
    },
  });
  if (!existedUserAddress) {
    throw HttpError(
      400,
      `Sorry, but this address doesn't exist in your addresses list, so you have to enter the correct address`
    );
  }
  // console.log(existedUserAddress);
  const searchComplexIndex = buildings.findIndex(
    (elem) => elem.residential_complex_id.toString() === complexId.toString()
  );
  console.log(searchComplexIndex);
  const searchBuildingIndex = buildings[searchComplexIndex].addresses.findIndex(
    (elem) => elem.building === building
  );
  console.log(searchBuildingIndex);
  const newApartments = buildings[searchComplexIndex].addresses[
    searchBuildingIndex
  ].apartments.filter(
    (elem) => elem.apartment !== apartment || elem.entrance !== entrance
  );
  console.log("newApartments: ", newApartments);
  if (newApartments.length === 0) {
    const newAddresses = buildings[searchComplexIndex].addresses.filter(
      (elem) => elem.building !== building
    );
    if (newAddresses.length === 0) {
      const newBuildings = buildings.filter(
        (elem) =>
          elem.residential_complex_id.toString() !== complexId.toString()
      );
      buildings = newBuildings;
    } else {
      buildings[searchComplexIndex].addresses = newAddresses;
    }
  } else {
    buildings[searchComplexIndex].addresses[searchBuildingIndex].apartments =
      newApartments;
  }
  // console.log(
  //   buildings[searchComplexIndex].addresses[searchBuildingIndex].apartments
  // );
  console.log(buildings);
  // console.log(searchBuildingIndex);
  // const newBuildings = await buildings.filter(
  //   (userAddress) =>
  //     userAddress.residential_complex_id !== complexId ||
  //     userAddress.building !== building ||
  //     userAddress.entrance !== entrance ||
  //     userAddress.apartment !== apartment
  // );
  // const result = await updateUser(_id, { buildings: newBuildings });
  const result = await updateUser(
    _id,
    { buildings },
    { projection: { password: 0 } }
  );

  res.json(result);
};

const approveUserAddress = async (req, res, next) => {
  const { userId } = req.params;
  const { residential_complex, building, entrance, apartment } = req.query;
  const { _id } = req.user;

  const { is_admin } = await findUserById(_id);
  console.log(is_admin);
  if (!is_admin) {
    throw HttpError(
      403,
      "Sorry, you must be an administrator to perform this action."
    );
  }

  const { _id: complexId } = await findComplex({
    name: residential_complex,
  });

  const { modifiedCount, matchedCount } = await updateUserAddress(
    { _id: userId },
    {
      // $set: { "buildings.$[elem].approved": true },
      $set: {
        "buildings.$[buildingElem].addresses.$[addressElem].apartments.$[apartmentElem].approved": true, //Updating a specific array element
      },
    },
    {
      arrayFilters: [
        /********************************************************
         ***there is a filtering object for each nesting level***/
        {
          "buildingElem.residential_complex_id": complexId,
        }, //Condition for filtering buildings
        { "addressElem.building": building }, //Condition for filtering addresses
        {
          "apartmentElem.apartment": apartment, //Condition for filtering apartments
          "apartmentElem.entrance": entrance, //Condition for filtering entrance
        },
      ],
    }
  );
  if ((modifiedCount !== 1 && matchedCount === 1) || matchedCount === 0) {
    throw HttpError(400, "The wrong request data");
  }
  // res.json("User address data was approved");
  next();
  // await createChatRooom(req, res);
};

const setModeratorStatus = async (req, res) => {
  const { userId, complex_id } = req.params;
  // const keys = Object.keys(req.query);
  const values = Object.values(req.query);
  // console.log(req.query);
  // console.log(keys[0]);
  // console.log(values[0]);
  const { is_admin } = req.user;
  if (!is_admin) {
    throw HttpError(403, `Sorry, only admins can assign  moderator status`);
  }
  const { modifiedCount, matchedCount } = await updateUserAddress(
    { _id: userId },
    {
      $set: {
        "buildings.$[elem].moderator": values[0] ? true : false,
      },
    },
    { arrayFilters: [{ "elem.residential_complex_id": complex_id }] }
  );
  if ((modifiedCount !== 1 && matchedCount === 1) || matchedCount === 0) {
    throw HttpError(400, "The wrong request data");
  }

  const { email, name } = await findUserById({ _id: userId });
  console.log(name);
  const { name: complex } = await findComplex({ _id: complex_id });
  const userEmail = {
    to: email,
    subject: "Moderator",
    html: `<h1>Hello, ${name}!</h1>
        <p>Congratulations!</p><p>${
          values[0]
            ? "You have become the moderator "
            : "You are not the moderator"
        } of "${complex}" ${values[0] ? "" : "anymore"}.</p>
         <p>Now you have the right to manage users and commit actions that deal with your duties</p>
        <p style="margin-top: 10px;">Best regards,</p>
        <p style="margin-top: 10px;">The Teamchallenge Chat Team</p>`,
  };
  await sendEmail(userEmail);

  const result = await findUserById({ _id: userId }, "-password");
  res.status(200).json(result);
};

const getUser = async (req, res) => {
  const { userId: _id } = req.params;
 chatRoomsExtas
  const result = await findUserById(_id, "-password, -tokens");
  res.json(result);
};

export default {
  addUserAddresses: ctrlWrapper(addUserAddresses),
  deleteUserAddress: ctrlWrapper(deleteUserAddress),
  approveUserAddress: ctrlWrapper(approveUserAddress),
  setModeratorStatus: ctrlWrapper(setModeratorStatus),
  getUser: ctrlWrapper(getUser),
};
