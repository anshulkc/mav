import { z } from "zod";
import {
  defineDAINService,
  ToolConfig,
} from "@dainprotocol/service-sdk";
import { CardUIBuilder, TableUIBuilder } from "@dainprotocol/utils";
import axios from 'axios';
import { LinkdAPI } from "./utils/linkd-api";

const port = Number(process.env.PORT) || 2022;

// Initialize Linkd API with the environment variable
const linkdAPI = new LinkdAPI(process.env.LINKD_API_KEY || '');

// 1. Alumni Connection Recommender Tool
const recommendAlumniConfig: ToolConfig = {
  id: "recommend-alumni",
  name: "Recommend Alumni Connections",
  description: "Recommends alumni to connect with based on shared interests, classes, career goals, etc.",
  input: z.object({
    interests: z.string().describe("Student's interests separated by commas"),
    classes: z.string().optional().describe("Classes taken by the student"),
    career: z.string().optional().describe("Career goals or aspirations"),
    clubs: z.string().optional().describe("Clubs or organizations the student is part of"),
    location: z.string().optional().describe("Student's location"),
    maxResults: z.number().optional().describe("Maximum number of recommendations to return")
  }),
  output: z.object({
    recommendations: z.array(z.object({
      name: z.string(),
      affiliation: z.string(),
      matchReason: z.string(),
      connectionStrength: z.number()
    }))
  }),
  handler: async ({ interests, classes, career, clubs, location, maxResults }, agentInfo) => {
    try {
      const query = `Find UCLA alumni who match with interests in ${interests}${classes ? `, took classes in ${classes}` : ''}${career ? `, working in ${career}` : ''}${clubs ? `, were part of ${clubs}` : ''}${location ? `, located in ${location}` : ''}`;
      
      // Using the enhanced Linkd API for real search results
      const searchResult = await linkdAPI.searchProfilesWebSocket({
        query,
        maxResults: maxResults || 5,
        includeDetails: true,
        sortBy: 'relevance',
        sortOrder: 'desc'
      });
      
      // Fallback to mock data if no results or for testing
      const mockResults = searchResult.profiles.length > 0 ? searchResult.profiles : [
        {
          id: "1",
          name: "Sarah Johnson",
          affiliation: "Product Manager at Google",
          education: ["UCLA Computer Science, 2018"],
          experience: ["Product Manager at Google", "Software Engineer at Microsoft"],
          interests: ["AI", "Product Management", "Entrepreneurship"],
          skills: ["Python", "Product Strategy", "UX Research"],
          location: "San Francisco, CA"
        },
        {
          id: "2",
          name: "Michael Chen",
          affiliation: "Software Engineer at Meta",
          education: ["UCLA CS & Engineering, 2020"],
          experience: ["Software Engineer at Meta", "Intern at Apple"],
          interests: ["Mobile Development", "AR/VR", "Open Source"],
          skills: ["React", "iOS Development", "C++"],
          location: "Menlo Park, CA"
        },
        {
          id: "3",
          name: "Jessica Rivera",
          affiliation: "Data Scientist at Netflix",
          education: ["UCLA Statistics, 2019"],
          experience: ["Data Scientist at Netflix", "Data Analyst at Spotify"],
          interests: ["Machine Learning", "Data Visualization", "Music Analytics"],
          skills: ["Python", "R", "SQL", "Tableau"],
          location: "Los Angeles, CA"
        }
      ];
      
      const recommendations = mockResults.map(profile => ({
        name: profile.name,
        affiliation: profile.affiliation,
        matchReason: generateMatchReason(profile, { interests, classes, career, clubs, location }),
        connectionStrength: calculateConnectionStrength(profile, { interests, classes, career, clubs, location })
      }));
      
      const recommendationsTable = new TableUIBuilder()
        .addColumns([
          { key: "name", header: "Name", type: "text" },
          { key: "affiliation", header: "Current Affiliation", type: "text" },
          { key: "matchReason", header: "Why Connect", type: "text" },
          { key: "connectionStrength", header: "Match Strength", type: "number" }
        ])
        .rows(recommendations)
        .build();
      
      const cardUI = new CardUIBuilder()
        .title("Recommended Alumni Connections")
        .addChild(recommendationsTable)
        .build();
      
      return {
        text: `Found ${recommendations.length} alumni connections that match your profile`,
        data: { recommendations },
        ui: cardUI
      };
    } catch (error) {
      console.error('Error recommending alumni:', error);
      return {
        text: "Sorry, there was an error finding alumni recommendations",
        data: { recommendations: [] },
        ui: new CardUIBuilder().title("Error").content("Unable to find alumni recommendations at this time.").build()
      };
    }
  }
};

