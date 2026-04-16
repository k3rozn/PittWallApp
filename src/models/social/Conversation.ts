import mongoose, { Schema, Document, Model } from "mongoose";

export interface IConversation extends Document {
  participants: mongoose.Types.ObjectId[];
  lastMessage?: {
    content: string;
    senderId: mongoose.Types.ObjectId;
    sentAt: Date;
  };
  unreadCounts: Map<string, number>;
  createdAt: Date;
  updatedAt: Date;
}

const ConversationSchema = new Schema<IConversation>(
  {
    participants: {
      type: [Schema.Types.ObjectId],
      ref: "UserProfile",
      required: true,
    },
    lastMessage: {
      content: String,
      senderId: { type: Schema.Types.ObjectId, ref: "UserProfile" },
      sentAt: Date,
    },
    unreadCounts: {
      type: Map,
      of: Number,
      default: new Map(),
    },
  },
  {
    timestamps: true,
    collection: "conversations",
  }
);

ConversationSchema.index({ participants: 1 });
ConversationSchema.index({ updatedAt: -1 });

const Conversation: Model<IConversation> =
  mongoose.models.Conversation ||
  mongoose.model<IConversation>("Conversation", ConversationSchema);

export default Conversation;
