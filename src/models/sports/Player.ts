import mongoose, { Schema, Document, Model } from "mongoose";

export interface IPlayer extends Document {
  externalId: string;
  name: string;
  teamId: string;
  teamName: string;
  sport: string;
  position?: string;
  nationality?: string;
  dateBorn?: string;
  height?: string;
  weight?: string;
  number?: string;
  thumb?: string;
  description?: string;
  status?: string;
  lastSyncAt: Date;
}

const PlayerSchema = new Schema<IPlayer>(
  {
    externalId: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    teamId: { type: String, required: true },
    teamName: { type: String, required: true },
    sport: { type: String, required: true },
    position: String,
    nationality: String,
    dateBorn: String,
    height: String,
    weight: String,
    number: String,
    thumb: String,
    description: String,
    status: String,
    lastSyncAt: { type: Date, default: Date.now },
  },
  {
    timestamps: true,
    collection: "players",
  }
);

PlayerSchema.index({ externalId: 1 }, { unique: true });
PlayerSchema.index({ teamId: 1 });
PlayerSchema.index({ name: "text" });

const Player: Model<IPlayer> =
  mongoose.models.Player || mongoose.model<IPlayer>("Player", PlayerSchema);

export default Player;