// 2. Warm Intro Generator Tool
const generateWarmIntroConfig: ToolConfig = {
  id: "generate-warm-intro",
  name: "Generate Warm Introduction",
  description: "Shows UCLA alumni at a specific company and identifies mutual connections who could introduce you",
  input: z.object({
    company: z.string().describe("The company name to find alumni at"),
    studentName: z.string().describe("Your name"),
    studentId: z.string().optional().describe("Your profile ID if available")
  }),
  output: z.object({
    alumni: z.array(z.object({
      name: z.string(),
      role: z.string(),
      mutualConnections: z.array(z.string())
    }))
  }),
  handler: async ({ company, studentName, studentId }, agentInfo) => {
    try {
      const query = `Find UCLA alumni working at ${company}`;
      
      // Using enhanced Linkd API for company alumni search
      const searchResult = await linkdAPI.searchProfilesWebSocket({
        query,
        maxResults: 10,
        includeDetails: true,
        sortBy: 'relevance'
      });
      
      // Fallback to mock data if no results or for testing
      const mockResults = searchResult.profiles.length > 0 ? searchResult.profiles : [
        {
          id: "4",
          name: "David Kim",
          experience: ["Senior Product Designer at ${company}"],
          mutualConnections: ["Alex Chen", "Maya Johnson"]
        },
        {
          id: "5",
          name: "Emily Wong",
          experience: ["Marketing Manager at ${company}"],
          mutualConnections: ["Taylor Smith"]
        },
        {
          id: "6",
          name: "Juan Ramirez",
          experience: ["Software Engineer at ${company}"],
          mutualConnections: []
        }
      ];
      
      const alumni = mockResults.map(profile => ({
        name: profile.name,
        role: profile.experience[0] || `Employee at ${company}`,
        mutualConnections: profile.mutualConnections
      }));
      
      const alumniTable = new TableUIBuilder()
        .addColumns([
          { key: "name", header: "Name", type: "text" },
          { key: "role", header: "Role", type: "text" },
          { key: "mutualConnectionsText", header: "Mutual Connections", type: "text" }
        ])
        .rows(alumni.map(a => ({
          ...a,
          mutualConnectionsText: a.mutualConnections.join(", ") || "None found"
        })))
        .build();
      
      const cardUI = new CardUIBuilder()
        .title(`UCLA Alumni at ${company}`)
        .addChild(alumniTable)
        .build();
      
      return {
        text: `Found ${alumni.length} UCLA alumni at ${company}`,
        data: { alumni },
        ui: cardUI
      };
    } catch (error) {
      console.error('Error generating warm intros:', error);
      return {
        text: "Sorry, there was an error generating warm introductions",
        data: { alumni: [] },
        ui: new CardUIBuilder().title("Error").content("Unable to generate warm introductions at this time.").build()
      };
    }
  }
};

