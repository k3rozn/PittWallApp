import mongoose, { Schema, Document, Model } from "mongoose";

export interface IMessage extends Document {
  conversationId: mongoose.Types.ObjectId;
  senderId: mongoose.Types.ObjectId;
  content: string;
  type: "text";
  readBy: { userId: mongoose.Types.ObjectId; readAt: Date }[];
  sentAt: Date;
}

const MessageSchema = new Schema<IMessage>(
  {
    conversationId: {
      type: Schema.Types.ObjectId,
      ref: "Conversation",
      required: true,
    },
    senderId: {
      type: Schema.Types.ObjectId,
      ref: "UserProfile",
      required: true,
    },
    content: { type: String, required: true, maxlength: 4096 },
    type: { type: String, default: "text", enum: ["text"] },
    readBy: [
      {
        userId: { type: Schema.Types.ObjectId, ref: "UserProfile" },
        readAt: { type: Date, default: Date.now },
      },
    ],
    sentAt: { type: Date, default: Date.now },
  },
  {
    collection: "messages",
  }
);

MessageSchema.index({ conversationId: 1, sentAt: 1 });
MessageSchema.index({ senderId: 1 });

const Message: Model<IMessage> =
  mongoose.models.Message || mongoose.model<IMessage>("Message", MessageSchema);

export default Message;
