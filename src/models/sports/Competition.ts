import mongoose, { Schema, Document, Model } from "mongoose";

export interface ICompetition extends Document {
  externalId: string;
  name: string;
  sport: string;
  country?: string;
  badge?: string;
  currentSeason?: string;
  description?: string;
  website?: string;
  formedYear?: string;
  lastSyncAt: Date;
}

const CompetitionSchema = new Schema<ICompetition>(
  {
    externalId: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    sport: { type: String, required: true },
    country: String,
    badge: String,
    currentSeason: String,
    description: String,
    website: String,
    formedYear: String,
    lastSyncAt: { type: Date, default: Date.now },
  },
  {
    timestamps: true,
    collection: "competitions",
  }
);

CompetitionSchema.index({ externalId: 1 }, { unique: true });
CompetitionSchema.index({ sport: 1 });
CompetitionSchema.index({ name: "text" });

const Competition: Model<ICompetition> =
  mongoose.models.Competition ||
  mongoose.model<ICompetition>("Competition", CompetitionSchema);

export default Competition;
