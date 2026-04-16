import mongoose, { Schema, Document, Model } from "mongoose";

export type NotificationType =
  | "friend_request"
  | "friend_accepted"
  | "new_message"
  | "event_start"
  | "event_incident"
  | "fantasy_update"
  | "fantasy_round_start"
  | "fantasy_points";

export interface INotification extends Document {
  userId: mongoose.Types.ObjectId;
  type: NotificationType;
  title: string;
  body: string;
  data?: Record<string, unknown>;
  read: boolean;
  createdAt: Date;
}

const NotificationSchema = new Schema<INotification>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "UserProfile",
      required: true,
    },
    type: {
      type: String,
      required: true,
      enum: [
        "friend_request",
        "friend_accepted",
        "new_message",
        "event_start",
        "event_incident",
        "fantasy_update",
        "fantasy_round_start",
        "fantasy_points",
      ],
    },
    title: { type: String, required: true },
    body: { type: String, required: true },
    data: { type: Schema.Types.Mixed },
    read: { type: Boolean, default: false },
  },
  {
    timestamps: true,
    collection: "notifications",
  }
);

NotificationSchema.index({ userId: 1, read: 1, createdAt: -1 });
NotificationSchema.index({ createdAt: -1 });

const Notification: Model<INotification> =
  mongoose.models.Notification ||
  mongoose.model<INotification>("Notification", NotificationSchema);

export default Notification;
