import mongoose, { Schema, Document, Model } from "mongoose";

export interface IFantasyPoints extends Document {
  userId: mongoose.Types.ObjectId;
  teamId: mongoose.Types.ObjectId;
  leagueId: mongoose.Types.ObjectId;
  roundNumber: number;
  points: number;
  breakdown: {
    playerId: string;
    playerName: string;
    points: number;
    captainMultiplier: number;
    stats: {
      goals?: number;
      assists?: number;
      cleanSheet?: boolean;
      yellowCard?: boolean;
      redCard?: boolean;
      minutesPlayed?: number;
      saves?: number;
    };
  }[];
  totalRoundPoints: number;
  createdAt: Date;
}

const FantasyPointsSchema = new Schema<IFantasyPoints>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "UserProfile", required: true },
    teamId: { type: Schema.Types.ObjectId, ref: "FantasyTeam", required: true },
    leagueId: {
      type: Schema.Types.ObjectId,
      ref: "FantasyLeague",
      required: true,
    },
    roundNumber: { type: Number, required: true },
    points: { type: Number, default: 0 },
    breakdown: [
      {
        playerId: String,
        playerName: String,
        points: Number,
        captainMultiplier: { type: Number, default: 1 },
        stats: {
          goals: Number,
          assists: Number,
          cleanSheet: Boolean,
          yellowCard: Boolean,
          redCard: Boolean,
          minutesPlayed: Number,
          saves: Number,
        },
      },
    ],
    totalRoundPoints: { type: Number, default: 0 },
  },
  {
    timestamps: true,
    collection: "fantasypoints",
  }
);

FantasyPointsSchema.index({ leagueId: 1, roundNumber: 1, totalRoundPoints: -1 });
FantasyPointsSchema.index({ userId: 1, leagueId: 1 });

const FantasyPoints: Model<IFantasyPoints> =
  mongoose.models.FantasyPoints ||
  mongoose.model<IFantasyPoints>("FantasyPoints", FantasyPointsSchema);

export default FantasyPoints;
