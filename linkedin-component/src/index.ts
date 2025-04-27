//File: example/example-node.ts

import { z } from "zod";
import axios from "axios";
import { URL } from 'url'; // Import the URL class

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
     // Log the key being used (partially masked)
     console.log(`Using Unipile API Key starting with: ${unipileApiKey.substring(0, 4)}...`);

    // --- Extract LinkedIn Public Identifier ---
    let linkedinIdentifier = '';
    try {
      const url = new URL(profile.linkedin_url);
      // Assumes the identifier is the last part of the path, removing trailing slash if present
      const pathParts = url.pathname.split('/').filter(part => part.length > 0);
      if (pathParts.length > 0 && pathParts[0] === 'in') {
          linkedinIdentifier = pathParts[pathParts.length - 1];
      } else {
          throw new Error("Could not parse identifier from LinkedIn URL path.");
      }
       if (!linkedinIdentifier) {
           throw new Error("Extracted identifier is empty.");
       }
       console.log(`Extracted LinkedIn Identifier: ${linkedinIdentifier}`);
    } catch (parseError: any) {
      console.error("Error parsing LinkedIn URL:", parseError.message);
      const errorMessage = `Failed to send LinkedIn invite: Invalid LinkedIn URL format (${profile.linkedin_url}). Could not extract identifier.`;
      return {
          text: errorMessage,
          data: { success: false, message: errorMessage },
          ui: null,
      };
    }
    // --- End Extract Identifier ---

    const unipileApiUrl = "https://api9.unipile.com:13995/api/v1/users/invite"; // Updated endpoint URL
    const requestPayload = {
        provider: "AiU2weCpQmyErKRuYQUuEg", // Use the correct provider ID for your linked account
        identifier: linkedinIdentifier, // Use the extracted identifier
    };
    const requestHeaders = {
        'Authorization': `Bearer ${unipileApiKey}`,
        'Content-Type': 'application/json',
    };

    console.log("--- DEBUG: Preparing Unipile API Request ---");
    console.log("URL:", unipileApiUrl);
    console.log("Headers:", JSON.stringify(requestHeaders, null, 2)); // Pretty print headers
    console.log("Payload:", JSON.stringify(requestPayload, null, 2)); // Pretty print payload
    console.log("--- DEBUG: Sending Request ---");

    try {
      const response = await axios.post(
        unipileApiUrl,
        requestPayload,
        { headers: requestHeaders }
      );

      // Assuming Unipile returns a 2xx status on success
      // You might need to adjust based on Unipile's actual response structure
      console.log("Unipile API response Status:", response.status);
      console.log("Unipile API response Data:", response.data); 
      const successMessage = `Successfully sent LinkedIn invite request to ${profile.linkedin_url} (Identifier: ${linkedinIdentifier}).`;
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
      console.error("--- DEBUG: Error calling Unipile API ---");
       if (axios.isAxiosError(error)) {
           console.error("Axios Error:", error.message);
           if (error.response) {
               // The request was made and the server responded with a status code
               // that falls out of the range of 2xx
               console.error("Response Status:", error.response.status);
               console.error("Response Headers:", JSON.stringify(error.response.headers, null, 2));
               console.error("Response Data:", JSON.stringify(error.response.data, null, 2));
           } else if (error.request) {
               // The request was made but no response was received
               console.error("Request Error: No response received. Request details:", error.request);
           } else {
               // Something happened in setting up the request that triggered an Error
               console.error('Request Setup Error:', error.message);
           }
           console.error("Axios Config:", JSON.stringify(error.config, null, 2));
       } else {
           // Handle non-Axios errors
           console.error("Non-Axios Error:", error);
       }
       console.error("--- END DEBUG ---");

       const errorMessage = `Failed to send LinkedIn invite to ${profile.linkedin_url} (Identifier: ${linkedinIdentifier}). Error: ${error.response?.data?.message || error.message}`;
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
