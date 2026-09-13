import mongoose from "mongoose";
import { Pipeline, PipelineStage, Tag } from "./models";

export async function initializeWorkspaceDefaults(
  orgId: mongoose.Types.ObjectId | string,
  userId?: mongoose.Types.ObjectId | string
): Promise<void> {
  // 1. Create Default Workflow Delivery Pipeline
  const defaultPipeline = await Pipeline.create({
    organizationId: orgId,
    name: "Standard Delivery Pipeline",
    isDefault: true,
    createdBy: userId,
  });

  // 2. Standard Stages
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
        createdBy: userId,
      })
    )
  );

  // 3. Standard Tags
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
        createdBy: userId,
      })
    )
  );
}