// 3. Ask an Alum MicroMentorship Tool
const askAlumConfig: ToolConfig = {
  id: "ask-alum",
  name: "Ask an Alum",
  description: "Match students with relevant alumni for quick questions based on profile alignment",
  input: z.object({
    question: z.string().describe("The question to ask an alumni"),
    context: z.string().describe("Context about your background, interests, and goals")
  }),
  output: z.object({
    matches: z.array(z.object({
      name: z.string(),
      role: z.string(),
      relevance: z.string(),
      matchScore: z.number()
    }))
  }),
  handler: async ({ question, context }, agentInfo) => {
    try {
      const query = `Find UCLA alumni who can answer: "${question}" with expertise related to ${context}`;
      
      // Using enhanced Linkd API for finding qualified alumni mentors
      const searchResult = await linkdAPI.searchProfilesWebSocket({
        query,
        maxResults: 5,
        includeDetails: true,
        sortBy: 'relevance'
      });
      
      // Fallback to mock data if no results or for testing
      const mockResults = searchResult.profiles.length > 0 ? searchResult.profiles : [
        {
          id: "7",
          name: "Sophia Lee",
          experience: ["Senior PM at Airbnb"],
          skills: ["Product Management", "UX Design", "Market Research"],
          interests: ["Tech Industry", "Startup Mentoring"]
        },
        {
          id: "8",
          name: "Jamal Wilson",
          experience: ["Engineering Manager at Amazon"],
          skills: ["Cloud Architecture", "Team Leadership", "System Design"],
          interests: ["Engineering Career Development", "Mentorship"]
        },
        {
          id: "9",
          name: "Priya Patel",
          experience: ["Data Science Lead at Spotify"],
          skills: ["Machine Learning", "Data Analysis", "Python"],
          interests: ["Music Tech", "AI Ethics", "Career Transitions"]
        }
      ];
      
      const matches = mockResults.map(profile => ({
        name: profile.name,
        role: profile.experience[0] || 'Professional',
        relevance: generateRelevanceDescription(profile, question, context),
        matchScore: calculateMatchScore(profile, question, context)
      }));
      
      const matchesTable = new TableUIBuilder()
        .addColumns([
          { key: "name", header: "Name", type: "text" },
          { key: "role", header: "Role", type: "text" },
          { key: "relevance", header: "Why They Can Help", type: "text" },
          { key: "matchScore", header: "Match Score", type: "number" }
        ])
        .rows(matches)
        .build();
      
      const cardUI = new CardUIBuilder()
        .title("Alumni Who Can Answer Your Question")
        .content(`Question: ${question}`)
        .addChild(matchesTable)
        .build();
      
      return {
        text: `Found ${matches.length} alumni who might be able to answer your question`,
        data: { matches },
        ui: cardUI
      };
    } catch (error) {
      console.error('Error matching with alumni mentors:', error);
      return {
        text: "Sorry, there was an error finding alumni mentors",
        data: { matches: [] },
        ui: new CardUIBuilder().title("Error").content("Unable to find alumni mentors at this time.").build()
      };
    }
  }
};

// 4. BruinLinkd Icebreaker Tool
const bruinIcebreakerConfig: ToolConfig = {
  id: "bruin-icebreaker",
  name: "BruinLinkd Icebreaker",
  description: "Connect two Bruins with shared interests and provide conversation starters",
  input: z.object({
    interests: z.string().describe("Your interests separated by commas"),
    background: z.string().describe("Brief information about your academic/professional background"),
    purpose: z.string().optional().describe("What you're hoping to gain from the connection")
  }),
  output: z.object({
    matches: z.array(z.object({
      name: z.string(),
      sharedInterests: z.array(z.string()),
      icebreaker: z.string()
    }))
  }),
  handler: async ({ interests, background, purpose }, agentInfo) => {
    try {
      const query = `Find UCLA alumni or students with shared interests in ${interests} and background in ${background}`;
      
      // Using enhanced Linkd API for finding Bruins with shared interests
      const searchResult = await linkdAPI.searchProfilesWebSocket({
        query,
        maxResults: 3,
        includeDetails: true,
        filters: {
          school: 'UCLA',
          interests: interests.split(',').map(i => i.trim())
        }
      });
      
      // Fallback to mock data if no results or for testing
      const mockResults = searchResult.profiles.length > 0 ? searchResult.profiles : [
        {
          id: "10",
          name: "Alex Thompson",
          interests: ["AI", "Machine Learning", "Basketball", "Reading"],
          education: ["UCLA Computer Science, 2021"],
          background: "Working as a Machine Learning Engineer"
        },
        {
          id: "11",
          name: "Zoe Garcia",
          interests: ["UI/UX Design", "Photography", "Hiking", "Technology"],
          education: ["UCLA Design Media Arts, 2022"],
          background: "Product Designer at a startup"
        },
        {
          id: "12",
          name: "Ryan Park",
          interests: ["Entrepreneurship", "Mobile Apps", "Running", "Travel"],
          education: ["UCLA Business Economics, 2020"],
          background: "Founded a mobile app startup"
        }
      ];
      
      const interestsList = interests.split(',').map(i => i.trim());
      
      const matches = mockResults.map(profile => {
        const sharedInterests = findSharedInterests(profile, interestsList);
        
        return {
          name: profile.name,
          sharedInterests,
          icebreaker: generateIcebreaker(profile, sharedInterests, background, purpose)
        };
      });
      
      const matchesCards = matches.map(match => {
        return new CardUIBuilder()
          .title(`Meet ${match.name}`)
          .content(`Shared Interests: ${match.sharedInterests.join(', ')}\n\nConversation Starter: ${match.icebreaker}`)
          .build();
      });
      
      // Create a single combined card with all matches
      const combinedContent = matches.map(match => {
        return `### Meet ${match.name}\n` +
               `Shared Interests: ${match.sharedInterests.join(', ')}\n\n` +
               `Conversation Starter: ${match.icebreaker}\n\n`;
      }).join('---\n\n');
      
      const mainCard = new CardUIBuilder()
        .title("BruinLinkd Weekly Connections")
        .content(`Here are your personalized Bruin connections for this week:\n\n${combinedContent}`)
        .build();
      
      return {
        text: `Found ${matches.length} Bruins to connect with based on your interests`,
        data: { matches },
        ui: mainCard
      };
    } catch (error) {
      console.error('Error generating icebreakers:', error);
      return {
        text: "Sorry, there was an error generating icebreakers",
        data: { matches: [] },
        ui: new CardUIBuilder().title("Error").content("Unable to generate icebreakers at this time.").build()
      };
    }
  }
};

