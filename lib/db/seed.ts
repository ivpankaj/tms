import bcrypt from "bcryptjs";
import { connectToDatabase } from "./connection";
import {
  Organization,
  User,
  Project,
  Team,
  Comment,
  Contact,
  Company,
  Lead,
  Pipeline,
  PipelineStage,
  Deal,
  Task,
  Activity,
  EmailTemplate,
  Campaign,
  Ticket,
  TicketComment,
  Tag,
  CustomFieldDefinition,
  Workflow,
  Notification,
  AuditLog,
} from "./models";

export async function seedDatabase(force: boolean = false): Promise<void> {
  await connectToDatabase();

  const orgCount = await Organization.countDocuments({ isDeleted: false });
  if (orgCount > 0 && !force) {
    return;
  }

  console.log("[CookMyWork] Initializing clean fresh database workspace...");

  if (force || orgCount === 0) {
    await Promise.all([
      Organization.deleteMany({}),
      User.deleteMany({}),
      Project.deleteMany({}),
      Team.deleteMany({}),
      Comment.deleteMany({}),
      Contact.deleteMany({}),
      Company.deleteMany({}),
      Lead.deleteMany({}),
      Pipeline.deleteMany({}),
      PipelineStage.deleteMany({}),
      Deal.deleteMany({}),
      Task.deleteMany({}),
      Activity.deleteMany({}),
      EmailTemplate.deleteMany({}),
      Campaign.deleteMany({}),
      Ticket.deleteMany({}),
      TicketComment.deleteMany({}),
      Tag.deleteMany({}),
      CustomFieldDefinition.deleteMany({}),
      Workflow.deleteMany({}),
      Notification.deleteMany({}),
      AuditLog.deleteMany({}),
    ]);
  }

  // 1. Fresh CookMyWork Organization
  const cookOrg = await Organization.create({
    name: "CookMyWork",
    slug: "cookmywork",
    logo: "/avatars/cookmywork.png",
    timezone: "UTC",
    currency: "USD",
    fiscalYearStart: "January",
    billingPlan: "enterprise",
  });

  const orgId = cookOrg._id;

  // 2. Fresh CookMyWork Super Admin User
  const passwordHash = await bcrypt.hash("Password123!", 10);
  const adminUser = await User.create({
    name: "CookMyWork Admin",
    email: "admin@cookmywork.com",
    passwordHash,
    role: "Super Admin",
    organizationId: orgId,
    timezone: "UTC",
    status: "active",
  });

  // 3. Default Workflow Pipeline & Stages
  const defaultPipeline = await Pipeline.create({
    organizationId: orgId,
    name: "Standard Delivery Pipeline",
    isDefault: true,
    createdBy: adminUser._id,
  });

  const stageDefs = [
    { name: "Backlog", order: 0, probability: 10, color: "#94a3b8", isWon: false, isLost: false },
    { name: "To Do", order: 1, probability: 25, color: "#38bdf8", isWon: false, isLost: false },
    { name: "In Progress", order: 2, probability: 50, color: "#818cf8", isWon: false, isLost: false },
    { name: "In Review", order: 3, probability: 75, color: "#f59e0b", isWon: false, isLost: false },
    { name: "Done", order: 4, probability: 100, color: "#10b981", isWon: true, isLost: false },
  ];

  await Promise.all(
    stageDefs.map((st) =>
      PipelineStage.create({
        organizationId: orgId,
        pipelineId: defaultPipeline._id,
        name: st.name,
        order: st.order,
        probability: st.probability,
        color: st.color,
        isWon: st.isWon,
        isLost: st.isLost,
        createdBy: adminUser._id,
      })
    )
  );

  // 4. Default Project / Task Tags
  const tagList = [
    { name: "High Priority", color: "#ef4444" },
    { name: "Bug", color: "#f87171" },
    { name: "Feature", color: "#3b82f6" },
    { name: "Improvement", color: "#8b5cf6" },
    { name: "Design", color: "#ec4899" },
    { name: "Backend", color: "#10b981" },
  ];

  await Promise.all(
    tagList.map((tag) =>
      Tag.create({
        organizationId: orgId,
        name: tag.name,
        color: tag.color,
        createdBy: adminUser._id,
      })
    )
  );

  console.log("[CookMyWork] Fresh workspace initialized successfully! (No dummy data)");
}
