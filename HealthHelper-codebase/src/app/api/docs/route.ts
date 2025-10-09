import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const apiDocs = {
  openapi: "3.0.0",
  info: {
    title: "Health Dashboard API",
    version: "1.0.0",
    description: "API for accessing health tracking data"
  },
  servers: [
    {
      url: typeof process !== "undefined" ? process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000" : "http://localhost:3000"
    }
  ],
  components: {
    securitySchemes: {
      BearerAuth: {
        type: "http",
        scheme: "bearer",
        description: "Use your API key from the Integrations page"
      }
    }
  },
  security: [
    {
      BearerAuth: []
    }
  ],
  paths: {
    "/api/health/entries": {
      get: {
        summary: "Get all health entries",
        description: "Retrieve all health tracking entries for the authenticated user",
        responses: {
          "200": {
            description: "Success",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    entries: {
                      type: "array",
                      items: {
                        type: "object",
                        properties: {
                          date: { type: "string", format: "date" },
                          stomach: {
                            type: "object",
                            properties: {
                              severity: { type: "number" },
                              painLocation: { type: "string" },
                              notes: { type: "string" }
                            }
                          },
                          skin: {
                            type: "object",
                            properties: {
                              severity: { type: "number" },
                              area: { type: "string" },
                              notes: { type: "string" }
                            }
                          },
                          mental: {
                            type: "object",
                            properties: {
                              mood: { type: "number" },
                              anxiety: { type: "number" },
                              sleepHours: { type: "number" },
                              notes: { type: "string" }
                            }
                          }
                        }
                      }
                    }
                  }
                }
              }
            }
          },
          "401": {
            description: "Unauthorized"
          }
        }
      },
      post: {
        summary: "Create a new health entry",
        description: "Create a new health tracking entry",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["date"],
                properties: {
                  date: { type: "string", format: "date" },
                  stomach: {
                    type: "object",
                    properties: {
                      severity: { type: "number", minimum: 0, maximum: 10 },
                      painLocation: { type: "string" },
                      notes: { type: "string" }
                    }
                  },
                  skin: {
                    type: "object",
                    properties: {
                      severity: { type: "number", minimum: 0, maximum: 10 },
                      area: { type: "string" },
                      notes: { type: "string" }
                    }
                  },
                  mental: {
                    type: "object",
                    properties: {
                      mood: { type: "number", minimum: 0, maximum: 10 },
                      anxiety: { type: "number", minimum: 0, maximum: 10 },
                      sleepHours: { type: "number", minimum: 0, maximum: 24 },
                      notes: { type: "string" }
                    }
                  }
                }
              }
            }
          }
        },
        responses: {
          "201": {
            description: "Entry created successfully"
          },
          "400": {
            description: "Invalid request body"
          },
          "401": {
            description: "Unauthorized"
          }
        }
      }
    },
    "/api/health/insights": {
      get: {
        summary: "Get health insights",
        description: "Retrieve AI-generated insights based on health data",
        responses: {
          "200": {
            description: "Success",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    insights: {
                      type: "array",
                      items: {
                        type: "object",
                        properties: {
                          area: { type: "string" },
                          description: { type: "string" },
                          score: { type: "number" }
                        }
                      }
                    }
                  }
                }
              }
            }
          },
          "401": {
            description: "Unauthorized"
          }
        }
      }
    }
  }
};

export async function GET() {
  return NextResponse.json(apiDocs);
}