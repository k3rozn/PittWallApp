import mongoose, { Schema, Document, Model } from "mongoose";

export interface IEvent extends Document {
  externalId: string;
  sport: "football" | "volleyball" | "motorsport";
  competition: {
    id: string;
    name: string;
    country?: string;
    badge?: string;
  };
  season: string;
  status: "scheduled" | "live" | "finished" | "postponed" | "cancelled";
  startTime: Date;
  venue?: string;
  city?: string;
  homeTeam?: { id: string; name: string; badge?: string };
  awayTeam?: { id: string; name: string; badge?: string };
  score?: {
    home: number | null;
    away: number | null;
    progress?: string;
  };
  // F1 specific
  raceName?: string;
  circuit?: string;
  // Metadata
  viewCount: number;
  lastSyncAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

const EventSchema = new Schema<IEvent>(
  {
    externalId: { type: String, required: true, unique: true },
    sport: {
      type: String,
      required: true,
      enum: ["football", "volleyball", "motorsport"],
    },
    competition: {
      id: { type: String, required: true },
      name: { type: String, required: true },
      country: String,
      badge: String,
    },
    season: { type: String },
    status: {
      type: String,
      enum: ["scheduled", "live", "finished", "postponed", "cancelled"],
      default: "scheduled",
    },
    startTime: { type: Date, required: true },
    venue: String,
    city: String,
    homeTeam: {
      id: String,
      name: String,
      badge: String,
    },
    awayTeam: {
      id: String,
      name: String,
      badge: String,
    },
    score: {
      home: { type: Number, default: null },
      away: { type: Number, default: null },
      progress: String,
    },
    raceName: String,
    circuit: String,
    viewCount: { type: Number, default: 0 },
    lastSyncAt: { type: Date, default: Date.now },
  },
  {
    timestamps: true,
    collection: "events",
  }
);

EventSchema.index({ sport: 1, status: 1, startTime: -1 });
EventSchema.index({ "competition.id": 1, startTime: -1 });
EventSchema.index({ "homeTeam.id": 1 });
EventSchema.index({ "awayTeam.id": 1 });
EventSchema.index({ startTime: -1 });

const Event: Model<IEvent> =
  mongoose.models.Event || mongoose.model<IEvent>("Event", EventSchema);

export default Event;
