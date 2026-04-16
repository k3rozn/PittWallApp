import mongoose, { Schema, Document, Model } from "mongoose";

export type FavoriteType = "team" | "competition" | "player" | "event";

export interface IFavorite extends Document {
  userId: mongoose.Types.ObjectId;
  type: FavoriteType;
  externalId: string;
  name: string;
  badge?: string;
  sport?: string;
  createdAt: Date;
}

const FavoriteSchema = new Schema<IFavorite>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "UserProfile",
      required: true,
    },
    type: {
      type: String,
      required: true,
      enum: ["team", "competition", "player", "event"],
    },
    externalId: { type: String, required: true },
    name: { type: String, required: true },
    badge: String,
    sport: String,
  },
  {
    timestamps: true,
    collection: "favorites",
  }
);

// Prevent duplicate favorites
FavoriteSchema.index({ userId: 1, type: 1, externalId: 1 }, { unique: true });
FavoriteSchema.index({ userId: 1, type: 1 });

const Favorite: Model<IFavorite> =
  mongoose.models.Favorite || mongoose.model<IFavorite>("Favorite", FavoriteSchema);

export default Favorite;
