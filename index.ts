import { z } from "zod";
import { defineDAINService, ToolConfig } from "@dainprotocol/service-sdk";
import { CardUIBuilder } from "@dainprotocol/utils";

const processPromptConfig: ToolConfig = {
  id: "process-prompt",
  name: "Process Prompt",
  description:
    "Processes the given prompt and returns information that may lead to follow-up questions",
  input: z.object({
    prompt: z.string().describe("The initial prompt from the user"),
  }),
  output: z.object({
    result: z.string(),
    additionalContext: z.array(z.string()),
  }),
  handler: async ({ prompt }, agentInfo) => {
    // Process the prompt (this is where your logic would go)
    const result = `Processed result for: ${prompt}`;

    // Include additional context that might lead to follow-up questions
    const additionalContext = [
      "Related topic A",
      "Potential clarification needed on B",
      "User might be interested in C",
    ];

    return {
      text: "Prompt processed with additional context",
      data: {
        result,
        additionalContext,
      },
      ui: new CardUIBuilder().title("Prompt Results").content(result).build(),
    };
  },
};

const dainService = defineDAINService({
  metadata: {
    version: "1.0.0",
    author: "Ashwin Prabou",
    tags: ["prompt", "processing", "context"],
    title: "Prompt Processing Service",
    description:
      "A service that processes prompts and provides context for follow-up questions",
  },
  identity: {
    apiKey: process.env.DAIN_API_KEY,
  },
  tools: [processPromptConfig],
});

dainService.startNode().then(({ address }) => {
  console.log("DAIN Service is running at :" + address().port);
});
