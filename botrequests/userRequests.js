import { findComplex } from "../services/complexServices.js";
import {
  findUser,
  findUserById,
  updateUser,
} from "../services/userServices.js";

export const addUserAddresByBot = async ({
  residential_complex,
  building,
  entrance,
  apartment,
  chatId,
}) => {
  try {
    const user = await findUser({ botChatId: chatId });

    if (!user) {
      return "You are not registered in the system. Please, register first";
    }
    const { _id } = user;
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
      const message = `The address: residential complex - ${residential_complex}, building - ${building}, entrance - ${entrance}, apartment - ${apartment} does not exist! Enter the correct data`;
      return message;
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
      const message = `This address already exists, so you can't write down this address once more`;
      return message;
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
    return result;
  } catch (error) {
    console.error("🔥 Error in addUserAddresByBot: ", error);
    return error;
  }
};
