import mongoose, { Schema, Document, Model } from "mongoose";

export interface IFriendship extends Document {
  users: [mongoose.Types.ObjectId, mongoose.Types.ObjectId];
  createdAt: Date;
}

const FriendshipSchema = new Schema<IFriendship>(
  {
    users: {
      type: [Schema.Types.ObjectId],
      ref: "UserProfile",
      required: true,
      validate: {
        validator: (v: mongoose.Types.ObjectId[]) => v.length === 2,
        message: "Friendship must have exactly 2 users",
      },
    },
  },
  {
    timestamps: true,
    collection: "friendships",
  }
);

FriendshipSchema.index({ users: 1 });

const Friendship: Model<IFriendship> =
  mongoose.models.Friendship ||
  mongoose.model<IFriendship>("Friendship", FriendshipSchema);

export default Friendship;
