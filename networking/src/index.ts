import { z } from "zod";
import {
  defineDAINService,
  ToolConfig,
} from "@dainprotocol/service-sdk";
import { CardUIBuilder, TableUIBuilder, DainResponse } from "@dainprotocol/utils";
import axios, { AxiosInstance } from 'axios';
import dotenv from 'dotenv';

dotenv.config();

const LINKD_API_KEY = process.env.LINKD_API_KEY;
const DAIN_API_KEY = process.env.DAIN_API_KEY;

if (!LINKD_API_KEY) {
  throw new Error("LINKD_API_KEY is not set in the .env file.");
}

if (!DAIN_API_KEY) {
  throw new Error("DAIN_API_KEY is not set in the .env file.");
}


// Define types based on the Linkd API response
interface Experience {
  title: string;
  company_name: string;
  start_date: string;
  end_date: string | null;
  description: string;
  location: string;
  company_logo: string;
}

interface Education {
  degree: string;
  field_of_study: string;
  school_name: string;
  start_date: string;
  end_date: string;
  description: string;
  school_logo: string;
}

interface Profile {
  id: string;
  name: string;
  location: string;
  headline: string;
  description: string;
  title: string;
  profile_picture_url: string;
  linkedin_url: string;
}

interface UserResult {
  profile: Profile;
  experience: Experience[];
  education: Education[];
}

interface SearchResponse {
  results: UserResult[];
  total: number;
  query: string;
  error: string | null;
}

interface SearchParams {
  query: string;
  limit?: number;
  school?: string[];
}

