import mongoose, { Schema, Document, Model } from "mongoose";

// --- Base Interface ---
export interface BaseEntity {
  organizationId: mongoose.Types.ObjectId | string;
  isDeleted: boolean;
  createdBy?: mongoose.Types.ObjectId | string;
  createdAt: Date;
  updatedAt: Date;
}

// 1. Organization
export interface IOrganization extends Document {
  name: string;
  slug: string;
  logo?: string;
  timezone: string;
  currency: string;
  fiscalYearStart: string;
  billingPlan: "free" | "starter" | "professional" | "enterprise";
  isDeleted: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const OrganizationSchema = new Schema<IOrganization>(
  {
    name: { type: String, required: true },
    slug: { type: String, required: true, unique: true, index: true },
    logo: { type: String },
    timezone: { type: String, default: "Asia/Kolkata" },
    currency: { type: String, default: "INR" },
    fiscalYearStart: { type: String, default: "January" },
    billingPlan: {
      type: String,
      enum: ["free", "starter", "professional", "enterprise"],
      default: "professional",
    },
    isDeleted: { type: Boolean, default: false, index: true },
  },
  { timestamps: true }
);

// 2. User
export interface IUser extends Document {
  email: string;
  passwordHash: string;
  name: string;
  avatar?: string;
  timezone: string;
  role: "Super Admin" | "Admin" | "Manager" | "Sales Rep" | "Viewer";
  organizationId: mongoose.Types.ObjectId;
  status: "active" | "invited" | "deactivated";
  notificationPreferences: {
    email: boolean;
    inApp: boolean;
    taskReminders: boolean;
  };
  googleId?: string;
  authProvider?: "local" | "google";
  isDeleted: boolean;
  createdBy?: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema = new Schema<IUser>(
  {
    email: { type: String, required: true, index: true },
    passwordHash: { type: String, required: true },
    name: { type: String, required: true },
    avatar: { type: String },
    googleId: { type: String, sparse: true, index: true },
    authProvider: { type: String, enum: ["local", "google"], default: "local" },
    timezone: { type: String, default: "Asia/Kolkata" },
    role: {
      type: String,
      enum: ["Super Admin", "Admin", "Manager", "Sales Rep", "Viewer"],
      default: "Sales Rep",
    },
    organizationId: { type: Schema.Types.ObjectId, ref: "Organization", required: true, index: true },
    status: { type: String, enum: ["active", "invited", "deactivated"], default: "active" },
    notificationPreferences: {
      email: { type: Boolean, default: true },
      inApp: { type: Boolean, default: true },
      taskReminders: { type: Boolean, default: true },
    },
    isDeleted: { type: Boolean, default: false, index: true },
    createdBy: { type: Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true }
);

// 3. Role
export interface IRole extends Document, BaseEntity {
  name: string;
  description?: string;
  permissions: string[];
}

const RoleSchema = new Schema<IRole>(
  {
    organizationId: { type: Schema.Types.ObjectId, ref: "Organization", required: true, index: true },
    name: { type: String, required: true },
    description: { type: String },
    permissions: [{ type: String }],
    isDeleted: { type: Boolean, default: false, index: true },
    createdBy: { type: Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true }
);

// 4. Contact
export interface IContact extends Document, BaseEntity {
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  title?: string;
  companyId?: mongoose.Types.ObjectId;
  tags: string[];
  avatar?: string;
  socialLinks?: {
    linkedin?: string;
    twitter?: string;
    github?: string;
  };
  customFields?: Record<string, unknown>;
  leadSource?: string;
  lifecycleStage?: "Lead" | "Opportunity" | "Customer" | "Evangelist";
}

const ContactSchema = new Schema<IContact>(
  {
    organizationId: { type: Schema.Types.ObjectId, ref: "Organization", required: true, index: true },
    firstName: { type: String, required: true, index: true },
    lastName: { type: String, required: true, index: true },
    email: { type: String, required: true, index: true },
    phone: { type: String },
    title: { type: String },
    companyId: { type: Schema.Types.ObjectId, ref: "Company", index: true },
    tags: [{ type: String }],
    avatar: { type: String },
    socialLinks: {
      linkedin: { type: String },
      twitter: { type: String },
      github: { type: String },
    },
    customFields: { type: Schema.Types.Mixed, default: {} },
    leadSource: { type: String, default: "Inbound" },
    lifecycleStage: {
      type: String,
      enum: ["Lead", "Opportunity", "Customer", "Evangelist"],
      default: "Lead",
    },
    isDeleted: { type: Boolean, default: false, index: true },
    createdBy: { type: Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true }
);

// 5. Company
export interface ICompany extends Document, BaseEntity {
  name: string;
  domain?: string;
  industry?: string;
  size?: string;
  phone?: string;
  address?: {
    street?: string;
    city?: string;
    state?: string;
    country?: string;
    postalCode?: string;
  };
  parentCompanyId?: mongoose.Types.ObjectId;
  customFields?: Record<string, unknown>;
}

const CompanySchema = new Schema<ICompany>(
  {
    organizationId: { type: Schema.Types.ObjectId, ref: "Organization", required: true, index: true },
    name: { type: String, required: true, index: true },
    domain: { type: String },
    industry: { type: String },
    size: { type: String },
    phone: { type: String },
    address: {
      street: { type: String },
      city: { type: String },
      state: { type: String },
      country: { type: String },
      postalCode: { type: String },
    },
    parentCompanyId: { type: Schema.Types.ObjectId, ref: "Company" },
    customFields: { type: Schema.Types.Mixed, default: {} },
    isDeleted: { type: Boolean, default: false, index: true },
    createdBy: { type: Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true }
);

// 6. Lead
export interface ILead extends Document, BaseEntity {
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  company?: string;
  title?: string;
  score: number;
  status: "New" | "Contacted" | "Qualified" | "Disqualified" | "Converted";
  source: string;
  assignedTo?: mongoose.Types.ObjectId;
  convertedContactId?: mongoose.Types.ObjectId;
  convertedDealId?: mongoose.Types.ObjectId;
  customFields?: Record<string, unknown>;
}

const LeadSchema = new Schema<ILead>(
  {
    organizationId: { type: Schema.Types.ObjectId, ref: "Organization", required: true, index: true },
    firstName: { type: String, required: true },
    lastName: { type: String, required: true },
    email: { type: String, required: true, index: true },
    phone: { type: String },
    company: { type: String },
    title: { type: String },
    score: { type: Number, default: 0 },
    status: {
      type: String,
      enum: ["New", "Contacted", "Qualified", "Disqualified", "Converted"],
      default: "New",
      index: true,
    },
    source: { type: String, default: "Web Form" },
    assignedTo: { type: Schema.Types.ObjectId, ref: "User" },
    convertedContactId: { type: Schema.Types.ObjectId, ref: "Contact" },
    convertedDealId: { type: Schema.Types.ObjectId, ref: "Deal" },
    customFields: { type: Schema.Types.Mixed, default: {} },
    isDeleted: { type: Boolean, default: false, index: true },
    createdBy: { type: Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true }
);

// 7. Pipeline
export interface IPipeline extends Document, BaseEntity {
  name: string;
  isDefault: boolean;
}

const PipelineSchema = new Schema<IPipeline>(
  {
    organizationId: { type: Schema.Types.ObjectId, ref: "Organization", required: true, index: true },
    name: { type: String, required: true },
    isDefault: { type: Boolean, default: false },
    isDeleted: { type: Boolean, default: false, index: true },
    createdBy: { type: Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true }
);

// 8. PipelineStage
export interface IPipelineStage extends Document, BaseEntity {
  pipelineId: mongoose.Types.ObjectId;
  name: string;
  order: number;
  probability: number;
  color: string;
  isWon: boolean;
  isLost: boolean;
}

const PipelineStageSchema = new Schema<IPipelineStage>(
  {
    organizationId: { type: Schema.Types.ObjectId, ref: "Organization", required: true, index: true },
    pipelineId: { type: Schema.Types.ObjectId, ref: "Pipeline", required: true, index: true },
    name: { type: String, required: true },
    order: { type: Number, required: true },
    probability: { type: Number, default: 20 },
    color: { type: String, default: "#64748b" },
    isWon: { type: Boolean, default: false },
    isLost: { type: Boolean, default: false },
    isDeleted: { type: Boolean, default: false, index: true },
    createdBy: { type: Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true }
);

// 9. Deal
export interface IDeal extends Document, BaseEntity {
  title: string;
  value: number;
  currency: string;
  pipelineId: mongoose.Types.ObjectId;
  stageId: mongoose.Types.ObjectId;
  companyId?: mongoose.Types.ObjectId;
  contactId?: mongoose.Types.ObjectId;
  assignedTo?: mongoose.Types.ObjectId;
  probability: number;
  expectedCloseDate?: Date;
  winLossReason?: string;
  products?: Array<{
    name: string;
    quantity: number;
    unitPrice: number;
  }>;
  customFields?: Record<string, unknown>;
}

const DealSchema = new Schema<IDeal>(
  {
    organizationId: { type: Schema.Types.ObjectId, ref: "Organization", required: true, index: true },
    title: { type: String, required: true, index: true },
    value: { type: Number, required: true, default: 0 },
    currency: { type: String, default: "USD" },
    pipelineId: { type: Schema.Types.ObjectId, ref: "Pipeline", required: true, index: true },
    stageId: { type: Schema.Types.ObjectId, ref: "PipelineStage", required: true, index: true },
    companyId: { type: Schema.Types.ObjectId, ref: "Company" },
    contactId: { type: Schema.Types.ObjectId, ref: "Contact" },
    assignedTo: { type: Schema.Types.ObjectId, ref: "User" },
    probability: { type: Number, default: 20 },
    expectedCloseDate: { type: Date },
    winLossReason: { type: String },
    products: [
      {
        name: { type: String, required: true },
        quantity: { type: Number, default: 1 },
        unitPrice: { type: Number, default: 0 },
      },
    ],
    customFields: { type: Schema.Types.Mixed, default: {} },
    isDeleted: { type: Boolean, default: false, index: true },
    createdBy: { type: Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true }
);

// 10. Project
export interface IProjectMilestone {
  _id?: mongoose.Types.ObjectId | string;
  title: string;
  dueDate?: Date;
  completed: boolean;
  completedAt?: Date;
}

export interface IProject extends Document, BaseEntity {
  name: string;
  key: string;
  description?: string;
  ownerId?: mongoose.Types.ObjectId;
  members: mongoose.Types.ObjectId[];
  status: "Planning" | "Active" | "On Hold" | "Completed" | "Archived";
  priority: "Low" | "Medium" | "High" | "Urgent";
  startDate?: Date;
  dueDate?: Date;
  progress: number;
  milestones: IProjectMilestone[];
  color?: string;
  tags?: string[];
}

const ProjectSchema = new Schema<IProject>(
  {
    organizationId: { type: Schema.Types.ObjectId, ref: "Organization", required: true, index: true },
    name: { type: String, required: true, index: true },
    key: { type: String, required: true, uppercase: true },
    description: { type: String },
    ownerId: { type: Schema.Types.ObjectId, ref: "User", index: true },
    members: [{ type: Schema.Types.ObjectId, ref: "User" }],
    status: {
      type: String,
      enum: ["Planning", "Active", "On Hold", "Completed", "Archived"],
      default: "Active",
      index: true,
    },
    priority: {
      type: String,
      enum: ["Low", "Medium", "High", "Urgent"],
      default: "Medium",
    },
    startDate: { type: Date },
    dueDate: { type: Date },
    progress: { type: Number, default: 0 },
    milestones: [
      {
        title: { type: String, required: true },
        dueDate: { type: Date },
        completed: { type: Boolean, default: false },
        completedAt: { type: Date },
      },
    ],
    color: { type: String, default: "#3b82f6" },
    tags: [{ type: String }],
    isDeleted: { type: Boolean, default: false, index: true },
    createdBy: { type: Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true }
);

// 10b. Team
export interface ITeam extends Document, BaseEntity {
  name: string;
  description?: string;
  leaderId?: mongoose.Types.ObjectId;
  members: mongoose.Types.ObjectId[];
  color?: string;
}

const TeamSchema = new Schema<ITeam>(
  {
    organizationId: { type: Schema.Types.ObjectId, ref: "Organization", required: true, index: true },
    name: { type: String, required: true, index: true },
    description: { type: String },
    leaderId: { type: Schema.Types.ObjectId, ref: "User" },
    members: [{ type: Schema.Types.ObjectId, ref: "User" }],
    color: { type: String, default: "#6366f1" },
    isDeleted: { type: Boolean, default: false, index: true },
    createdBy: { type: Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true }
);

// 10c. Sprint
export interface ISprint extends Document, BaseEntity {
  projectId: mongoose.Types.ObjectId;
  name: string;
  goal?: string;
  startDate?: Date;
  endDate?: Date;
  status: "planning" | "active" | "completed";
  velocity: number;
}

const SprintSchema = new Schema<ISprint>(
  {
    organizationId: { type: Schema.Types.ObjectId, ref: "Organization", required: true, index: true },
    projectId: { type: Schema.Types.ObjectId, ref: "Project", required: true, index: true },
    name: { type: String, required: true },
    goal: { type: String },
    startDate: { type: Date },
    endDate: { type: Date },
    status: {
      type: String,
      enum: ["planning", "active", "completed"],
      default: "planning",
      index: true,
    },
    velocity: { type: Number, default: 0 },
    isDeleted: { type: Boolean, default: false, index: true },
    createdBy: { type: Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true }
);

// 10d. ProjectDoc (Wiki / Knowledge Base)
export interface IProjectDoc extends Document, BaseEntity {
  projectId: mongoose.Types.ObjectId;
  title: string;
  content: string;
  category: "PRD" | "Architecture" | "Meeting Notes" | "General";
  tags: string[];
  updatedBy?: mongoose.Types.ObjectId;
}

const ProjectDocSchema = new Schema<IProjectDoc>(
  {
    organizationId: { type: Schema.Types.ObjectId, ref: "Organization", required: true, index: true },
    projectId: { type: Schema.Types.ObjectId, ref: "Project", required: true, index: true },
    title: { type: String, required: true },
    content: { type: String, default: "" },
    category: {
      type: String,
      enum: ["PRD", "Architecture", "Meeting Notes", "General"],
      default: "General",
      index: true,
    },
    tags: [{ type: String }],
    updatedBy: { type: Schema.Types.ObjectId, ref: "User" },
    isDeleted: { type: Boolean, default: false, index: true },
    createdBy: { type: Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true }
);

// 10e. Comment
export interface IComment extends Document, BaseEntity {
  taskId: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  body: string;
  attachments?: string[];
}

const CommentSchema = new Schema<IComment>(
  {
    organizationId: { type: Schema.Types.ObjectId, ref: "Organization", required: true, index: true },
    taskId: { type: Schema.Types.ObjectId, ref: "Task", required: true, index: true },
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    body: { type: String, required: true },
    attachments: [{ type: String }],
    isDeleted: { type: Boolean, default: false, index: true },
    createdBy: { type: Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true }
);

// 10d. Task
export interface ITaskSubtask {
  _id?: mongoose.Types.ObjectId | string;
  title: string;
  completed: boolean;
  assignedTo?: mongoose.Types.ObjectId;
  dueDate?: Date;
}

export interface ITaskChecklistItem {
  _id?: mongoose.Types.ObjectId | string;
  title: string;
  completed: boolean;
}

export interface ITaskDependency {
  taskId: mongoose.Types.ObjectId;
  type: "blocked_by" | "blocks";
}

export interface ITaskAttachment {
  name: string;
  url: string;
  size?: number;
  mimeType?: string;
  createdAt?: Date;
}

export interface ITaskTimeLog {
  _id?: mongoose.Types.ObjectId | string;
  userId?: mongoose.Types.ObjectId;
  hours: number;
  description?: string;
  loggedAt: Date;
}

export interface ITask extends Document, BaseEntity {
  title: string;
  description?: string;
  projectId?: mongoose.Types.ObjectId;
  teamId?: mongoose.Types.ObjectId;
  startDate?: Date;
  dueDate?: Date;
  priority: "No Priority" | "Low" | "Medium" | "High" | "Urgent";
  status: "Backlog" | "Todo" | "In Progress" | "In Review" | "Done" | "Cancelled" | "Completed";
  issueType: "task" | "bug" | "feature" | "story" | "epic";
  storyPoints: number;
  sprintId?: mongoose.Types.ObjectId;
  timeLogs: ITaskTimeLog[];
  assignedTo?: mongoose.Types.ObjectId;
  reporterId?: mongoose.Types.ObjectId;
  labels: string[];
  estimatedHours: number;
  actualHours: number;
  parentTaskId?: mongoose.Types.ObjectId;
  subtasks: ITaskSubtask[];
  checklist: ITaskChecklistItem[];
  dependencies: ITaskDependency[];
  attachments: ITaskAttachment[];
  isPersonal: boolean;
  recurring: {
    isRecurring: boolean;
    frequency: "daily" | "weekly" | "monthly" | "none";
  };
  order: number;
  entityType?: "contact" | "deal" | "company" | "lead" | "ticket" | "project" | "team";
  entityId?: mongoose.Types.ObjectId;
}

const TaskSchema = new Schema<ITask>(
  {
    organizationId: { type: Schema.Types.ObjectId, ref: "Organization", required: true, index: true },
    title: { type: String, required: true, index: true },
    description: { type: String },
    projectId: { type: Schema.Types.ObjectId, ref: "Project", index: true },
    teamId: { type: Schema.Types.ObjectId, ref: "Team", index: true },
    startDate: { type: Date },
    dueDate: { type: Date, index: true },
    priority: {
      type: String,
      enum: ["No Priority", "Low", "Medium", "High", "Urgent"],
      default: "Medium",
      index: true,
    },
    status: {
      type: String,
      enum: ["Backlog", "Todo", "In Progress", "In Review", "Done", "Cancelled", "Completed"],
      default: "Todo",
      index: true,
    },
    issueType: {
      type: String,
      enum: ["task", "bug", "feature", "story", "epic"],
      default: "task",
      index: true,
    },
    storyPoints: { type: Number, default: 0 },
    sprintId: { type: Schema.Types.ObjectId, ref: "Sprint", index: true },
    timeLogs: [
      {
        userId: { type: Schema.Types.ObjectId, ref: "User" },
        hours: { type: Number, required: true },
        description: { type: String },
        loggedAt: { type: Date, default: Date.now },
      },
    ],
    assignedTo: { type: Schema.Types.ObjectId, ref: "User", index: true },
    reporterId: { type: Schema.Types.ObjectId, ref: "User" },
    labels: [{ type: String, index: true }],
    estimatedHours: { type: Number, default: 0 },
    actualHours: { type: Number, default: 0 },
    parentTaskId: { type: Schema.Types.ObjectId, ref: "Task" },
    subtasks: [
      {
        title: { type: String, required: true },
        completed: { type: Boolean, default: false },
        assignedTo: { type: Schema.Types.ObjectId, ref: "User" },
        dueDate: { type: Date },
      },
    ],
    checklist: [
      {
        title: { type: String, required: true },
        completed: { type: Boolean, default: false },
      },
    ],
    dependencies: [
      {
        taskId: { type: Schema.Types.ObjectId, ref: "Task" },
        type: { type: String, enum: ["blocked_by", "blocks"], default: "blocked_by" },
      },
    ],
    attachments: [
      {
        name: { type: String, required: true },
        url: { type: String, required: true },
        size: { type: Number, default: 0 },
        mimeType: { type: String, default: "application/octet-stream" },
        createdAt: { type: Date, default: Date.now },
      },
    ],
    isPersonal: { type: Boolean, default: false, index: true },
    recurring: {
      isRecurring: { type: Boolean, default: false },
      frequency: {
        type: String,
        enum: ["daily", "weekly", "monthly", "none"],
        default: "none",
      },
    },
    order: { type: Number, default: 0 },
    entityType: { type: String },
    entityId: { type: Schema.Types.ObjectId },
    isDeleted: { type: Boolean, default: false, index: true },
    createdBy: { type: Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true }
);

// 11. Activity
export interface IActivity extends Document, BaseEntity {
  type:
    | "call"
    | "email"
    | "meeting"
    | "note"
    | "stage_change"
    | "status_change"
    | "created"
    | "assigned"
    | "priority_change"
    | "due_date_change"
    | "comment"
    | "completed";
  title: string;
  details?: string;
  entityType: "contact" | "deal" | "company" | "lead" | "ticket" | "campaign" | "task" | "project" | "team";
  entityId: mongoose.Types.ObjectId;
  metadata?: Record<string, unknown>;
}

const ActivitySchema = new Schema<IActivity>(
  {
    organizationId: { type: Schema.Types.ObjectId, ref: "Organization", required: true, index: true },
    type: {
      type: String,
      required: true,
    },
    title: { type: String, required: true },
    details: { type: String },
    entityType: {
      type: String,
      required: true,
      index: true,
    },
    entityId: { type: Schema.Types.ObjectId, required: true, index: true },
    metadata: { type: Schema.Types.Mixed, default: {} },
    isDeleted: { type: Boolean, default: false, index: true },
    createdBy: { type: Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true }
);

// 12. EmailTemplate
export interface IEmailTemplate extends Document, BaseEntity {
  name: string;
  subject: string;
  bodyHtml: string;
  variables: string[];
  category?: string;
}

const EmailTemplateSchema = new Schema<IEmailTemplate>(
  {
    organizationId: { type: Schema.Types.ObjectId, ref: "Organization", required: true, index: true },
    name: { type: String, required: true },
    subject: { type: String, required: true },
    bodyHtml: { type: String, required: true },
    variables: [{ type: String }],
    category: { type: String, default: "General" },
    isDeleted: { type: Boolean, default: false, index: true },
    createdBy: { type: Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true }
);

// 13. Campaign
export interface ICampaign extends Document, BaseEntity {
  name: string;
  type: "email" | "webinar" | "product_launch" | "newsletter";
  status: "Draft" | "Scheduled" | "Sending" | "Completed" | "Cancelled";
  segmentFilter?: Record<string, unknown>;
  templateId?: mongoose.Types.ObjectId;
  metrics: {
    sent: number;
    opened: number;
    clicked: number;
    bounced: number;
  };
  scheduledAt?: Date;
}

const CampaignSchema = new Schema<ICampaign>(
  {
    organizationId: { type: Schema.Types.ObjectId, ref: "Organization", required: true, index: true },
    name: { type: String, required: true },
    type: {
      type: String,
      enum: ["email", "webinar", "product_launch", "newsletter"],
      default: "email",
    },
    status: {
      type: String,
      enum: ["Draft", "Scheduled", "Sending", "Completed", "Cancelled"],
      default: "Draft",
    },
    segmentFilter: { type: Schema.Types.Mixed, default: {} },
    templateId: { type: Schema.Types.ObjectId, ref: "EmailTemplate" },
    metrics: {
      sent: { type: Number, default: 0 },
      opened: { type: Number, default: 0 },
      clicked: { type: Number, default: 0 },
      bounced: { type: Number, default: 0 },
    },
    scheduledAt: { type: Date },
    isDeleted: { type: Boolean, default: false, index: true },
    createdBy: { type: Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true }
);

// 14. Ticket
export interface ITicket extends Document, BaseEntity {
  ticketNumber: string;
  subject: string;
  description: string;
  status: "Open" | "In Progress" | "Waiting" | "Resolved" | "Closed";
  priority: "Low" | "Medium" | "High" | "Urgent";
  contactId?: mongoose.Types.ObjectId;
  companyId?: mongoose.Types.ObjectId;
  assignedTo?: mongoose.Types.ObjectId;
  slaDueDate?: Date;
}

const TicketSchema = new Schema<ITicket>(
  {
    organizationId: { type: Schema.Types.ObjectId, ref: "Organization", required: true, index: true },
    ticketNumber: { type: String, required: true, index: true },
    subject: { type: String, required: true },
    description: { type: String, required: true },
    status: {
      type: String,
      enum: ["Open", "In Progress", "Waiting", "Resolved", "Closed"],
      default: "Open",
      index: true,
    },
    priority: {
      type: String,
      enum: ["Low", "Medium", "High", "Urgent"],
      default: "Medium",
    },
    contactId: { type: Schema.Types.ObjectId, ref: "Contact" },
    companyId: { type: Schema.Types.ObjectId, ref: "Company" },
    assignedTo: { type: Schema.Types.ObjectId, ref: "User" },
    slaDueDate: { type: Date },
    isDeleted: { type: Boolean, default: false, index: true },
    createdBy: { type: Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true }
);

// 15. TicketComment
export interface ITicketComment extends Document, BaseEntity {
  ticketId: mongoose.Types.ObjectId;
  body: string;
  isInternal: boolean;
  authorName?: string;
  authorEmail?: string;
  attachments?: string[];
}

const TicketCommentSchema = new Schema<ITicketComment>(
  {
    organizationId: { type: Schema.Types.ObjectId, ref: "Organization", required: true, index: true },
    ticketId: { type: Schema.Types.ObjectId, ref: "Ticket", required: true, index: true },
    body: { type: String, required: true },
    isInternal: { type: Boolean, default: false },
    authorName: { type: String },
    authorEmail: { type: String },
    attachments: [{ type: String }],
    isDeleted: { type: Boolean, default: false, index: true },
    createdBy: { type: Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true }
);

// 16. Note
export interface INote extends Document, BaseEntity {
  entityType: "contact" | "deal" | "company" | "lead" | "ticket";
  entityId: mongoose.Types.ObjectId;
  content: string;
}

const NoteSchema = new Schema<INote>(
  {
    organizationId: { type: Schema.Types.ObjectId, ref: "Organization", required: true, index: true },
    entityType: { type: String, enum: ["contact", "deal", "company", "lead", "ticket"], required: true, index: true },
    entityId: { type: Schema.Types.ObjectId, required: true, index: true },
    content: { type: String, required: true },
    isDeleted: { type: Boolean, default: false, index: true },
    createdBy: { type: Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true }
);

// 17. Tag
export interface ITag extends Document, BaseEntity {
  name: string;
  color: string;
  entityType?: string;
}

const TagSchema = new Schema<ITag>(
  {
    organizationId: { type: Schema.Types.ObjectId, ref: "Organization", required: true, index: true },
    name: { type: String, required: true },
    color: { type: String, default: "#3b82f6" },
    entityType: { type: String },
    isDeleted: { type: Boolean, default: false, index: true },
    createdBy: { type: Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true }
);

// 18. CustomFieldDefinition
export interface ICustomFieldDefinition extends Document, BaseEntity {
  entityType: "contact" | "deal" | "company" | "lead" | "ticket";
  name: string;
  key: string;
  fieldType: "text" | "number" | "date" | "dropdown" | "checkbox";
  options?: string[];
  isRequired: boolean;
}

const CustomFieldDefinitionSchema = new Schema<ICustomFieldDefinition>(
  {
    organizationId: { type: Schema.Types.ObjectId, ref: "Organization", required: true, index: true },
    entityType: {
      type: String,
      enum: ["contact", "deal", "company", "lead", "ticket"],
      required: true,
      index: true,
    },
    name: { type: String, required: true },
    key: { type: String, required: true },
    fieldType: {
      type: String,
      enum: ["text", "number", "date", "dropdown", "checkbox"],
      required: true,
    },
    options: [{ type: String }],
    isRequired: { type: Boolean, default: false },
    isDeleted: { type: Boolean, default: false, index: true },
    createdBy: { type: Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true }
);

// 19. Attachment
export interface IAttachment extends Document, BaseEntity {
  name: string;
  url: string;
  size: number;
  mimeType: string;
  entityType: "contact" | "deal" | "company" | "lead" | "ticket";
  entityId: mongoose.Types.ObjectId;
}

const AttachmentSchema = new Schema<IAttachment>(
  {
    organizationId: { type: Schema.Types.ObjectId, ref: "Organization", required: true, index: true },
    name: { type: String, required: true },
    url: { type: String, required: true },
    size: { type: Number, required: true },
    mimeType: { type: String, required: true },
    entityType: { type: String, enum: ["contact", "deal", "company", "lead", "ticket"], required: true, index: true },
    entityId: { type: Schema.Types.ObjectId, required: true, index: true },
    isDeleted: { type: Boolean, default: false, index: true },
    createdBy: { type: Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true }
);

// 20. AuditLog
export interface IAuditLog extends Document, BaseEntity {
  userId?: mongoose.Types.ObjectId;
  userName?: string;
  action: string;
  entityType: string;
  entityId?: mongoose.Types.ObjectId;
  changes?: Record<string, unknown>;
  ipAddress?: string;
  userAgent?: string;
}

const AuditLogSchema = new Schema<IAuditLog>(
  {
    organizationId: { type: Schema.Types.ObjectId, ref: "Organization", required: true, index: true },
    userId: { type: Schema.Types.ObjectId, ref: "User" },
    userName: { type: String },
    action: { type: String, required: true },
    entityType: { type: String, required: true },
    entityId: { type: Schema.Types.ObjectId },
    changes: { type: Schema.Types.Mixed },
    ipAddress: { type: String },
    userAgent: { type: String },
    isDeleted: { type: Boolean, default: false, index: true },
    createdBy: { type: Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true }
);

// 21. Notification
export interface INotification extends Document, BaseEntity {
  userId: mongoose.Types.ObjectId;
  title: string;
  message: string;
  type: "info" | "warning" | "success" | "deal" | "task" | "ticket" | "lead" | "contact";
  isRead: boolean;
  link?: string;
}

const NotificationSchema = new Schema<INotification>(
  {
    organizationId: { type: Schema.Types.ObjectId, ref: "Organization", required: true, index: true },
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    title: { type: String, required: true },
    message: { type: String, required: true },
    type: {
      type: String,
      enum: ["info", "warning", "success", "deal", "task", "ticket", "lead", "contact"],
      default: "info",
    },
    isRead: { type: Boolean, default: false, index: true },
    link: { type: String },
    isDeleted: { type: Boolean, default: false, index: true },
    createdBy: { type: Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true }
);

// 22. Workflow
export interface IWorkflow extends Document, BaseEntity {
  name: string;
  description?: string;
  isActive: boolean;
  trigger: {
    event: "lead.created" | "deal.stage_changed" | "deal.won" | "ticket.created";
    conditions?: Array<{
      field: string;
      operator: "equals" | "greater_than" | "contains";
      value: string;
    }>;
    config?: Record<string, any>;
  };
  conditions?: Array<{
    field: string;
    operator: "equals" | "greater_than" | "contains";
    value: string;
  }>;
  actions: Array<{
    type: "create_task" | "send_email" | "assign_owner" | "update_status";
    config: Record<string, unknown>;
  }>;
}

const WorkflowSchema = new Schema<IWorkflow>(
  {
    organizationId: { type: Schema.Types.ObjectId, ref: "Organization", required: true, index: true },
    name: { type: String, required: true },
    description: { type: String },
    isActive: { type: Boolean, default: true },
    trigger: {
      event: {
        type: String,
        enum: ["lead.created", "deal.stage_changed", "deal.won", "ticket.created"],
        required: true,
      },
      conditions: [
        {
          field: { type: String },
          operator: { type: String, enum: ["equals", "greater_than", "contains"] },
          value: { type: String },
        },
      ],
      config: { type: Schema.Types.Mixed },
    },
    conditions: [
      {
        field: { type: String },
        operator: { type: String, enum: ["equals", "greater_than", "contains"] },
        value: { type: String },
      },
    ],
    actions: [
      {
        type: {
          type: String,
          enum: ["create_task", "send_email", "assign_owner", "update_status"],
          required: true,
        },
        config: { type: Schema.Types.Mixed, default: {} },
      },
    ],
    isDeleted: { type: Boolean, default: false, index: true },
    createdBy: { type: Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true }
);

// --- Models Export with Singleton Guards ---
export const Organization: Model<IOrganization> =
  mongoose.models.Organization || mongoose.model<IOrganization>("Organization", OrganizationSchema);

export const User: Model<IUser> =
  mongoose.models.User || mongoose.model<IUser>("User", UserSchema);

export const Role: Model<IRole> =
  mongoose.models.Role || mongoose.model<IRole>("Role", RoleSchema);

export const Contact: Model<IContact> =
  mongoose.models.Contact || mongoose.model<IContact>("Contact", ContactSchema);

export const Company: Model<ICompany> =
  mongoose.models.Company || mongoose.model<ICompany>("Company", CompanySchema);

export const Lead: Model<ILead> =
  mongoose.models.Lead || mongoose.model<ILead>("Lead", LeadSchema);

export const Pipeline: Model<IPipeline> =
  mongoose.models.Pipeline || mongoose.model<IPipeline>("Pipeline", PipelineSchema);

export const PipelineStage: Model<IPipelineStage> =
  mongoose.models.PipelineStage || mongoose.model<IPipelineStage>("PipelineStage", PipelineStageSchema);

export const Deal: Model<IDeal> =
  mongoose.models.Deal || mongoose.model<IDeal>("Deal", DealSchema);

export const Task: Model<ITask> =
  mongoose.models.Task || mongoose.model<ITask>("Task", TaskSchema);

export const Activity: Model<IActivity> =
  mongoose.models.Activity || mongoose.model<IActivity>("Activity", ActivitySchema);

export const EmailTemplate: Model<IEmailTemplate> =
  mongoose.models.EmailTemplate || mongoose.model<IEmailTemplate>("EmailTemplate", EmailTemplateSchema);

export const Campaign: Model<ICampaign> =
  mongoose.models.Campaign || mongoose.model<ICampaign>("Campaign", CampaignSchema);

export const Ticket: Model<ITicket> =
  mongoose.models.Ticket || mongoose.model<ITicket>("Ticket", TicketSchema);

export const TicketComment: Model<ITicketComment> =
  mongoose.models.TicketComment || mongoose.model<ITicketComment>("TicketComment", TicketCommentSchema);

export const Note: Model<INote> =
  mongoose.models.Note || mongoose.model<INote>("Note", NoteSchema);

export const Tag: Model<ITag> =
  mongoose.models.Tag || mongoose.model<ITag>("Tag", TagSchema);

export const CustomFieldDefinition: Model<ICustomFieldDefinition> =
  mongoose.models.CustomFieldDefinition ||
  mongoose.model<ICustomFieldDefinition>("CustomFieldDefinition", CustomFieldDefinitionSchema);

export const Attachment: Model<IAttachment> =
  mongoose.models.Attachment || mongoose.model<IAttachment>("Attachment", AttachmentSchema);

export const AuditLog: Model<IAuditLog> =
  mongoose.models.AuditLog || mongoose.model<IAuditLog>("AuditLog", AuditLogSchema);

export const Notification: Model<INotification> =
  mongoose.models.Notification || mongoose.model<INotification>("Notification", NotificationSchema);

export const Workflow: Model<IWorkflow> =
  mongoose.models.Workflow || mongoose.model<IWorkflow>("Workflow", WorkflowSchema);

export const Project: Model<IProject> =
  mongoose.models.Project || mongoose.model<IProject>("Project", ProjectSchema);

export const Team: Model<ITeam> =
  mongoose.models.Team || mongoose.model<ITeam>("Team", TeamSchema);

export const Comment: Model<IComment> =
  mongoose.models.Comment || mongoose.model<IComment>("Comment", CommentSchema);

export const Sprint: Model<ISprint> =
  mongoose.models.Sprint || mongoose.model<ISprint>("Sprint", SprintSchema);

export const ProjectDoc: Model<IProjectDoc> =
  mongoose.models.ProjectDoc || mongoose.model<IProjectDoc>("ProjectDoc", ProjectDocSchema);

export interface IApiKey extends Document {
  organizationId: mongoose.Types.ObjectId;
  name: string;
  prefix: string;
  hashedKey: string;
  createdBy: mongoose.Types.ObjectId;
  lastUsedAt?: Date;
  isDeleted: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const ApiKeySchema = new Schema<IApiKey>(
  {
    organizationId: { type: Schema.Types.ObjectId, ref: "Organization", required: true, index: true },
    name: { type: String, required: true },
    prefix: { type: String, required: true },
    hashedKey: { type: String, required: true },
    createdBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
    lastUsedAt: { type: Date },
    isDeleted: { type: Boolean, default: false, index: true },
  },
  { timestamps: true }
);

export const ApiKey: Model<IApiKey> =
  mongoose.models.ApiKey || mongoose.model<IApiKey>("ApiKey", ApiKeySchema);

// 24. OtpVerification
export interface IOtpVerification extends Document {
  email: string;
  otp: string;
  expiresAt: Date;
  verified: boolean;
  attempts: number;
  createdAt: Date;
  updatedAt: Date;
}

const OtpVerificationSchema = new Schema<IOtpVerification>(
  {
    email: { type: String, required: true, index: true },
    otp: { type: String, required: true },
    expiresAt: { type: Date, required: true, index: { expires: 0 } },
    verified: { type: Boolean, default: false },
    attempts: { type: Number, default: 0 },
  },
  { timestamps: true }
);

export const OtpVerification: Model<IOtpVerification> =
  mongoose.models.OtpVerification ||
  mongoose.model<IOtpVerification>("OtpVerification", OtpVerificationSchema);

// 25. Reminder
export interface IReminder extends Document, BaseEntity {
  userId: mongoose.Types.ObjectId;
  title: string;
  description?: string;
  reminderTime: Date;
  priority: "Low" | "Medium" | "High" | "Urgent";
  status: "Pending" | "Completed" | "Cancelled";
  emailSent: boolean;
  emailSentAt?: Date;
  notifiedInApp: boolean;
  category: "Work" | "Personal" | "Meeting" | "Deadline" | "Follow-up";
  tags: string[];
}

const ReminderSchema = new Schema<IReminder>(
  {
    organizationId: { type: Schema.Types.ObjectId, ref: "Organization", required: true, index: true },
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    title: { type: String, required: true, trim: true },
    description: { type: String, trim: true },
    reminderTime: { type: Date, required: true, index: true },
    priority: {
      type: String,
      enum: ["Low", "Medium", "High", "Urgent"],
      default: "Medium",
      index: true,
    },
    status: {
      type: String,
      enum: ["Pending", "Completed", "Cancelled"],
      default: "Pending",
      index: true,
    },
    emailSent: { type: Boolean, default: false, index: true },
    emailSentAt: { type: Date },
    notifiedInApp: { type: Boolean, default: false },
    category: {
      type: String,
      enum: ["Work", "Personal", "Meeting", "Deadline", "Follow-up"],
      default: "Work",
      index: true,
    },
    tags: [{ type: String }],
    isDeleted: { type: Boolean, default: false, index: true },
    createdBy: { type: Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true }
);

export const Reminder: Model<IReminder> =
  mongoose.models.Reminder ||
  mongoose.model<IReminder>("Reminder", ReminderSchema);


