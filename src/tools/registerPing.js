const PING_MESSAGE = "pong - Wardround WebMCP is live";

export async function registerPing(signal) {
  if (typeof document.modelContext?.registerTool !== "function") {
    console.warn("[webmcp] document.modelContext.registerTool is unavailable");
    return false;
  }

  try {
    await document.modelContext.registerTool(
      {
        name: "ping",
        description: "Health check for Wardround. Returns a fixed confirmation message.",
        inputSchema: {
          type: "object",
          properties: {},
          additionalProperties: false,
        },
        annotations: {
          readOnlyHint: true,
        },
        execute: async () => ({
          message: PING_MESSAGE,
        }),
      },
      { signal },
    );

    console.info("[webmcp] ping registered");
    return true;
  } catch (error) {
    if (!signal.aborted) {
      console.error("[webmcp] ping registration failed", error);
    }

    return false;
  }
}