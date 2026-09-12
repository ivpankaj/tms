import { NextResponse } from "next/server";

export async function GET() {
  const openApiSpec = {
    openapi: "3.0.3",
    info: {
      title: "NexusCRM REST API",
      version: "1.0.0",
      description:
        "Production-grade, multi-tenant CRM API documentation for Contacts, Companies, Leads, Deals, Tasks, Tickets, Campaigns, Reports, and Automation.",
    },
    servers: [
      {
        url: "/api",
        description: "Next.js Route Handlers Base URL",
      },
    ],
    paths: {
      "/auth/login": {
        post: {
          summary: "Authenticate user and receive JWT session",
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    email: { type: "string", example: "admin@nexus.io" },
                    password: { type: "string", example: "Password123!" },
                  },
                },
              },
            },
          },
          responses: {
            200: { description: "Authentication successful with token & user context" },
            401: { description: "Invalid credentials" },
          },
        },
      },
      "/v1/contacts": {
        get: {
          summary: "List contacts with pagination, search, and tags filter",
          responses: { 200: { description: "Array of contacts with pagination metadata" } },
        },
        post: {
          summary: "Create a new contact",
          responses: { 201: { description: "Contact created successfully" } },
        },
      },
      "/v1/contacts/import": {
        post: {
          summary: "Bulk CSV contact import with column mapping and deduplication check",
          responses: { 200: { description: "Import results with created and skipped counts" } },
        },
      },
      "/v1/contacts/export": {
        get: {
          summary: "Bulk export contacts as CSV",
          responses: { 200: { description: "CSV file content" } },
        },
      },
      "/v1/deals": {
        get: {
          summary: "List deals or retrieve Kanban board columns with weighted forecasting",
          parameters: [
            { name: "view", in: "query", schema: { type: "string", enum: ["list", "kanban"] } },
          ],
          responses: { 200: { description: "Deals or grouped Kanban columns" } },
        },
        post: {
          summary: "Create deal",
          responses: { 201: { description: "Created deal" } },
        },
      },
      "/v1/leads/capture": {
        post: {
          summary: "Public web-form lead capture endpoint with auto lead scoring and round-robin assignment",
          responses: { 201: { description: "Lead captured and scored" } },
        },
      },
      "/v1/reports/dashboard": {
        get: {
          summary: "Get executive KPI cards, sales funnel, revenue trend, and rep leaderboard",
          responses: { 200: { description: "Dashboard analytics summary" } },
        },
      },
    },
  };

  return NextResponse.json(openApiSpec);
}
