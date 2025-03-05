import { Schema, model } from "mongoose";
import { handleSaveError, setUpdateSetting } from "./hooks.js";

const apartmentSchema = new Schema({
  number: {
    type: Number,
  },
  entrance: {
    type: Number,
  },
  services_debt: {
    type: Number,
    default: 0,
  },
});

const buildingSchema = new Schema({
  address: {
    type: String,
    lowercase: true,
  },
  apartments: [apartmentSchema],
});

// const locationSchema = new Schema({
//   ltd: String,
//   lng:String
// });

const complexSchema = new Schema(
  {
    name: {
      type: String,
      required: [true, "Name is required"],
    },
    images: [
      {
        type: String,
      },
    ],
    description: String,
    location: {
      ltd: String,
      lng: String,
    },
    properties: {
      parking: {
        type: Boolean,
        required: [true, "Parking is required"],
        default: false,
      },
      security: {
        type: Boolean,
        required: [true, "Security is required"],
        default: false,
      },
      access_control: {
        type: Boolean,
        required: [true, "Access control is required"],
        default: false,
      },
      concierge: {
        type: Boolean,
        required: [true, "Concierge is required"],
        default: false,
      },
      playground: {
        type: Boolean,
        required: [true, "Playground is required"],
        default: false,
      },
      closed_area: {
        type: Boolean,
        required: [true, "Closed area is required"],
        default: false,
      },
      video_surveillance: {
        type: Boolean,
        required: [true, "Video surveillance is required"],
        default: false,
      },
      floors: {
        type: Number,
        required: [true, "Floors is required"],
        default: 1,
      },
      entrances: {
        type: Number,
        required: [true, "Entrances is required"],
        default: 1,
      },
    },
    buildings: [buildingSchema],
  },
  { versionKey: false }
);

complexSchema.post("save", handleSaveError);
complexSchema.pre("findOneAndUpdate", setUpdateSetting);
complexSchema.post("findOneAndUpdate", handleSaveError);

const Complex = model("residential_complex", complexSchema);

export default Complex;
