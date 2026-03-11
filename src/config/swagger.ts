import swaggerJSDoc, { SwaggerDefinition } from "swagger-jsdoc";

const swaggerDefinition: SwaggerDefinition = {
  openapi: "3.0.0",
  info: {
    title: "Mini Zapier API",
    version: "1.0.0",
    description:
      "REST API for a workflow automation platform (mini Zapier).",
  },
  servers: [
    {
      url: "http://localhost:4000",
    },
  ],
  components: {
    schemas: {
      Workflow: {
        type: "object",
        properties: {
          id: { type: "string" },
          name: { type: "string" },
          isActive: { type: "boolean" },
          triggerType: { type: "string" },
          triggerConfig: { type: "object" },
          createdAt: { type: "string", format: "date-time" },
        },
      },
      WorkflowRun: {
        type: "object",
        properties: {
          id: { type: "string" },
          workflowId: { type: "string" },
          status: { type: "string", enum: ["running", "success", "failed", "paused"] },
          currentNodeId: { type: "string", nullable: true },
          startedAt: { type: "string", format: "date-time" },
          finishedAt: { type: "string", format: "date-time", nullable: true },
        },
      },
      StepLog: {
        type: "object",
        properties: {
          id: { type: "string" },
          runId: { type: "string" },
          stepId: { type: "string" },
          stepType: { type: "string" },
          status: { type: "string" },
          input: { type: "object", nullable: true },
          output: { type: "object", nullable: true },
          error: { type: "string", nullable: true },
          startedAt: { type: "string", format: "date-time" },
          finishedAt: { type: "string", format: "date-time", nullable: true },
          createdAt: { type: "string", format: "date-time" },
        },
      },
      ErrorResponse: {
        type: "object",
        properties: {
          message: { type: "string" },
        },
      },
    },
  },
  paths: {
    "/health": {
      get: {
        tags: ["System"],
        summary: "Health check",
        responses: {
          "200": {
            description: "Service is healthy",
          },
        },
      },
    },
    "/api/workflows": {
      get: {
        tags: ["Workflows"],
        summary: "List workflows",
        responses: {
          "200": {
            description: "List of workflows",
          },
        },
      },
      post: {
        tags: ["Workflows"],
        summary: "Create workflow",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  name: { type: "string" },
                  isActive: { type: "boolean" },
                  triggerType: { type: "string" },
                  triggerConfig: { type: "object" },
                  workflowJson: { type: "object" },
                },
                required: ["name", "triggerType"],
              },
            },
          },
        },
        responses: {
          "201": {
            description: "Workflow created",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/Workflow" },
              },
            },
          },
        },
      },
    },
    "/api/workflows/{id}": {
      get: {
        tags: ["Workflows"],
        summary: "Get workflow by ID",
        parameters: [
          {
            name: "id",
            in: "path",
            required: true,
            schema: { type: "string" },
          },
        ],
        responses: {
          "200": {
            description: "Workflow",
          },
          "404": {
            description: "Not found",
          },
        },
      },
      put: {
        tags: ["Workflows"],
        summary: "Update workflow",
        parameters: [
          {
            name: "id",
            in: "path",
            required: true,
            schema: { type: "string" },
          },
        ],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  name: { type: "string" },
                  isActive: { type: "boolean" },
                  triggerType: { type: "string" },
                  triggerConfig: { type: "object" },
                  workflowJson: { type: "object" },
                },
              },
            },
          },
        },
        responses: {
          "200": {
            description: "Updated workflow",
          },
        },
      },
      delete: {
        tags: ["Workflows"],
        summary: "Delete workflow",
        parameters: [
          {
            name: "id",
            in: "path",
            required: true,
            schema: { type: "string" },
          },
        ],
        responses: {
          "204": {
            description: "Deleted",
          },
        },
      },
    },
    "/api/workflows/{id}/run": {
      post: {
        tags: ["Workflows"],
        summary: "Run workflow",
        parameters: [
          {
            name: "id",
            in: "path",
            required: true,
            schema: { type: "string" },
          },
        ],
        requestBody: {
          required: false,
          content: {
            "application/json": {
              schema: {
                type: "object",
                additionalProperties: true,
              },
            },
          },
        },
        responses: {
          "202": {
            description: "Run enqueued",
          },
        },
      },
    },
    "/api/webhook/{workflowId}": {
      post: {
        tags: ["Triggers"],
        summary: "Webhook trigger for workflow",
        parameters: [
          {
            name: "workflowId",
            in: "path",
            required: true,
            schema: { type: "string" },
          },
        ],
        requestBody: {
          required: false,
          content: {
            "application/json": {
              schema: {
                type: "object",
                additionalProperties: true,
              },
            },
          },
        },
        responses: {
          "202": {
            description: "Webhook accepted, run enqueued",
          },
        },
      },
    },
    "/api/trigger/email": {
      post: {
        tags: ["Triggers"],
        summary: "Email trigger for workflow",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  workflowId: { type: "string" },
                  payload: { type: "object" },
                },
                required: ["workflowId"],
              },
            },
          },
        },
        responses: {
          "202": {
            description: "Email trigger accepted, run enqueued",
          },
        },
      },
    },
    "/api/cron/reload": {
      post: {
        tags: ["Triggers"],
        summary: "Reload cron-based workflows",
        responses: {
          "200": {
            description: "Cron scheduler reloaded",
          },
        },
      },
    },
    "/api/runs": {
      get: {
        tags: ["Runs"],
        summary: "List workflow runs",
        responses: {
          "200": {
            description: "List of runs",
          },
        },
      },
    },
    "/api/runs/{id}": {
      get: {
        tags: ["Runs"],
        summary: "Get run by ID",
        parameters: [
          {
            name: "id",
            in: "path",
            required: true,
            schema: { type: "string" },
          },
        ],
        responses: {
          "200": {
            description: "Run",
          },
          "404": {
            description: "Not found",
          },
        },
      },
    },
    "/api/runs/{id}/resume": {
      post: {
        tags: ["Runs"],
        summary: "Resume paused workflow run",
        parameters: [
          {
            name: "id",
            in: "path",
            required: true,
            schema: { type: "string" },
          },
        ],
        responses: {
          "202": {
            description: "Resume enqueued",
          },
        },
      },
    },
  },
};

export const swaggerSpec = swaggerJSDoc({
  definition: swaggerDefinition,
  apis: [],
});