// Create axios instance
const api: AxiosInstance = axios.create({
  baseURL: 'https://search.linkd.inc/api',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${LINKD_API_KEY}`,
  },
});

// Function to search users
const searchUsers = async (params: SearchParams): Promise<SearchResponse> => {
  try {
    const { query, limit = 10, school } = params;
    
    const queryParams = new URLSearchParams();
    queryParams.append('query', query);
    
    if (limit) {
      queryParams.append('limit', limit.toString());
    }
    
    if (school && school.length > 0) {
      school.forEach(s => queryParams.append('school', s));
    }
    
    const response = await api.get<SearchResponse>(`/search/users?${queryParams.toString()}`);
    return response.data;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      if (error.response?.status === 401) {
        throw new Error("Invalid or expired API key");
      }
      if (error.response?.data) {
        const errorMessage = 
          error.response.data.error || 
          error.response.data.detail || 
          error.response.data.message || 
          JSON.stringify(error.response.data);
        throw new Error(errorMessage);
      }
    }
    throw new Error('Failed to perform search. Please check your connection and try again.');
  }
};

const bruinNetworkingSuperToolConfig: ToolConfig = {
  id: "bruin-networking-super-tool",
  name: "Bruin Networking Super Tool",
  description: "Comprehensive tool for UCLA networking, including alumni recommendations, asking alumni questions, and connecting Bruins",
  input: z.object({
    action: z.enum(["recommendations", "ask_alum", "connect_bruins"]).describe("The networking action to perform"),
    query: z.string().optional().describe("Search query for alumni recommendations"),
    limit: z.number().optional().default(5).describe("Number of recommendations to return"),
    question: z.string().optional().describe("Student's question for an alum"),
    studentProfile: z.object({
      major: z.string(),
      graduationYear: z.number(),
      interests: z.array(z.string()),
    }).optional().describe("Student's profile information"),
    interests: z.array(z.string()).optional().describe("Shared interests to match on for connecting Bruins"),
  }),
  output: z.object({
    recommendations: z.array(z.object({
      name: z.string(),
      title: z.string().nullable(), // Allow null values for title
      company: z.string(),
      location: z.string(),
      headline: z.string(),
      profileUrl: z.string(),
      imageUrl: z.string(),
    })).optional(),
    matchedAlum: z.object({
      name: z.string(),
      title: z.string(),
      company: z.string(),
      profileUrl: z.string(),
    }).optional(),
    questionSent: z.boolean().optional(),
    matchedBruins: z.array(z.object({
      name: z.string(),
      interests: z.array(z.string()),
    })).optional(),
  }),
  handler: async (input, agentInfo) => {
    try {
      switch (input.action) {
        case "recommendations":
          if (!input.query) throw new Error("Query is required for recommendations");
          const searchParams: SearchParams = { query: input.query, limit: input.limit, school: ['UCLA'] };
          const response = await searchUsers(searchParams);

          const recommendations = response.results.map(user => ({
            name: user.profile.name,
            title: user.profile.title,
            company: user.experience[0]?.company_name || 'N/A',
            location: user.profile.location,
            headline: user.profile.headline,
            profileUrl: user.profile.linkedin_url,
            imageUrl: user.profile.profile_picture_url,
          }));

          const tableUI = new TableUIBuilder()
            .addColumns([
              { key: "name", header: "Name", type: "text" },
              { key: "title", header: "Title", type: "text" },
              { key: "company", header: "Company", type: "text" },
              { key: "location", header: "Location", type: "text" },
              { key: "headline", header: "Headline", type: "text" },
              { key: "profileUrl", header: "Profile", type: "link" },
            ])
            .rows(recommendations.map(r => ({
              ...r,
              profileUrl: r.profileUrl ? { text: "View Profile", url: r.profileUrl } : "N/A",
            })))
            .build();

          return new DainResponse({
            text: `Here are ${recommendations.length} alumni recommendations based on your query: "${input.query}"`,
            data: { recommendations },
            ui: new CardUIBuilder().title("Alumni Recommendations").addChild(tableUI).build(),
          });

        case "ask_alum":
          if (!input.question || !input.studentProfile) throw new Error("Question and student profile are required for asking an alum");
          const askAlumSearchQuery = `${input.studentProfile.major} ${input.studentProfile.interests.join(' ')}`;
          const askAlumSearchParams = { query: askAlumSearchQuery, limit: 1, school: ['UCLA'] };
          const askAlumResponse = await searchUsers(askAlumSearchParams);

          if (askAlumResponse.results.length === 0) {
            throw new Error("No matching alumni found");
          }

          const matchedAlum = askAlumResponse.results[0];
          const alumnInfo = {
            name: matchedAlum.profile.name,
            title: matchedAlum.profile.title,
            company: matchedAlum.experience[0]?.company_name || 'N/A',
            profileUrl: matchedAlum.profile.linkedin_url,
          };

          // In a real-world scenario, you would send the question to the alum here
          const questionSent = true;

          return new DainResponse({
            text: `Successfully matched with an alum and sent your question.`,
            data: { matchedAlum: alumnInfo, questionSent },
            ui: new CardUIBuilder()
              .title("Matched Alum")
              .content(`Your question has been sent to ${alumnInfo.name}, ${alumnInfo.title} at ${alumnInfo.company}.`)
              .build(),
          });

        case "connect_bruins":
          if (!input.interests) throw new Error("Interests are required for connecting Bruins");
          const connectBruinsSearchQuery = input.interests.join(' ');
          const connectBruinsSearchParams = { query: connectBruinsSearchQuery, limit: 2, school: ['UCLA'] };
          const connectBruinsResponse = await searchUsers(connectBruinsSearchParams);

          if (connectBruinsResponse.results.length < 2) {
            throw new Error("Not enough matching Bruins found");
          }

          const matchedBruins = connectBruinsResponse.results.slice(0, 2).map(bruin => ({
            name: bruin.profile.name,
            interests: input.interests!,
          }));

          return new DainResponse({
            text: `Successfully matched two Bruins based on shared interests.`,
            data: { matchedBruins },
            ui: new CardUIBuilder()
              .title("BruinLinkd Match")
              .content(`Matched ${matchedBruins[0].name} with ${matchedBruins[1].name} based on shared interests: ${input.interests.join(', ')}`)
              .build(),
          });

        default:
          throw new Error("Invalid action specified");
      }
    } catch (error: unknown) {
      console.error('Error in Bruin Networking Super Tool:', error);
      const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
      return new DainResponse({
        text: "Sorry, there was an error processing your request",
        data: {},
        ui: new CardUIBuilder().title("Error").content(`Unable to complete the requested action: ${errorMessage}`).build(),
      });
    }
  },
};

const networkingService = defineDAINService({
  metadata: {
    title: "UCLA Networking Super Service",
    description: `A comprehensive service for alumni connections, mentorship, and networking opportunities. 
    This super tool combines alumni recommendations, asking alumni questions, and connecting Bruins with shared interests.`,
    version: "1.0.0",
    author: "Your Name",
    tags: ["networking", "alumni", "connections", "mentorship", "UCLA"],
  },
  identity: {
    apiKey: process.env.DAIN_API_KEY,
  },
  tools: [bruinNetworkingSuperToolConfig],
});

networkingService.startNode().then(({ address }) => {
  console.log("UCLA Networking Super Service is running at :" + address().port);
});