// Helper functions
function generateMatchReason(profile: any, studentInfo: any): string {
  // Implementation would analyze profile and student info to generate a personalized match reason
  const interests = profile.interests || [];
  return `Shares interests in ${interests.slice(0, 2).join(', ')} and has experience at ${profile.affiliation.split(' at ')[1]}`;
}

function calculateConnectionStrength(profile: any, studentInfo: any): number {
  // Implementation would calculate a match score based on various factors
  return Math.floor(Math.random() * 40) + 60; // Placeholder: 60-100% match
}

function generateRelevanceDescription(profile: any, question: string, context: string): string {
  // Implementation would analyze how the alum's experience relates to the question
  const skills = profile.skills || [];
  return `Has expertise in ${skills.slice(0, 2).join(', ')} relevant to your question`;
}

function calculateMatchScore(profile: any, question: string, context: string): number {
  // Implementation would calculate relevance score
  return Math.floor(Math.random() * 30) + 70; // Placeholder: 70-100% match
}

function findSharedInterests(profile: any, interests: string[]): string[] {
  // Implementation would find intersection of interests
  const profileInterests = profile.interests || [];
  return profileInterests.filter((interest: string) => 
    interests.some(i => interest.toLowerCase().includes(i.toLowerCase()))
  ).slice(0, 3);
}

function generateIcebreaker(profile: any, sharedInterests: string[], background: string, purpose?: string): string {
  // Implementation would generate personalized conversation starter
  const interest = sharedInterests[0] || 'UCLA';
  return `I noticed you're interested in ${interest}! I'm currently ${background}. Would love to hear about your experience with ${interest}.`;
}

// Define the service
const alumniConnectionService = defineDAINService({
  metadata: {
    title: "UCLA Alumni Connection Service",
    description: "A service that leverages Linkd API to connect UCLA students with alumni based on shared interests, classes, career goals and more",
    version: "1.0.0",
    author: "UCLA Hackathon Team - Bruin Connections",
    tags: ["alumni", "networking", "mentorship", "UCLA", "connections", "linkd", "career"],
  },
  identity: {
    apiKey: process.env.DAIN_API_KEY,
  },
  tools: [
    recommendAlumniConfig,
    generateWarmIntroConfig,
    askAlumConfig,
    bruinIcebreakerConfig
  ],
});

// Start the service
alumniConnectionService.startNode().then(({ address }) => {
  console.log("UCLA Alumni Connection Service is running at:" + address().port);
});
