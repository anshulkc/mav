//File: example/example-node.ts

import { z } from "zod";
import axios from "axios";

import { defineDAINService, ToolConfig } from "@dainprotocol/service-sdk";

const port = Number(process.env.PORT) || 2022;

const sendLinkedInInviteConfig: ToolConfig = {
  id: "send-linkedin-invite",
  name: "Send LinkedIn Invite",
  description: "Sends a LinkedIn connection request using Unipile API, based on a Linkd profile URL.",
  input: z
    .object({
      // Expects a profile object similar to Linkd output
      profile: z.object({
        linkedin_url: z.string().url().describe("The LinkedIn profile URL of the person to connect with."),
      }).describe("Profile data containing the LinkedIn URL."),
      message: z.string().optional().describe("Optional custom message to include with the connection request."),
    })
    .describe("Input required to send a LinkedIn connection request."),
  output: z
    .object({
      success: z.boolean().describe("Indicates whether the invitation was sent successfully."),
      message: z.string().describe("A message describing the outcome (e.g., success confirmation or error details)."),
    })
    .describe("Result of the LinkedIn invitation attempt."),
  pricing: { pricePerUse: 0, currency: "USD" }, // Adjust pricing as needed
  handler: async ({ profile, message }, agentInfo, context) => {
    console.log(
      `User / Agent ${agentInfo.id} requested LinkedIn connection to: ${profile.linkedin_url}`
    );

    // --- IMPORTANT: Configure Unipile API Key --- 
    // You MUST get your API key from Unipile and store it securely (e.g., environment variable)
    const unipileApiKey = process.env.UNIPILE_API_KEY; 
    if (!unipileApiKey) {
        console.error("UNIPILE_API_KEY environment variable not set.");
        return {
            text: "Failed to send invite: Server configuration error.",
            data: { 
                success: false,
                message: "Server configuration error: Unipile API Key is missing.",
            },
            ui: null, // Dain requires data and ui fields
         };
     }

    const unipileApiUrl = "https://api.unipile.com/users/invitation"; // Verify this endpoint URL

    try {
      const response = await axios.post(
        unipileApiUrl,
        {
          provider: "linkedin",
          identifier: profile.linkedin_url,
          message: message || "I'd like to connect with you on LinkedIn.", // Default message if none provided
        },
        {
          headers: {
            'Authorization': `Bearer ${unipileApiKey}`,
            'Content-Type': 'application/json',
          },
        }
      );

      // Assuming Unipile returns a 2xx status on success
      // You might need to adjust based on Unipile's actual response structure
      console.log("Unipile API response:", response.data); 
      const successMessage = `Successfully sent LinkedIn invite request to ${profile.linkedin_url}.`;
      return {
        text: successMessage, // Text summary for the agent/user
        data: {
            success: true,
            message: successMessage,
        },
        ui: null, // Dain requires data and ui fields
        // Optionally, include UI elements if needed
      };

    } catch (error: any) {
      console.error("Error calling Unipile API:", error.response?.data || error.message);
      const errorMessage = `Failed to send LinkedIn invite to ${profile.linkedin_url}. Error: ${error.response?.data?.message || error.message}`;
      return {
        text: errorMessage, // Text summary for the agent/user
        data: {
            success: false,
            message: errorMessage,
        },
        ui: null, // Dain requires data and ui fields
      };
    }
  },
};

const dainService = defineDAINService({
  metadata: {
    title: "Mav LinkedIn DAIN Service", // Updated title
    description:
      "A DAIN service for interacting with LinkedIn via Unipile, including sending connection requests.", // Updated description
    version: "1.0.0",
    author: "Your Name / Team", // Update author
    tags: ["linkedin", "unipile", "connection", "invite", "dain"], // Added relevant tags
    logo: "YOUR_LOGO_URL_HERE", // Add a relevant logo URL if you have one
  },
  exampleQueries: [],
  identity: {
    apiKey: process.env.DAIN_API_KEY,
  },
  tools: [sendLinkedInInviteConfig], // Only include the LinkedIn tool
});

dainService.startNode({ port: port }).then(({ address }) => {
  console.log("LinkedIn DAIN Service is running at :" + address().port);
});
