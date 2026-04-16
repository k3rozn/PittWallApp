import mongoose, { Schema, Document, Model } from "mongoose";

export interface IFantasyLeague extends Document {
  name: string;
  sport: "football";
  ownerId: mongoose.Types.ObjectId;
  members: {
    userId: mongoose.Types.ObjectId;
    teamId?: mongoose.Types.ObjectId;
    joinedAt: Date;
    totalPoints: number;
    rank?: number;
  }[];
  inviteCode: string;
  isPublic: boolean;
  competitionExternalId?: string;
  competitionName?: string;
  currentRound: number;
  settings: {
    budget: number;
    maxPlayersPerClub: number;
    squadSize: number;
  };
  createdAt: Date;
  updatedAt: Date;
}

const FantasyLeagueSchema = new Schema<IFantasyLeague>(
  {
    name: { type: String, required: true },
    sport: { type: String, default: "football", enum: ["football"] },
    ownerId: { type: Schema.Types.ObjectId, ref: "UserProfile", required: true },
    members: [
      {
        userId: { type: Schema.Types.ObjectId, ref: "UserProfile" },
        teamId: { type: Schema.Types.ObjectId, ref: "FantasyTeam" },
        joinedAt: { type: Date, default: Date.now },
        totalPoints: { type: Number, default: 0 },
        rank: Number,
      },
    ],
    inviteCode: { type: String, required: true, unique: true },
    isPublic: { type: Boolean, default: false },
    competitionExternalId: String,
    competitionName: String,
    currentRound: { type: Number, default: 1 },
    settings: {
      budget: { type: Number, default: 100 },
      maxPlayersPerClub: { type: Number, default: 3 },
      squadSize: { type: Number, default: 15 },
    },
  },
  {
    timestamps: true,
    collection: "fantasyleagues",
  }
);

FantasyLeagueSchema.index({ inviteCode: 1 }, { unique: true });
FantasyLeagueSchema.index({ "members.userId": 1 });
FantasyLeagueSchema.index({ isPublic: 1 });

const FantasyLeague: Model<IFantasyLeague> =
  mongoose.models.FantasyLeague ||
  mongoose.model<IFantasyLeague>("FantasyLeague", FantasyLeagueSchema);

export default FantasyLeague;
