import mongoose, { Schema, Document, Model } from "mongoose";

export interface IFantasyPlayer {
  playerId: string;
  playerName: string;
  teamId: string;
  teamName: string;
  position: "GK" | "DEF" | "MID" | "FWD";
  price: number;
  isCaptain: boolean;
  isViceCaptain: boolean;
  isOnBench: boolean;
}

export interface IFantasyTeam extends Document {
  userId: mongoose.Types.ObjectId;
  leagueId: mongoose.Types.ObjectId;
  name: string;
  formation: string;
  players: IFantasyPlayer[];
  totalPoints: number;
  remainingBudget: number;
  createdAt: Date;
  updatedAt: Date;
}

const FantasyPlayerSchema = new Schema({
  playerId: { type: String, required: true },
  playerName: { type: String, required: true },
  teamId: { type: String, required: true },
  teamName: { type: String, required: true },
  position: {
    type: String,
    required: true,
    enum: ["GK", "DEF", "MID", "FWD"],
  },
  price: { type: Number, required: true },
  isCaptain: { type: Boolean, default: false },
  isViceCaptain: { type: Boolean, default: false },
  isOnBench: { type: Boolean, default: false },
});

const FantasyTeamSchema = new Schema<IFantasyTeam>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "UserProfile", required: true },
    leagueId: {
      type: Schema.Types.ObjectId,
      ref: "FantasyLeague",
      required: true,
    },
    name: { type: String, required: true, default: "My Team" },
    formation: { type: String, default: "4-3-3" },
    players: [FantasyPlayerSchema],
    totalPoints: { type: Number, default: 0 },
    remainingBudget: { type: Number, default: 100 },
  },
  {
    timestamps: true,
    collection: "fantasyteams",
  }
);

FantasyTeamSchema.index({ userId: 1, leagueId: 1 }, { unique: true });
FantasyTeamSchema.index({ leagueId: 1, totalPoints: -1 });

const FantasyTeam: Model<IFantasyTeam> =
  mongoose.models.FantasyTeam ||
  mongoose.model<IFantasyTeam>("FantasyTeam", FantasyTeamSchema);

export default FantasyTeam;
