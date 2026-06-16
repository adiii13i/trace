import mongoose, { Document, Schema } from 'mongoose';

export interface IUser extends Document {
  githubId?: string;
  googleId?: string;
  login: string;
  email: string;
  avatarUrl: string;
  role: 'manager' | 'developer';
  teams: mongoose.Types.ObjectId[];
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema = new Schema<IUser>(
  {
    // one of these will be set depending on how the user signed up
    githubId: { type: String, sparse: true, index: true },
    googleId: { type: String, sparse: true, index: true },

    login:     { type: String, required: true },
    email:     { type: String, required: true, lowercase: true, unique: true },
    avatarUrl: { type: String, default: '' },

    // managers create projects + assign tasks, developers do the work
    role:  { type: String, enum: ['manager', 'developer'], default: 'developer' },
    teams: [{ type: Schema.Types.ObjectId, ref: 'Team' }],
  },
  { timestamps: true }
);

export const User = mongoose.model<IUser>('User', UserSchema);
