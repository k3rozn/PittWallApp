import mongoose, { Schema, Document, Model } from "mongoose";

export interface IUserProfile extends Document {
  clerkId: string;
  username: string;
  displayName: string;
  avatar?: string;
  bio?: string;
  sportPreferences: string[];
  onboardingComplete: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const UserProfileSchema = new Schema<IUserProfile>(
  {
    clerkId: { type: String, required: true, unique: true },
    username: { type: String, required: true, unique: true, lowercase: true, trim: true },
    displayName: { type: String, required: true },
    avatar: String,
    bio: { type: String, maxlength: 280 },
    sportPreferences: { type: [String], default: ["football"] },
    onboardingComplete: { type: Boolean, default: false },
  },
  {
    timestamps: true,
    collection: "userprofiles",
  }
);

UserProfileSchema.index({ clerkId: 1 }, { unique: true });
UserProfileSchema.index({ username: 1 }, { unique: true });

const UserProfile: Model<IUserProfile> =
  mongoose.models.UserProfile ||
  mongoose.model<IUserProfile>("UserProfile", UserProfileSchema);

export default UserProfile;
