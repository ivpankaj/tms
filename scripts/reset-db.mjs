import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import fs from "fs";
import path from "path";

// Read .env file to get real URI and DB name
const envPath = path.resolve(process.cwd(), ".env");
let mongoUri = "mongodb://127.0.0.1:27017/cookmywork";
let dbName = "cookmywork";

if (fs.existsSync(envPath)) {
  const content = fs.readFileSync(envPath, "utf-8");
  for (const line of content.split("\n")) {
    const trimmed = line.trim();
    if (trimmed.startsWith("MONGODB_URI=")) {
      mongoUri = trimmed.replace("MONGODB_URI=", "").trim();
    }
    if (trimmed.startsWith("MONGODB_DB_NAME=")) {
      dbName = trimmed.replace("MONGODB_DB_NAME=", "").trim();
    }
  }
}

console.log(`Connecting to MongoDB (${dbName}) at ${mongoUri.slice(0, 35)}...`);

async function reset() {
  await mongoose.connect(mongoUri, { dbName, serverSelectionTimeoutMS: 15000 });
  console.log("Connected successfully to MongoDB!");

  const db = mongoose.connection.db;
  const collections = await db.listCollections().toArray();
  console.log(`Found ${collections.length} collections. Wiping all dummy data...`);

  for (const col of collections) {
    const result = await db.collection(col.name).deleteMany({});
    console.log(` - Cleared ${col.name}: ${result.deletedCount} documents removed`);
  }

  console.log("\nInitializing fresh Cookmywork workspace...");

  // 1. Organization
  const orgResult = await db.collection("organizations").insertOne({
    name: "Cookmywork",
    slug: "cookmywork",
    logo: "/avatars/cookmywork.png",
    timezone: "UTC",
    currency: "USD",
    fiscalYearStart: "January",
    billingPlan: "enterprise",
    isDeleted: false,
    createdAt: new Date(),
    updatedAt: new Date(),
  });
  const orgId = orgResult.insertedId;
  console.log(` + Created Organization: Cookmywork (ID: ${orgId})`);

  // 2. Super Admin User
  const passwordHash = await bcrypt.hash("Password123!", 10);
  const userResult = await db.collection("users").insertOne({
    name: "Cookmywork Admin",
    email: "admin@cookmywork.com",
    passwordHash,
    role: "Super Admin",
    organizationId: orgId,
    timezone: "UTC",
    status: "active",
    isDeleted: false,
    createdAt: new Date(),
    updatedAt: new Date(),
  });
  const adminId = userResult.insertedId;
  console.log(` + Created Super Admin: admin@cookmywork.com (Password: Password123!)`);

  // 3. Default Pipeline & Stages
  const pipeResult = await db.collection("pipelines").insertOne({
    organizationId: orgId,
    name: "Standard Delivery Pipeline",
    isDefault: true,
    createdBy: adminId,
    isDeleted: false,
    createdAt: new Date(),
    updatedAt: new Date(),
  });

  const stageDefs = [
    { name: "Backlog", order: 0, probability: 10, color: "#94a3b8", isWon: false, isLost: false },
    { name: "To Do", order: 1, probability: 25, color: "#38bdf8", isWon: false, isLost: false },
    { name: "In Progress", order: 2, probability: 50, color: "#818cf8", isWon: false, isLost: false },
    { name: "In Review", order: 3, probability: 75, color: "#f59e0b", isWon: false, isLost: false },
    { name: "Done", order: 4, probability: 100, color: "#10b981", isWon: true, isLost: false },
  ];

  await db.collection("pipelinestages").insertMany(
    stageDefs.map((st) => ({
      organizationId: orgId,
      pipelineId: pipeResult.insertedId,
      name: st.name,
      order: st.order,
      probability: st.probability,
      color: st.color,
      isWon: st.isWon,
      isLost: st.isLost,
      createdBy: adminId,
      isDeleted: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    }))
  );
  console.log(" + Created default pipeline stages (Backlog, To Do, In Progress, In Review, Done)");

  // 4. Default Tags
  const tagList = [
    { name: "High Priority", color: "#ef4444" },
    { name: "Bug", color: "#f87171" },
    { name: "Feature", color: "#3b82f6" },
    { name: "Improvement", color: "#8b5cf6" },
    { name: "Design", color: "#ec4899" },
    { name: "Backend", color: "#10b981" },
  ];

  await db.collection("tags").insertMany(
    tagList.map((tag) => ({
      organizationId: orgId,
      name: tag.name,
      color: tag.color,
      createdBy: adminId,
      isDeleted: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    }))
  );
  console.log(" + Created default workspace tags");

  console.log("\n[SUCCESS] All dummy data wiped completely! Cookmywork workspace is 100% clean and fresh.");
  await mongoose.disconnect();
}

reset().catch((err) => {
  console.error("Reset failed:", err);
  process.exit(1);
});
