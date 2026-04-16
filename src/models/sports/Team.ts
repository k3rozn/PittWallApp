import mongoose, { Schema, Document, Model } from "mongoose";

export interface ITeam extends Document {
  externalId: string;
  name: string;
  sport: string;
  league?: { id: string; name: string };
  badge?: string;
  jersey?: string;
  country?: string;
  stadium?: string;
  formedYear?: string;
  description?: string;
  website?: string;
  lastSyncAt: Date;
}

const TeamSchema = new Schema<ITeam>(
  {
    externalId: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    sport: { type: String, required: true },
    league: {
      id: String,
      name: String,
    },
    badge: String,
    jersey: String,
    country: String,
    stadium: String,
    formedYear: String,
    description: String,
    website: String,
    lastSyncAt: { type: Date, default: Date.now },
  },
  {
    timestamps: true,
    collection: "teams",
  }
);

TeamSchema.index({ externalId: 1 }, { unique: true });
TeamSchema.index({ name: "text" });
TeamSchema.index({ sport: 1 });
TeamSchema.index({ "league.id": 1 });

const Team: Model<ITeam> =
  mongoose.models.Team || mongoose.model<ITeam>("Team", TeamSchema);

export default Team;
