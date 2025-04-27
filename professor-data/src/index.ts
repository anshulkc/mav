import { defineDAINService, ToolConfig } from "@dainprotocol/service-sdk";
import { z } from "zod";
import dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env.development' });

// Check for required environment variables
if (!process.env.DAIN_API_KEY) {
  console.error("Error: DAIN_API_KEY environment variable is not set.");
  process.exit(1);
}

// Define the structure of a professor entry
const professorSchema = z.object({
  id: z.number(),
  name: z.string(),
  university: z.string(),
  department: z.string(),
  email: z.string().email(),
  research_areas: z.array(z.string()),
  website: z.string().url().optional(),
  publications: z.array(z.string().url()).optional(),
});

// Define the type for the professor data
type Professor = z.infer<typeof professorSchema>;

// Hardcoded professor data
const professors: Professor[] = [
  {
    "id": 1,
    "name": "Dr. Evelyn Reed",
    "university": "Stanford University",
    "department": "Computer Science",
    "email": "e.reed@stanford.edu",
    "research_areas": ["Artificial Intelligence", "Machine Learning", "Robotics"],
    "website": "https://cs.stanford.edu/~ereed",
    "publications": [
      "https://arxiv.org/abs/2401.12345",
      "https://doi.org/10.1109/tro.2023.54321"
    ]
  },
  {
    "id": 2,
    "name": "Professor Kenji Tanaka",
    "university": "Massachusetts Institute of Technology",
    "department": "Electrical Engineering and Computer Science",
    "email": "ktanaka@mit.edu",
    "research_areas": ["Natural Language Processing", "Computational Linguistics"],
    "website": "https://eecs.mit.edu/people/ktanaka"
    // publications omitted for brevity, can be added if needed
  },
  {
    "id": 3,
    "name": "Dr. Aisha Khan",
    "university": "University of California, Berkeley",
    "department": "Bioengineering",
    "email": "aishak@berkeley.edu",
    "research_areas": ["Synthetic Biology", "Genetic Engineering", "Drug Delivery"],
    "website": "https://bioeng.berkeley.edu/faculty/aisha-khan",
    "publications": [
      "https://www.nature.com/articles/s41587-023-01234-x"
    ]
  }
];

console.log(`Loaded ${professors.length} hardcoded professor records.`);

const getProfessorDataConfig: ToolConfig = {
  id: "get-professor-data",
  name: "Get Professor Data",
  description: "Retrieves professor information based on optional filters.",
  input: z.object({
    name: z.string().optional().describe("Filter by professor's name (case-insensitive, partial match)"),
    university: z.string().optional().describe("Filter by university name (case-insensitive, partial match)"),
    research_area: z.string().optional().describe("Filter by research area (case-insensitive, exact match from list)"),
  }).describe("Optional filters to find specific professors."),
  output: z.object({
     matches: z.array(professorSchema)
  }).describe("A list of professors matching the criteria."),
  handler: async (input) => {
    const { name, university, research_area } = input;

    const filteredProfessors = professors.filter(prof => {
      let nameMatch = true;
      let uniMatch = true;
      let areaMatch = true;

      if (name) {
        nameMatch = prof.name.toLowerCase().includes(name.toLowerCase());
      }
      if (university) {
        uniMatch = prof.university.toLowerCase().includes(university.toLowerCase());
      }
      if (research_area) {
        // Check if any research area in the professor's list matches the input (case-insensitive)
        areaMatch = prof.research_areas.some(area => area.toLowerCase() === research_area.toLowerCase());
      }

      return nameMatch && uniMatch && areaMatch;
    });

    return {
      text: `Found ${filteredProfessors.length} professors matching the criteria.`,
      data: { matches: filteredProfessors },
      ui: null
    };
  }
};

const dainService = defineDAINService({
  identity: {
    apiKey: process.env.DAIN_API_KEY, // Add identity using API key from env
  },
  metadata: {
    title: "Professor Data Service",
    description: "A service that provides access to professor data.",
    version: "1.0.0",
    author: "Your Name/Team",
    tags: ["data", "professors", "academic"]
  },
  tools: [getProfessorDataConfig],
});

dainService.startNode().then(({ address }) => {
  console.log(`Professor Data Service is running at port: ${address().port}`);
}).catch(error => {
    console.error("Failed to start DAIN service:", error);
    process.exit(1); // Exit if the service fails to start
});