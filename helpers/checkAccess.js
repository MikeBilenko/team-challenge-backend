import { findContactInfoById } from "../services/contactInfoservices.js";
import HttpError from "./HttpError.js";

export const CheckAccess = async (params, user) => {
  const { is_admin, buildings } = user;

  let contactInfo;
  if (params.contactInfoId) {
    contactInfo = await findContactInfoById(params.contactInfoId);

    if (!contactInfo) {
      throw HttpError(404, "Contact info not found");
    }
  }

  const residential_complex_id = params.contactInfoId
    ? contactInfo.residential_complex_id
    : params.residential_complex_id;

  const searchComplex = buildings.find((elem) => {
    return (
      elem.residential_complex_id.toString() ===
      residential_complex_id.toString()
    );
  });

  if (!is_admin && !searchComplex) {
    throw HttpError(403, `The user is not related to the specified complex.`);
  }

  const moderator = is_admin ? false : searchComplex.moderator;
  console.log(moderator);
  let access = true;
  if (!is_admin && !moderator) {
    //     throw HttpError(403, "You don't have access to this action!");
    access = false;
  }
  const checkAccessRequest = { access, contactInfo, searchComplex };
  //   console.log("checkAccessRequest: ", checkAccessRequest);
  return checkAccessRequest;
};
