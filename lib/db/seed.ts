import mongoose from "mongoose";
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

  const orgCount = await Organization.countDocuments();
  const projectCount = await Project.countDocuments();
  if (orgCount > 0 && projectCount > 0 && !force) {
    console.log("[Nexus Workspace] Database already seeded. Skipping.");
    return;
  }

  console.log("[Nexus Workspace] Seeding database with realistic demo data...");

  if (force) {
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

  // 1. Organizations
  const acmeOrg = await Organization.create({
    name: "Acme Enterprise",
    slug: "acme-enterprise",
    logo: "/avatars/acme.png",
    timezone: "America/New_York",
    currency: "USD",
    fiscalYearStart: "January",
    billingPlan: "enterprise",
  });

  const nexusOrg = await Organization.create({
    name: "Nexus Global Corp",
    slug: "nexus-global",
    logo: "/avatars/nexus.png",
    timezone: "Europe/London",
    currency: "EUR",
    fiscalYearStart: "April",
    billingPlan: "professional",
  });

  const orgId = acmeOrg._id;

  // 2. Users (password is 'Password123!')
  const passwordHash = await bcrypt.hash("Password123!", 10);

  const adminUser = await User.create({
    name: "Alex Sterling (Admin)",
    email: "admin@nexus.io",
    passwordHash,
    role: "Super Admin",
    organizationId: orgId,
    timezone: "America/New_York",
    status: "active",
  });

  const managerUser = await User.create({
    name: "Sarah Jenkins",
    email: "sarah.manager@nexus.io",
    passwordHash,
    role: "Manager",
    organizationId: orgId,
    timezone: "America/Chicago",
    status: "active",
    createdBy: adminUser._id,
  });

  const salesUser1 = await User.create({
    name: "John Miller",
    email: "john.sales@nexus.io",
    passwordHash,
    role: "Sales Rep",
    organizationId: orgId,
    timezone: "America/Los_Angeles",
    status: "active",
    createdBy: adminUser._id,
  });

  const salesUser2 = await User.create({
    name: "Elena Rostova",
    email: "elena.sales@nexus.io",
    passwordHash,
    role: "Sales Rep",
    organizationId: orgId,
    timezone: "Europe/London",
    status: "active",
    createdBy: adminUser._id,
  });

  const viewerUser = await User.create({
    name: "David Viewer",
    email: "viewer@nexus.io",
    passwordHash,
    role: "Viewer",
    organizationId: orgId,
    timezone: "America/New_York",
    status: "active",
    createdBy: adminUser._id,
  });

  // Also add admin to nexusOrg for tenant switching
  await User.create({
    name: "Alex Sterling",
    email: "admin.nexus@nexus.io",
    passwordHash,
    role: "Super Admin",
    organizationId: nexusOrg._id,
    timezone: "Europe/London",
    status: "active",
  });

  // 3. Pipeline & Stages
  const standardPipeline = await Pipeline.create({
    organizationId: orgId,
    name: "Enterprise Sales Pipeline",
    isDefault: true,
    createdBy: adminUser._id,
  });

  const stageDefs = [
    { name: "Lead In", order: 0, probability: 10, color: "#94a3b8", isWon: false, isLost: false },
    { name: "Discovery", order: 1, probability: 25, color: "#38bdf8", isWon: false, isLost: false },
    { name: "Demo Completed", order: 2, probability: 50, color: "#818cf8", isWon: false, isLost: false },
    { name: "Proposal Sent", order: 3, probability: 70, color: "#f59e0b", isWon: false, isLost: false },
    { name: "Negotiation", order: 4, probability: 85, color: "#a855f7", isWon: false, isLost: false },
    { name: "Closed Won", order: 5, probability: 100, color: "#10b981", isWon: true, isLost: false },
    { name: "Closed Lost", order: 6, probability: 0, color: "#ef4444", isWon: false, isLost: true },
  ];

  const stages = await Promise.all(
    stageDefs.map((st) =>
      PipelineStage.create({
        organizationId: orgId,
        pipelineId: standardPipeline._id,
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

  // 4. Tags
  const tagList = [
    { name: "High Value", color: "#6366f1" },
    { name: "Enterprise", color: "#0ea5e9" },
    { name: "Inbound", color: "#10b981" },
    { name: "Referral", color: "#f59e0b" },
    { name: "Hot Lead", color: "#ef4444" },
    { name: "Q4 Target", color: "#8b5cf6" },
  ];
  await Tag.insertMany(
    tagList.map((t) => ({ ...t, organizationId: orgId, createdBy: adminUser._id }))
  );

  // 5. Custom Field Definitions
  await CustomFieldDefinition.insertMany([
    {
      organizationId: orgId,
      entityType: "deal",
      name: "Estimated Budget",
      key: "budget",
      fieldType: "number",
      isRequired: false,
      createdBy: adminUser._id,
    },
    {
      organizationId: orgId,
      entityType: "deal",
      name: "Target Go-Live Date",
      key: "target_go_live",
      fieldType: "date",
      isRequired: false,
      createdBy: adminUser._id,
    },
    {
      organizationId: orgId,
      entityType: "contact",
      name: "Department",
      key: "department",
      fieldType: "dropdown",
      options: ["Engineering", "Finance", "Operations", "Executive", "Marketing"],
      isRequired: false,
      createdBy: adminUser._id,
    },
  ]);

  // 6. Companies
  const companyData = [
    { name: "Stripe Inc.", domain: "stripe.com", industry: "Fintech", size: "5000+", phone: "+1 415-555-0101", address: { city: "San Francisco", state: "CA", country: "USA" } },
    { name: "Snowflake Computing", domain: "snowflake.com", industry: "Data & Cloud", size: "4000+", phone: "+1 650-555-0102", address: { city: "Bozeman", state: "MT", country: "USA" } },
    { name: "Datadog Cloud", domain: "datadoghq.com", industry: "Monitoring", size: "3500+", phone: "+1 212-555-0103", address: { city: "New York", state: "NY", country: "USA" } },
    { name: "Figma Design", domain: "figma.com", industry: "SaaS Design", size: "1200+", phone: "+1 415-555-0104", address: { city: "San Francisco", state: "CA", country: "USA" } },
    { name: "Canva Creative", domain: "canva.com", industry: "Design Tech", size: "3000+", phone: "+61 2-5555-0105", address: { city: "Sydney", state: "NSW", country: "Australia" } },
    { name: "Notion Labs", domain: "notion.so", industry: "Productivity", size: "800+", phone: "+1 415-555-0106", address: { city: "San Francisco", state: "CA", country: "USA" } },
    { name: "Shopify Ecommerce", domain: "shopify.com", industry: "E-Commerce", size: "10000+", phone: "+1 613-555-0107", address: { city: "Ottawa", state: "ON", country: "Canada" } },
    { name: "Linear Systems", domain: "linear.app", industry: "Software", size: "150+", phone: "+1 415-555-0108", address: { city: "San Francisco", state: "CA", country: "USA" } },
    { name: "Vercel Platform", domain: "vercel.com", industry: "Developer Tools", size: "600+", phone: "+1 415-555-0109", address: { city: "San Francisco", state: "CA", country: "USA" } },
    { name: "HubSpot Software", domain: "hubspot.com", industry: "Marketing Tech", size: "7000+", phone: "+1 617-555-0110", address: { city: "Cambridge", state: "MA", country: "USA" } },
  ];

  const companies = await Promise.all(
    companyData.map((c) =>
      Company.create({
        organizationId: orgId,
        ...c,
        createdBy: adminUser._id,
      })
    )
  );

  // 7. Contacts (~50 realistic contacts)
  const contactProfiles = [
    { first: "Liam", last: "Smith", email: "liam.smith@stripe.com", title: "VP of Engineering", compIdx: 0, stage: "Customer", tags: ["Enterprise", "High Value"] },
    { first: "Emma", last: "Johnson", email: "emma.j@stripe.com", title: "Head of Infrastructure", compIdx: 0, stage: "Customer", tags: ["High Value"] },
    { first: "Noah", last: "Williams", email: "noah.w@stripe.com", title: "Procurement Director", compIdx: 0, stage: "Opportunity", tags: ["Enterprise"] },
    { first: "Olivia", last: "Brown", email: "olivia.b@snowflake.com", title: "Chief Information Officer", compIdx: 1, stage: "Opportunity", tags: ["Enterprise", "Hot Lead"] },
    { first: "William", last: "Jones", email: "w.jones@snowflake.com", title: "VP Finance & Operations", compIdx: 1, stage: "Opportunity", tags: ["Enterprise"] },
    { first: "Sophia", last: "Garcia", email: "sophia.g@snowflake.com", title: "Data Architect Lead", compIdx: 1, stage: "Lead", tags: ["Inbound"] },
    { first: "James", last: "Miller", email: "j.miller@datadoghq.com", title: "VP of Product", compIdx: 2, stage: "Customer", tags: ["Enterprise", "VIP"] },
    { first: "Isabella", last: "Davis", email: "i.davis@datadoghq.com", title: "Security Director", compIdx: 2, stage: "Customer", tags: ["High Value"] },
    { first: "Benjamin", last: "Rodriguez", email: "ben.r@figma.com", title: "Head of Growth", compIdx: 3, stage: "Opportunity", tags: ["Referral", "Hot Lead"] },
    { first: "Mia", last: "Martinez", email: "mia.m@figma.com", title: "Design Director", compIdx: 3, stage: "Opportunity", tags: ["Hot Lead"] },
    { first: "Lucas", last: "Hernandez", email: "lucas.h@canva.com", title: "Director of Technology", compIdx: 4, stage: "Customer", tags: ["Enterprise"] },
    { first: "Harper", last: "Lopez", email: "harper.l@canva.com", title: "Operations Manager", compIdx: 4, stage: "Lead", tags: ["Inbound"] },
    { first: "Henry", last: "Gonzalez", email: "henry.g@notion.so", title: "VP Operations", compIdx: 5, stage: "Customer", tags: ["VIP", "High Value"] },
    { first: "Evelyn", last: "Wilson", email: "evelyn.w@notion.so", title: "Senior Director IT", compIdx: 5, stage: "Customer", tags: ["Enterprise"] },
    { first: "Alexander", last: "Anderson", email: "alex.a@shopify.com", title: "E-Commerce VP", compIdx: 6, stage: "Opportunity", tags: ["Enterprise", "Hot Lead"] },
    { first: "Charlotte", last: "Thomas", email: "charlotte.t@shopify.com", title: "Global Supply Chain Lead", compIdx: 6, stage: "Opportunity", tags: ["Enterprise"] },
    { first: "Mason", last: "Taylor", email: "mason.t@linear.app", title: "Co-founder & CTO", compIdx: 7, stage: "Customer", tags: ["VIP"] },
    { first: "Amelia", last: "Moore", email: "amelia.m@linear.app", title: "Operations Lead", compIdx: 7, stage: "Customer", tags: ["Referral"] },
    { first: "Michael", last: "Jackson", email: "m.jackson@vercel.com", title: "VP Enterprise Sales", compIdx: 8, stage: "Customer", tags: ["High Value", "Enterprise"] },
    { first: "Ella", last: "Martin", email: "ella.m@vercel.com", title: "Lead Solutions Architect", compIdx: 8, stage: "Opportunity", tags: ["Inbound"] },
    { first: "Daniel", last: "Lee", email: "daniel.l@hubspot.com", title: "Head of Partnerships", compIdx: 9, stage: "Evangelist", tags: ["Partner", "VIP"] },
    { first: "Avery", last: "Perez", email: "avery.p@hubspot.com", title: "Director of Customer Success", compIdx: 9, stage: "Evangelist", tags: ["Partner"] },
    { first: "Logan", last: "Thompson", email: "logan.t@acmegroup.com", title: "Managing Director", compIdx: 0, stage: "Lead", tags: ["Inbound"] },
    { first: "Scarlett", last: "White", email: "scarlett.w@techpulse.io", title: "Chief Architect", compIdx: 1, stage: "Opportunity", tags: ["Hot Lead"] },
    { first: "Jackson", last: "Harris", email: "jackson.h@apexcloud.com", title: "Head of Infrastructure", compIdx: 2, stage: "Lead", tags: ["Inbound"] },
    { first: "Grace", last: "Sanchez", email: "grace.s@quantumlogic.com", title: "VP Engineering", compIdx: 3, stage: "Customer", tags: ["High Value"] },
    { first: "Sebastian", last: "Clark", email: "sebastian.c@nextgen.ai", title: "Chief AI Officer", compIdx: 4, stage: "Opportunity", tags: ["Enterprise", "Hot Lead"] },
    { first: "Chloe", last: "Ramirez", email: "chloe.r@omnisystems.com", title: "Director of Cloud Operations", compIdx: 5, stage: "Customer", tags: ["Enterprise"] },
    { first: "Jack", last: "Lewis", email: "jack.l@synthetix.org", title: "Security Architect", compIdx: 6, stage: "Lead", tags: ["Inbound"] },
    { first: "Zoey", last: "Robinson", email: "zoey.r@vanguardtech.com", title: "Head of IT Systems", compIdx: 7, stage: "Opportunity", tags: ["Q4 Target"] },
    { first: "Owen", last: "Walker", email: "owen.w@polarisai.com", title: "VP Product", compIdx: 8, stage: "Customer", tags: ["VIP"] },
    { first: "Lily", last: "Young", email: "lily.y@hypergrowth.co", title: "Director of Growth", compIdx: 9, stage: "Lead", tags: ["Referral"] },
    { first: "Samuel", last: "Allen", email: "samuel.a@matrixcore.com", title: "Chief Technology Officer", compIdx: 0, stage: "Customer", tags: ["Enterprise", "High Value"] },
    { first: "Aria", last: "King", email: "aria.k@cybersecure.io", title: "CISO", compIdx: 1, stage: "Opportunity", tags: ["Enterprise"] },
    { first: "David", last: "Wright", email: "david.w@datalink.org", title: "Head of Analytics", compIdx: 2, stage: "Customer", tags: ["Inbound"] },
    { first: "Hannah", last: "Scott", email: "hannah.s@cloudnative.dev", title: "Lead DevOps Engineer", compIdx: 3, stage: "Lead", tags: ["Inbound"] },
    { first: "Joseph", last: "Torres", email: "joseph.t@infinitescaling.com", title: "VP Infrastructure", compIdx: 4, stage: "Opportunity", tags: ["Hot Lead"] },
    { first: "Layla", last: "Nguyen", email: "layla.n@strataflow.io", title: "Director of Digital", compIdx: 5, stage: "Customer", tags: ["Enterprise"] },
    { first: "Carter", last: "Hill", email: "carter.h@vertexdynamics.com", title: "Senior Director Platform", compIdx: 6, stage: "Lead", tags: ["Inbound"] },
    { first: "Nora", last: "Flores", email: "nora.f@pinnaclegroup.co", title: "Chief Marketing Officer", compIdx: 7, stage: "Customer", tags: ["VIP"] },
    { first: "Wyatt", last: "Green", email: "wyatt.g@orbitallabs.com", title: "Engineering Lead", compIdx: 8, stage: "Opportunity", tags: ["Q4 Target"] },
    { first: "Hazel", last: "Adams", email: "hazel.a@frontiermedia.org", title: "Content Director", compIdx: 9, stage: "Lead", tags: ["Referral"] },
    { first: "Julian", last: "Nelson", email: "julian.n@kryptonsoft.com", title: "IT Manager", compIdx: 0, stage: "Customer", tags: ["Inbound"] },
    { first: "Ellie", last: "Baker", email: "ellie.b@nexadata.net", title: "VP Business Development", compIdx: 1, stage: "Opportunity", tags: ["Partner"] },
    { first: "Levi", last: "Hall", email: "levi.h@syncstream.io", title: "Director of Architecture", compIdx: 2, stage: "Customer", tags: ["Enterprise"] },
    { first: "Paisley", last: "Rivera", email: "paisley.r@zenithcloud.io", title: "Head of Platform", compIdx: 3, stage: "Opportunity", tags: ["Hot Lead"] },
    { first: "Gabriel", last: "Campbell", email: "gabriel.c@stratuscore.com", title: "VP Product Strategy", compIdx: 4, stage: "Customer", tags: ["VIP"] },
    { first: "Audrey", last: "Mitchell", email: "audrey.m@dynamotech.org", title: "Senior Technical Lead", compIdx: 5, stage: "Lead", tags: ["Inbound"] },
  ];

  const contacts = await Promise.all(
    contactProfiles.map((cp, idx) =>
      Contact.create({
        organizationId: orgId,
        firstName: cp.first,
        lastName: cp.last,
        email: cp.email,
        phone: `+1 555-01${(10 + idx).toString().padStart(2, "0")}`,
        title: cp.title,
        companyId: companies[cp.compIdx]._id,
        tags: cp.tags,
        avatar: `/avatars/avatar-${(idx % 10) + 1}.png`,
        socialLinks: {
          linkedin: `https://linkedin.com/in/${cp.first.toLowerCase()}-${cp.last.toLowerCase()}`,
          twitter: `https://twitter.com/${cp.first.toLowerCase()}_crm`,
        },
        lifecycleStage: cp.stage as any,
        leadSource: idx % 3 === 0 ? "Website Inbound" : idx % 3 === 1 ? "Executive Referral" : "Outbound SDR",
        customFields: {
          department: cp.title.includes("Engineering") || cp.title.includes("Architect") ? "Engineering" : "Executive",
        },
        createdBy: adminUser._id,
      })
    )
  );

  // 8. Leads (~25 leads with calculated scores)
  const leadData = [
    { first: "Lucas", last: "Vance", email: "lucas.vance@acmetech.com", company: "Acme Tech Solutions", title: "VP Technology", score: 88, status: "Qualified", source: "Web Form" },
    { first: "Elena", last: "Rios", email: "elena.r@cloudpoint.org", company: "CloudPoint Global", title: "Director of IT", score: 72, status: "Contacted", source: "Inbound" },
    { first: "Marcus", last: "Sterling", email: "m.sterling@finscale.io", company: "FinScale Dynamics", title: "Chief Risk Officer", score: 94, status: "Qualified", source: "Referral" },
    { first: "Diana", last: "Prince", email: "diana@themislegal.com", company: "Themis Legal AI", title: "Managing Partner", score: 45, status: "New", source: "Cold Email" },
    { first: "Aaron", last: "Burr", email: "aaron@wealthexchange.net", company: "Wealth Exchange", title: "President", score: 65, status: "Contacted", source: "Web Form" },
    { first: "Rachel", last: "Green", email: "rachel@ralphlauren.mock", company: "Retail Global Inc", title: "Head of Merchandising", score: 90, status: "Qualified", source: "Event / Webinar" },
    { first: "Harvey", last: "Specter", email: "harvey@pearsonhardman.mock", company: "Pearson Specter", title: "Senior Partner", score: 98, status: "Qualified", source: "Executive Referral" },
    { first: "Donna", last: "Paulsen", email: "donna@pearsonhardman.mock", company: "Pearson Specter", title: "Chief Operating Officer", score: 85, status: "Contacted", source: "Executive Referral" },
    { first: "Bruce", last: "Wayne", email: "bruce@wayneenterprises.mock", company: "Wayne Enterprises", title: "Chairman", score: 99, status: "Qualified", source: "Inbound" },
    { first: "Barry", last: "Allen", email: "barry@star-labs.mock", company: "STAR Labs Research", title: "Forensic Director", score: 55, status: "New", source: "Web Form" },
    { first: "Oliver", last: "Queen", email: "oliver@queenconsolidated.mock", company: "Queen Consolidated", title: "CEO", score: 82, status: "Contacted", source: "Referral" },
    { first: "Clark", last: "Kent", email: "clark@dailyplanet.mock", company: "Daily Planet Media", title: "Senior Tech Journalist", score: 30, status: "Disqualified", source: "Web Form" },
    { first: "Kara", last: "Danvers", email: "kara@catco.mock", company: "CatCo Worldwide", title: "Director of Communications", score: 60, status: "New", source: "Inbound" },
    { first: "Tony", last: "Stark", email: "tony@starkindustries.mock", company: "Stark Industries", title: "Chief Innovator", score: 100, status: "Qualified", source: "Event / Webinar" },
    { first: "Pepper", last: "Potts", email: "pepper@starkindustries.mock", company: "Stark Industries", title: "CEO", score: 95, status: "Qualified", source: "Event / Webinar" },
    { first: "Steve", last: "Rogers", email: "steve@shield.mock", company: "Strategic Homeland", title: "Special Projects Lead", score: 70, status: "Contacted", source: "Referral" },
    { first: "Natasha", last: "Romanoff", email: "natasha@shield.mock", company: "Strategic Homeland", title: "Intelligence Director", score: 84, status: "Contacted", source: "Referral" },
    { first: "Peter", last: "Parker", email: "peter@midtowntech.mock", company: "Parker Photonics", title: "Founder & Lead Engineer", score: 62, status: "New", source: "Web Form" },
    { first: "Wanda", last: "Maximoff", email: "wanda@westview.mock", company: "Westview Creative Labs", title: "Creative Director", score: 40, status: "New", source: "Cold Email" },
    { first: "Stephen", last: "Strange", email: "stephen@metropolitansurg.mock", company: "Metropolitan Surgical", title: "Chief of Neurosurgery", score: 78, status: "Contacted", source: "Referral" },
  ];

  await Promise.all(
    leadData.map((ld, i) =>
      Lead.create({
        organizationId: orgId,
        firstName: ld.first,
        lastName: ld.last,
        email: ld.email,
        phone: `+1 555-02${(10 + i).toString().padStart(2, "0")}`,
        company: ld.company,
        title: ld.title,
        score: ld.score,
        status: ld.status as any,
        source: ld.source,
        assignedTo: i % 2 === 0 ? salesUser1._id : salesUser2._id,
        createdBy: adminUser._id,
      })
    )
  );

  // 9. Deals (~20 deals spread across stages)
  const dealDefs = [
    { title: "Stripe Enterprise License 2026", value: 145000, stageIdx: 4, compIdx: 0, contactIdx: 0, prob: 85, daysClose: 14 },
    { title: "Stripe Global Fraud Detection Addon", value: 48000, stageIdx: 2, compIdx: 0, contactIdx: 1, prob: 50, daysClose: 45 },
    { title: "Snowflake Warehouse Integration Suite", value: 210000, stageIdx: 3, compIdx: 1, contactIdx: 3, prob: 70, daysClose: 30 },
    { title: "Snowflake Real-time Telemetry Connector", value: 35000, stageIdx: 1, compIdx: 1, contactIdx: 5, prob: 25, daysClose: 60 },
    { title: "Datadog Multi-Region Observability", value: 175000, stageIdx: 5, compIdx: 2, contactIdx: 6, prob: 100, daysClose: -5 },
    { title: "Datadog APM Seat Expansion (150 Users)", value: 52000, stageIdx: 4, compIdx: 2, contactIdx: 7, prob: 85, daysClose: 20 },
    { title: "Figma Collaborative Design API Hub", value: 92000, stageIdx: 2, compIdx: 3, contactIdx: 8, prob: 50, daysClose: 40 },
    { title: "Figma Enterprise SSO & Audit Log Upgrade", value: 28000, stageIdx: 5, compIdx: 3, contactIdx: 9, prob: 100, daysClose: -12 },
    { title: "Canva Pro Global Workspace Rollout", value: 120000, stageIdx: 3, compIdx: 4, contactIdx: 10, prob: 70, daysClose: 25 },
    { title: "Canva Template Automation API Pilot", value: 18000, stageIdx: 0, compIdx: 4, contactIdx: 11, prob: 10, daysClose: 90 },
    { title: "Notion Knowledge Base Enterprise Tier", value: 85000, stageIdx: 5, compIdx: 5, contactIdx: 12, prob: 100, daysClose: -2 },
    { title: "Notion AI Integration Custom Model", value: 64000, stageIdx: 1, compIdx: 5, contactIdx: 13, prob: 25, daysClose: 55 },
    { title: "Shopify Merchant Insights Analytics Hub", value: 320000, stageIdx: 4, compIdx: 6, contactIdx: 14, prob: 85, daysClose: 18 },
    { title: "Shopify Checkout Optimization Module", value: 95000, stageIdx: 6, compIdx: 6, contactIdx: 15, prob: 0, daysClose: -10, reason: "Budget allocated to internal build" },
    { title: "Linear Issue Tracker Sync Service", value: 38000, stageIdx: 5, compIdx: 7, contactIdx: 16, prob: 100, daysClose: -8 },
    { title: "Linear Agile Metrics Custom Reporting", value: 22000, stageIdx: 2, compIdx: 7, contactIdx: 17, prob: 50, daysClose: 35 },
    { title: "Vercel Edge Network Enterprise Routing", value: 165000, stageIdx: 3, compIdx: 8, contactIdx: 18, prob: 70, daysClose: 28 },
    { title: "Vercel Preview Deployments Audit Plugin", value: 42000, stageIdx: 1, compIdx: 8, contactIdx: 19, prob: 25, daysClose: 65 },
    { title: "HubSpot Inbound CRM Two-Way Bridge", value: 190000, stageIdx: 5, compIdx: 9, contactIdx: 20, prob: 100, daysClose: -20 },
    { title: "HubSpot Lead Scoring Engine Expansion", value: 75000, stageIdx: 6, compIdx: 9, contactIdx: 21, prob: 0, daysClose: -15, reason: "Competitor offered bundle discount" },
  ];

  const deals = await Promise.all(
    dealDefs.map((dd, idx) => {
      const closeDate = new Date();
      closeDate.setDate(closeDate.getDate() + dd.daysClose);

      return Deal.create({
        organizationId: orgId,
        title: dd.title,
        value: dd.value,
        currency: "USD",
        pipelineId: standardPipeline._id,
        stageId: stages[dd.stageIdx]._id,
        companyId: companies[dd.compIdx]._id,
        contactId: contacts[dd.contactIdx]._id,
        assignedTo: idx % 2 === 0 ? salesUser1._id : salesUser2._id,
        probability: dd.prob,
        expectedCloseDate: closeDate,
        winLossReason: dd.reason,
        products: [
          { name: "Core Platform Annual License", quantity: 1, unitPrice: Math.round(dd.value * 0.75) },
          { name: "Premium Support & Implementation", quantity: 1, unitPrice: Math.round(dd.value * 0.25) },
        ],
        customFields: {
          budget: dd.value * 1.1,
        },
        createdBy: adminUser._id,
      });
    })
  );

  // 10. Tasks & Calendar Events (~25 tasks)
  const taskData = [
    { title: "Review Stripe Enterprise MSA with Legal", dueOffset: 2, prio: "Urgent", status: "In Progress", type: "deal", refId: deals[0]._id },
    { title: "Send technical architecture deck to Snowflake CIO", dueOffset: 4, prio: "High", status: "Todo", type: "deal", refId: deals[2]._id },
    { title: "Prepare Datadog APM expansion pricing matrix", dueOffset: -1, prio: "Medium", status: "Completed", type: "deal", refId: deals[5]._id },
    { title: "Discovery call with Liam Smith (Stripe VP)", dueOffset: 1, prio: "High", status: "Todo", type: "contact", refId: contacts[0]._id },
    { title: "Follow-up email regarding Canva template API", dueOffset: 3, prio: "Low", status: "Todo", type: "deal", refId: deals[9]._id },
    { title: "Conduct quarterly security review for Notion", dueOffset: 7, prio: "High", status: "Todo", type: "company", refId: companies[5]._id },
    { title: "Schedule Shopify checkout live demonstration", dueOffset: 5, prio: "Urgent", status: "Todo", type: "deal", refId: deals[12]._id },
    { title: "Sign mutual NDA with Linear Systems founders", dueOffset: -4, prio: "Medium", status: "Completed", type: "company", refId: companies[7]._id },
    { title: "Log Q3 win/loss post-mortem analysis", dueOffset: 6, prio: "Low", status: "Todo" },
    { title: "Update custom field mappings for HubSpot integration", dueOffset: 8, prio: "Medium", status: "Todo" },
  ];

  await Promise.all(
    taskData.map((td, i) => {
      const d = new Date();
      d.setDate(d.getDate() + td.dueOffset);
      return Task.create({
        organizationId: orgId,
        title: td.title,
        dueDate: d,
        priority: td.prio as any,
        status: td.status as any,
        assignedTo: i % 2 === 0 ? salesUser1._id : salesUser2._id,
        entityType: td.type as any,
        entityId: td.refId,
        createdBy: adminUser._id,
      });
    })
  );

  // 11. Activities (calls, meetings, notes, stage changes)
  await Promise.all([
    Activity.create({
      organizationId: orgId,
      type: "call",
      title: "Discovery Phone Call",
      details: "Discussed multi-tenant requirements and scale targets. Client was very enthusiastic about sub-10ms query speeds.",
      entityType: "contact",
      entityId: contacts[0]._id,
      createdBy: salesUser1._id,
    }),
    Activity.create({
      organizationId: orgId,
      type: "meeting",
      title: "Executive Architecture Demo",
      details: "Completed 45-minute live screen share with CIO and VP Infrastructure. Next step is technical validation sandbox.",
      entityType: "deal",
      entityId: deals[2]._id,
      createdBy: salesUser2._id,
    }),
    Activity.create({
      organizationId: orgId,
      type: "stage_change",
      title: "Deal stage moved to Negotiation",
      details: "Stage advanced from Proposal Sent to Negotiation after verbal agreement on annual commitment.",
      entityType: "deal",
      entityId: deals[0]._id,
      createdBy: salesUser1._id,
    }),
    Activity.create({
      organizationId: orgId,
      type: "email",
      title: "Sent Master Services Agreement (MSA)",
      details: "Dispatched revised MSA version 2.4 incorporating mutual indemnification clauses.",
      entityType: "contact",
      entityId: contacts[0]._id,
      createdBy: adminUser._id,
    }),
  ]);

  // 12. Support Tickets & Comments (~12 tickets)
  const ticketDefs = [
    { num: "TICK-1001", sub: "SSO SAML authentication issue with Okta", desc: "Users are receiving 403 Forbidden after redirecting back from Okta identity provider callback.", stat: "In Progress", prio: "Urgent", cIdx: 0, compIdx: 0, dueHrs: 4 },
    { num: "TICK-1002", sub: "Webhook payload signature verification failed", desc: "Signatures computed with our SHA-256 secret do not match the X-Nexus-Signature header on bulk events.", stat: "Open", prio: "High", cIdx: 3, compIdx: 1, dueHrs: 12 },
    { num: "TICK-1003", sub: "CSV bulk export contains unescaped commas in address", desc: "When downloading contacts with secondary address lines, columns shift into phone number field.", stat: "Resolved", prio: "Medium", cIdx: 6, compIdx: 2, dueHrs: 24 },
    { num: "TICK-1004", sub: "Rate limit increase request for nightly sync", desc: "Requesting rate limit increase from 1,000 req/min to 5,000 req/min for nocturnal ETL database backups.", stat: "Waiting", prio: "Low", cIdx: 8, compIdx: 3, dueHrs: 48 },
    { num: "TICK-1005", sub: "Dark mode contrast on Pipeline board cards", desc: "Text on low-contrast custom badge colors is difficult to read under OLED dark mode.", stat: "Closed", prio: "Low", cIdx: 12, compIdx: 5, dueHrs: 72 },
  ];

  const tickets = await Promise.all(
    ticketDefs.map((tk, i) => {
      const sla = new Date();
      sla.setHours(sla.getHours() + tk.dueHrs);

      return Ticket.create({
        organizationId: orgId,
        ticketNumber: tk.num,
        subject: tk.sub,
        description: tk.desc,
        status: tk.stat as any,
        priority: tk.prio as any,
        contactId: contacts[tk.cIdx]._id,
        companyId: companies[tk.compIdx]._id,
        assignedTo: i % 2 === 0 ? managerUser._id : salesUser1._id,
        slaDueDate: sla,
        createdBy: adminUser._id,
      });
    })
  );

  // Ticket Comments
  await Promise.all([
    TicketComment.create({
      organizationId: orgId,
      ticketId: tickets[0]._id,
      body: "Investigated Okta assertions. The Audience URI was configured as http instead of https in customer metadata.",
      isInternal: true,
      authorName: "Alex Sterling (Admin)",
      createdBy: adminUser._id,
    }),
    TicketComment.create({
      organizationId: orgId,
      ticketId: tickets[0]._id,
      body: "Hi Liam, we have updated your SP Entity ID on our staging cluster. Please retry authentication and let us know.",
      isInternal: false,
      authorName: "Sarah Jenkins",
      createdBy: managerUser._id,
    }),
  ]);

  // 13. Email Templates
  await Promise.all([
    EmailTemplate.create({
      organizationId: orgId,
      name: "Introductory Outreach",
      subject: "Accelerating your CRM workflow at {{company}}",
      bodyHtml: "<p>Hi {{first_name}},</p><p>I noticed {{company}} has been expanding its cloud engineering team. NexusCRM helps high-growth organizations streamline their pipeline and automate customer success.</p><p>Would you have 15 minutes this Thursday for a quick demo?</p><p>Best regards,<br/>{{sender_name}}</p>",
      variables: ["first_name", "company", "sender_name"],
      category: "Outreach",
      createdBy: adminUser._id,
    }),
    EmailTemplate.create({
      organizationId: orgId,
      name: "Post-Demo Proposal & Next Steps",
      subject: "NexusCRM Demo Summary & Next Steps for {{company}}",
      bodyHtml: "<p>Hi {{first_name}},</p><p>Thank you for your time today! As discussed, attached is the proposal for <strong>{{deal_name}}</strong>.</p><p>Feel free to book a follow-up directly on my calendar if you have any questions on pricing or data migration.</p><p>Warmly,<br/>{{sender_name}}</p>",
      variables: ["first_name", "company", "deal_name", "sender_name"],
      category: "Sales",
      createdBy: adminUser._id,
    }),
  ]);

  // 14. Campaigns
  await Promise.all([
    Campaign.create({
      organizationId: orgId,
      name: "Q4 Enterprise Expansion",
      type: "email",
      status: "Completed",
      metrics: {
        sent: 1240,
        opened: 785,
        clicked: 412,
        bounced: 18,
      },
      createdBy: adminUser._id,
    }),
    Campaign.create({
      organizationId: orgId,
      name: "Nexus V2 Platform Release Webinar",
      type: "webinar",
      status: "Sending",
      metrics: {
        sent: 3500,
        opened: 2190,
        clicked: 1340,
        bounced: 42,
      },
      createdBy: adminUser._id,
    }),
  ]);

  // 15. Workflows
  await Promise.all([
    Workflow.create({
      organizationId: orgId,
      name: "Auto-Assign Inbound High Score Leads",
      description: "When a lead is created with score >= 80, automatically assign to Senior Sales Rep and create follow-up task",
      isActive: true,
      trigger: {
        event: "lead.created",
        conditions: [{ field: "score", operator: "greater_than", value: "79" }],
      },
      actions: [
        { type: "assign_owner", config: { userId: salesUser1._id } },
        { type: "create_task", config: { title: "Urgent: Follow up on High Score Lead", priority: "Urgent" } },
      ],
      createdBy: adminUser._id,
    }),
    Workflow.create({
      organizationId: orgId,
      name: "Send Welcome Packet on Deal Won",
      description: "Trigger automated onboarding email and notification when deal is marked Closed Won",
      isActive: true,
      trigger: {
        event: "deal.won",
      },
      actions: [
        { type: "send_email", config: { template: "Welcome & Onboarding" } },
        { type: "create_task", config: { title: "Schedule Onboarding Kickoff Call", priority: "High" } },
      ],
      createdBy: adminUser._id,
    }),
  ]);

  // 16. In-App Notifications
  await Promise.all([
    Notification.create({
      organizationId: orgId,
      userId: adminUser._id,
      title: "Deal Won! 🎉",
      message: "Datadog Multi-Region Observability ($175,000) was marked as Closed Won!",
      type: "deal",
      isRead: false,
      link: "/deals",
      createdBy: adminUser._id,
    }),
    Notification.create({
      organizationId: orgId,
      userId: adminUser._id,
      title: "High Priority Ticket Assigned",
      message: "TICK-1001 (SSO SAML issue) has been escalated to Engineering.",
      type: "ticket",
      isRead: false,
      link: "/tickets",
      createdBy: adminUser._id,
    }),
    Notification.create({
      organizationId: orgId,
      userId: adminUser._id,
      title: "Task Due Soon",
      message: "Review Stripe Enterprise MSA with Legal is due in 48 hours.",
      type: "task",
      isRead: true,
      link: "/tasks",
      createdBy: adminUser._id,
    }),
  ]);

  // 17. Audit Logs
  await Promise.all([
    AuditLog.create({
      organizationId: orgId,
      userId: adminUser._id,
      userName: "Alex Sterling (Admin)",
      action: "user.login",
      entityType: "auth",
      ipAddress: "192.168.1.100",
      userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64)",
      createdBy: adminUser._id,
    }),
    AuditLog.create({
      organizationId: orgId,
      userId: adminUser._id,
      userName: "Alex Sterling (Admin)",
      action: "deal.stage_change",
      entityType: "deal",
      entityId: deals[0]._id,
      changes: { from: "Proposal Sent", to: "Negotiation" },
      createdBy: adminUser._id,
    }),
  ]);

  // 18. Task & Project Management Suite Seeding
  console.log("[Nexus Workspace] Seeding Teams, Projects, and Task System...");

  // Teams
  const [engTeam, designTeam, mktTeam, infraTeam] = await Promise.all([
    Team.create({
      organizationId: orgId,
      name: "Core Engineering",
      description: "Full-stack application developers, API services, and backend systems.",
      leaderId: adminUser._id,
      members: [adminUser._id, managerUser._id, salesUser1._id],
      color: "#3b82f6",
      createdBy: adminUser._id,
    }),
    Team.create({
      organizationId: orgId,
      name: "Product & UI/UX Design",
      description: "Design systems, user research, wireframes, and design token architecture.",
      leaderId: managerUser._id,
      members: [managerUser._id, salesUser2._id],
      color: "#8b5cf6",
      createdBy: adminUser._id,
    }),
    Team.create({
      organizationId: orgId,
      name: "Growth & Marketing",
      description: "Product marketing, SEO optimization, brand narrative, and user acquisition.",
      leaderId: salesUser1._id,
      members: [salesUser1._id, viewerUser._id],
      color: "#ec4899",
      createdBy: adminUser._id,
    }),
    Team.create({
      organizationId: orgId,
      name: "DevOps & Cloud Infrastructure",
      description: "Kubernetes orchestration, multi-region database replication, CI/CD, and security.",
      leaderId: adminUser._id,
      members: [adminUser._id, salesUser2._id],
      color: "#10b981",
      createdBy: adminUser._id,
    }),
  ]);

  // Projects
  const now = new Date();
  const dOffset = (days: number) => {
    const d = new Date();
    d.setDate(d.getDate() + days);
    return d;
  };

  const [mobProj, infraProj, dsProj, mktProj] = await Promise.all([
    Project.create({
      organizationId: orgId,
      name: "Mobile App 2.0",
      key: "MOB",
      description: "Native iOS & Android application rebuild featuring offline sync and instant push notifications.",
      ownerId: adminUser._id,
      members: [adminUser._id, managerUser._id, salesUser1._id],
      status: "Active",
      priority: "High",
      startDate: dOffset(-20),
      dueDate: dOffset(30),
      progress: 65,
      color: "#3b82f6",
      tags: ["Mobile", "React Native", "Offline"],
      milestones: [
        { title: "Figma UI Architecture Approved", dueDate: dOffset(-15), completed: true, completedAt: dOffset(-14) },
        { title: "API Contract Specifications Signed", dueDate: dOffset(-5), completed: true, completedAt: dOffset(-4) },
        { title: "React Native Core Framework", dueDate: dOffset(10), completed: false },
        { title: "Beta Release to TestFlight", dueDate: dOffset(30), completed: false },
      ],
      createdBy: adminUser._id,
    }),
    Project.create({
      organizationId: orgId,
      name: "Cloud Infrastructure Migration",
      key: "INFRA",
      description: "Migrating containerized workloads to automated multi-region Kubernetes clusters with zero-downtime failover.",
      ownerId: adminUser._id,
      members: [adminUser._id, salesUser2._id],
      status: "Active",
      priority: "Urgent",
      startDate: dOffset(-10),
      dueDate: dOffset(25),
      progress: 42,
      color: "#10b981",
      tags: ["DevOps", "Kubernetes", "Security"],
      milestones: [
        { title: "VPC & Gateway Provisioning", dueDate: dOffset(-3), completed: true, completedAt: dOffset(-2) },
        { title: "Database Cluster Failover Validation", dueDate: dOffset(8), completed: false },
        { title: "Global Anycast DNS Cutover", dueDate: dOffset(25), completed: false },
      ],
      createdBy: adminUser._id,
    }),
    Project.create({
      organizationId: orgId,
      name: "Design System Revamp",
      key: "DS",
      description: "Unified token system, accessible color contrast ratios, and updated interactive components.",
      ownerId: managerUser._id,
      members: [managerUser._id, salesUser1._id],
      status: "Planning",
      priority: "Medium",
      startDate: dOffset(0),
      dueDate: dOffset(40),
      progress: 25,
      color: "#8b5cf6",
      tags: ["Design System", "Tokens", "Accessibility"],
      milestones: [
        { title: "Color Contrast & Token Audit", dueDate: dOffset(-1), completed: true, completedAt: dOffset(-1) },
        { title: "Interactive Primitive Library", dueDate: dOffset(20), completed: false },
        { title: "Design System Documentation Site", dueDate: dOffset(40), completed: false },
      ],
      createdBy: adminUser._id,
    }),
    Project.create({
      organizationId: orgId,
      name: "Marketing Website Redesign",
      key: "MKT",
      description: "High-performance marketing website with Next.js App Router, dynamic hero animations, and conversion telemetry.",
      ownerId: salesUser1._id,
      members: [salesUser1._id, viewerUser._id],
      status: "Active",
      priority: "Medium",
      startDate: dOffset(-30),
      dueDate: dOffset(10),
      progress: 85,
      color: "#ec4899",
      tags: ["Marketing", "Next.js", "SEO"],
      milestones: [
        { title: "Wireframes & Information Architecture", dueDate: dOffset(-20), completed: true, completedAt: dOffset(-18) },
        { title: "Copywriting & Asset Production", dueDate: dOffset(-8), completed: true, completedAt: dOffset(-6) },
        { title: "Production Deployment & CDN Warmup", dueDate: dOffset(10), completed: false },
      ],
      createdBy: adminUser._id,
    }),
  ]);

  // Project Tasks
  const task1 = await Task.create({
    organizationId: orgId,
    title: "Implement bi-directional WebSocket client for live task sync",
    description: "Build robust WebSocket client with exponential backoff, ping-pong keepalives, and automatic reconnection handling.",
    projectId: mobProj._id,
    teamId: engTeam._id,
    priority: "Urgent",
    status: "In Progress",
    assignedTo: adminUser._id,
    reporterId: managerUser._id,
    startDate: dOffset(-2),
    dueDate: dOffset(2),
    estimatedHours: 16,
    actualHours: 8,
    labels: ["Frontend", "WebSocket", "Feature"],
    subtasks: [
      { title: "Setup WebSocket connection singleton", completed: true, dueDate: dOffset(-1) },
      { title: "Implement exponential backoff reconnect", completed: true, dueDate: dOffset(0) },
      { title: "Add ping-pong heartbeat detector", completed: false, dueDate: dOffset(1) },
      { title: "Write unit test suite with mock sockets", completed: false, dueDate: dOffset(2) },
    ],
    checklist: [
      { title: "Validate connection drops on 3G simulator", completed: true },
      { title: "Confirm JWT renewal on auth expiry", completed: false },
    ],
    isPersonal: false,
    order: 1,
    createdBy: adminUser._id,
  });

  const task2 = await Task.create({
    organizationId: orgId,
    title: "Audit Kubernetes cluster RBAC security policies",
    description: "Verify least-privilege service accounts and ensure no secret tokens are mounted in non-system namespaces.",
    projectId: infraProj._id,
    teamId: infraTeam._id,
    priority: "High",
    status: "Todo",
    assignedTo: adminUser._id,
    reporterId: adminUser._id,
    startDate: dOffset(1),
    dueDate: dOffset(5),
    estimatedHours: 12,
    actualHours: 0,
    labels: ["DevOps", "Security", "Infrastructure"],
    subtasks: [
      { title: "Scan cluster with kube-bench", completed: false, dueDate: dOffset(3) },
      { title: "Revoke stale service account tokens", completed: false, dueDate: dOffset(5) },
    ],
    checklist: [
      { title: "Export compliance PDF report", completed: false },
    ],
    dependencies: [{ taskId: task1._id, type: "blocked_by" }],
    isPersonal: false,
    order: 2,
    createdBy: adminUser._id,
  });

  const task3 = await Task.create({
    organizationId: orgId,
    title: "Redesign global dark mode color tokens & contrast ratios",
    description: "Verify all background and text combinations adhere to WCAG AAA contrast guidelines.",
    projectId: dsProj._id,
    teamId: designTeam._id,
    priority: "Medium",
    status: "In Review",
    assignedTo: managerUser._id,
    reporterId: adminUser._id,
    startDate: dOffset(-4),
    dueDate: dOffset(1),
    estimatedHours: 20,
    actualHours: 18,
    labels: ["Design", "Accessibility", "UI"],
    subtasks: [
      { title: "Audit primary and secondary surface colors", completed: true },
      { title: "Implement Tailwind v4 color variables", completed: true },
      { title: "Test across Chrome, Safari, and Firefox", completed: false },
    ],
    isPersonal: false,
    order: 3,
    createdBy: adminUser._id,
  });

  const task4 = await Task.create({
    organizationId: orgId,
    title: "Optimize Core Web Vitals for product marketing landing pages",
    description: "Ensure LCP is under 1.2s and CLS is zero across mobile viewports.",
    projectId: mktProj._id,
    teamId: mktTeam._id,
    priority: "High",
    status: "Done",
    assignedTo: salesUser1._id,
    reporterId: salesUser1._id,
    startDate: dOffset(-7),
    dueDate: dOffset(-1),
    estimatedHours: 10,
    actualHours: 9,
    labels: ["Marketing", "Performance", "Frontend"],
    subtasks: [
      { title: "Compress hero WebP images", completed: true },
      { title: "Inline critical font preloads", completed: true },
    ],
    isPersonal: false,
    order: 4,
    createdBy: adminUser._id,
  });

  const task5 = await Task.create({
    organizationId: orgId,
    title: "Draft automated end-to-end Cypress test matrix",
    description: "Cover user signup, task creation, drag-and-drop board, and notifications.",
    projectId: mobProj._id,
    teamId: engTeam._id,
    priority: "Low",
    status: "Backlog",
    assignedTo: managerUser._id,
    reporterId: adminUser._id,
    dueDate: dOffset(20),
    estimatedHours: 24,
    actualHours: 0,
    labels: ["Testing", "QA"],
    isPersonal: false,
    order: 5,
    createdBy: adminUser._id,
  });

  const task6 = await Task.create({
    organizationId: orgId,
    title: "Configure multi-region PostgreSQL/MongoDB automated failover",
    description: "Test split-brain prevention and ensure failover switches in less than 15 seconds.",
    projectId: infraProj._id,
    teamId: infraTeam._id,
    priority: "Urgent",
    status: "In Progress",
    assignedTo: salesUser2._id,
    reporterId: adminUser._id,
    startDate: dOffset(-1),
    dueDate: dOffset(3),
    estimatedHours: 18,
    actualHours: 12,
    labels: ["Database", "DevOps", "High Availability"],
    subtasks: [
      { title: "Configure secondary replica election", completed: true },
      { title: "Simulate primary node network partition", completed: false },
    ],
    isPersonal: false,
    order: 6,
    createdBy: adminUser._id,
  });

  const task7 = await Task.create({
    organizationId: orgId,
    title: "Create Figma interactive components for dropdowns and popovers",
    description: "Include open, hover, focused, disabled, and active state variants.",
    projectId: dsProj._id,
    teamId: designTeam._id,
    priority: "Medium",
    status: "Done",
    assignedTo: managerUser._id,
    reporterId: managerUser._id,
    startDate: dOffset(-10),
    dueDate: dOffset(-2),
    estimatedHours: 8,
    actualHours: 7,
    labels: ["Design", "Figma"],
    isPersonal: false,
    order: 7,
    createdBy: adminUser._id,
  });

  const task8 = await Task.create({
    organizationId: orgId,
    title: "Build newsletter subscription API with rate-limiting",
    description: "Implement Upstash Redis token bucket rate limiting on the capture endpoint.",
    projectId: mktProj._id,
    teamId: mktTeam._id,
    priority: "Low",
    status: "Todo",
    assignedTo: viewerUser._id,
    reporterId: salesUser1._id,
    dueDate: dOffset(4),
    estimatedHours: 6,
    actualHours: 0,
    labels: ["Backend", "API"],
    isPersonal: false,
    order: 8,
    createdBy: adminUser._id,
  });

  // Personal Manual To-Do Items (Crucial for Section 7 & 8)
  await Promise.all([
    Task.create({
      organizationId: orgId,
      title: "Buy groceries for office pantry",
      description: "Coffee beans, oat milk, sparkling water, fruit basket.",
      dueDate: dOffset(0), // Today!
      priority: "Low",
      status: "Todo",
      assignedTo: adminUser._id,
      reporterId: adminUser._id,
      isPersonal: true,
      labels: ["Personal"],
      createdBy: adminUser._id,
    }),
    Task.create({
      organizationId: orgId,
      title: "Call client regarding API contract SLA",
      description: "Discuss 99.99% uptime guarantee and latency threshold definitions.",
      dueDate: dOffset(0), // Today!
      priority: "Urgent",
      status: "Todo",
      assignedTo: adminUser._id,
      reporterId: adminUser._id,
      isPersonal: true,
      labels: ["Client", "Urgent"],
      createdBy: adminUser._id,
    }),
    Task.create({
      organizationId: orgId,
      title: "Study React 19 server actions & compiler best practices",
      description: "Read documentation and explore experimental cache directives.",
      dueDate: dOffset(2), // Upcoming
      priority: "Medium",
      status: "In Progress",
      assignedTo: adminUser._id,
      reporterId: adminUser._id,
      isPersonal: true,
      labels: ["Learning"],
      recurring: { isRecurring: true, frequency: "weekly" },
      createdBy: adminUser._id,
    }),
    Task.create({
      organizationId: orgId,
      title: "Pay monthly AWS & Vercel cloud hosting bills",
      description: "Download invoices and submit expense receipts to accounting.",
      dueDate: dOffset(-1),
      priority: "High",
      status: "Done",
      assignedTo: adminUser._id,
      reporterId: adminUser._id,
      isPersonal: true,
      labels: ["Finance"],
      recurring: { isRecurring: true, frequency: "monthly" },
      createdBy: adminUser._id,
    }),
    Task.create({
      organizationId: orgId,
      title: "Review team quarterly roadmap submissions",
      description: "Prepare slide deck for Monday all-hands meeting.",
      dueDate: dOffset(-2), // Overdue!
      priority: "High",
      status: "Todo",
      assignedTo: adminUser._id,
      reporterId: adminUser._id,
      isPersonal: true,
      labels: ["Planning"],
      createdBy: adminUser._id,
    }),
  ]);

  // Task Comments
  await Promise.all([
    Comment.create({
      organizationId: orgId,
      taskId: task1._id,
      userId: managerUser._id,
      body: "I tested the reconnection logic on unstable 3G networks and it reconnects in under 500ms cleanly.",
      createdBy: managerUser._id,
    }),
    Comment.create({
      organizationId: orgId,
      taskId: task1._id,
      userId: adminUser._id,
      body: "Awesome work! Let's deploy this build to the staging cluster for broader team testing.",
      createdBy: adminUser._id,
    }),
    Comment.create({
      organizationId: orgId,
      taskId: task6._id,
      userId: adminUser._id,
      body: "Please make sure replication lag does not exceed 100ms before triggering the failover test.",
      createdBy: adminUser._id,
    }),
  ]);

  // Task Activities
  await Promise.all([
    Activity.create({
      organizationId: orgId,
      type: "created",
      title: "Task Created",
      details: 'Created task "Implement bi-directional WebSocket client for live task sync"',
      entityType: "task",
      entityId: task1._id,
      createdBy: adminUser._id,
    }),
    Activity.create({
      organizationId: orgId,
      type: "status_change",
      title: "Status Changed to In Progress",
      details: 'Task status updated from "Todo" to "In Progress"',
      entityType: "task",
      entityId: task1._id,
      createdBy: adminUser._id,
    }),
    Activity.create({
      organizationId: orgId,
      type: "comment",
      title: "Comment Added",
      details: "Sarah Jenkins commented on this task",
      entityType: "task",
      entityId: task1._id,
      createdBy: managerUser._id,
    }),
    Activity.create({
      organizationId: orgId,
      type: "created",
      title: "Project Created",
      details: 'Created project "Mobile App 2.0" (Key: MOB)',
      entityType: "project",
      entityId: mobProj._id,
      createdBy: adminUser._id,
    }),
  ]);

  console.log("[Nexus Workspace] Seeded Teams, Projects, and Task System successfully!");
}
