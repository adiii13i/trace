import mongoose, { Document, Schema } from 'mongoose';

export interface IProject extends Document {
  name: string;
  description: string;
  repoUrl: string;
  repoOwner: string; // parsed from repoUrl on creation
  repoName: string;
  createdBy: mongoose.Types.ObjectId;
  team: mongoose.Types.ObjectId[];
  tasks: mongoose.Types.ObjectId[];
  status: 'active' | 'paused' | 'completed';
  webhookSecret: string; // shown to manager once so they can configure the GitHub webhook
  createdAt: Date;
  updatedAt: Date;
}

const ProjectSchema = new Schema<IProject>(
  {
    name:        { type: String, required: true, trim: true },
    description: { type: String, default: '' },
    repoUrl:     { type: String, required: true },
    repoOwner:   { type: String, required: true },
    repoName:    { type: String, required: true },

    createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    team:      [{ type: Schema.Types.ObjectId, ref: 'User' }],
    tasks:     [{ type: Schema.Types.ObjectId, ref: 'Task' }],

    status:        { type: String, enum: ['active', 'paused', 'completed'], default: 'active' },
    webhookSecret: { type: String, required: true },
  },
  { timestamps: true }
);

// we look projects up by repo a lot (webhook handler does this on every push)
ProjectSchema.index({ repoOwner: 1, repoName: 1 });

export const Project = mongoose.model<IProject>('Project', ProjectSchema);
