import mongoose, { Schema, Document, Model } from "mongoose";

export interface IFriendRequest extends Document {
  senderId: mongoose.Types.ObjectId;
  receiverId: mongoose.Types.ObjectId;
  status: "pending" | "accepted" | "declined";
  createdAt: Date;
}

const FriendRequestSchema = new Schema<IFriendRequest>(
  {
    senderId: { type: Schema.Types.ObjectId, ref: "UserProfile", required: true },
    receiverId: { type: Schema.Types.ObjectId, ref: "UserProfile", required: true },
    status: {
      type: String,
      enum: ["pending", "accepted", "declined"],
      default: "pending",
    },
  },
  {
    timestamps: true,
    collection: "friendrequests",
  }
);

// Prevent duplicate requests
FriendRequestSchema.index({ senderId: 1, receiverId: 1 }, { unique: true });
FriendRequestSchema.index({ receiverId: 1, status: 1 });
FriendRequestSchema.index({ senderId: 1, status: 1 });

const FriendRequest: Model<IFriendRequest> =
  mongoose.models.FriendRequest ||
  mongoose.model<IFriendRequest>("FriendRequest", FriendRequestSchema);

export default FriendRequest;
