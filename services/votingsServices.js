import Voting from "../models/Voting.js";

export async function addVoting(data) {
  return Voting.create(data);
}

export const votingsList = (query) => {
  const date = new Date();
  return query.status === "active"
    ? Voting.find({ endDate: { $gt: date } }, "", query)
    : Voting.find({ endDate: { $lte: date } }, "", query);
};

export const addVote = (votingId, vote) => {
  return Voting.findByIdAndUpdate(votingId, vote);
};

export const findVotingById = (votingId) => {
  return Voting.findById(votingId);
};

export function removeVotingById(votingId) {
  return Voting.findByIdAndDelete(votingId);
}
