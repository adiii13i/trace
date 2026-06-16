import mongoose, { Document, Schema } from 'mongoose';

export type TaskStatus   = 'pending' | 'in_progress' | 'in_review' | 'verified' | 'blocked';
export type TaskPriority = 'critical' | 'high' | 'medium' | 'low';

// Every time the webhook fires we try to verify the task.
// We keep the full history so managers can see what was attempted.
export interface IVerificationAttempt {
  commitSha: string;
  commitMessage: string;
  diffSnippet: string;
  llmVerdict: boolean;
  llmReasoning: string;
  attemptedAt: Date;
}

export interface ITask extends Document {
  project: mongoose.Types.ObjectId;
  assignedTo: mongoose.Types.ObjectId | null;
  title: string;
  description: string;
  acceptanceCriteria: string[];
  status: TaskStatus;
  priority: TaskPriority;
  estimatedPoints: number;
  earnedPoints: number;
  verificationHistory: IVerificationAttempt[];
  verifiedCommitSha: string | null;
  verifiedAt: Date | null;
  dueDate: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

const VerificationAttemptSchema = new Schema<IVerificationAttempt>(
  {
    commitSha:     { type: String, required: true },
    commitMessage: { type: String, default: '' },
    diffSnippet:   { type: String, default: '' },
    llmVerdict:    { type: Boolean, required: true },
    llmReasoning:  { type: String, default: '' },
    attemptedAt:   { type: Date, default: Date.now },
  },
  { _id: false } // sub-documents don't need their own _id
);

const TaskSchema = new Schema<ITask>(
  {
    project:    { type: Schema.Types.ObjectId, ref: 'Project', required: true, index: true },
    assignedTo: { type: Schema.Types.ObjectId, ref: 'User', default: null },

    title:               { type: String, required: true, trim: true },
    description:         { type: String, required: true },
    acceptanceCriteria:  [{ type: String }],

    status:   { type: String, enum: ['pending', 'in_progress', 'in_review', 'verified', 'blocked'], default: 'pending' },
    priority: { type: String, enum: ['critical', 'high', 'medium', 'low'], default: 'medium' },

    estimatedPoints: { type: Number, default: 0 },
    earnedPoints:    { type: Number, default: 0 },

    verificationHistory: [VerificationAttemptSchema],
    verifiedCommitSha:   { type: String, default: null },
    verifiedAt:          { type: Date, default: null },
    dueDate:             { type: Date, default: null },
  },
  { timestamps: true }
);

// fast lookup by developer — the developer view queries this constantly
TaskSchema.index({ assignedTo: 1, status: 1 });

export const Task = mongoose.model<ITask>('Task', TaskSchema);
