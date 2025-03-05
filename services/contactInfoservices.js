import ContactInfo from "../models/ContactInfo.js";

export async function makeContactInfo(data) {
  return await ContactInfo.create(data);
}

export async function findContactInfo(params) {
  return await ContactInfo.findOne(params);
}

export function removeContactInfo(id) {
  return ContactInfo.findByIdAndDelete(id);
}

export function findContactInfoById(id) {
  return ContactInfo.findById(id);
}

export function updateContactInfoById(id, data) {
  return ContactInfo.findByIdAndUpdate(id, data);
}
