import { createAppRoute } from "@trigger.dev/nextjs";
import { client } from "@/lib/trigger";

// Import jobs to register them with the Trigger client
import "@/jobs/creator-enrichment";

export const { POST } = createAppRoute(client);
