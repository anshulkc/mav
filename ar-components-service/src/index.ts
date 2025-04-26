import { z } from "zod";
import {
  defineDAINService,
  ToolConfig,
} from "@dainprotocol/service-sdk";
import { CardUIBuilder, TableUIBuilder } from "@dainprotocol/utils";
import axios from 'axios';

const port = Number(process.env.PORT) || 2022;

const getNewsConfig: ToolConfig = {
  id: "get-news",
  name: "Get News",
  description: "Fetches the latest news headlines",
  input: z.object({
    category: z.string().optional().describe("Optional news category"),
  }),
  output: z.object({
    headlines: z.array(z.object({
      title: z.string(),
      description: z.string(),
    })),
  }),
  handler: async ({ category }, agentInfo) => {
    try {
      const response = await axios.get('https://newsapi.org/v2/top-headlines', {
        params: {
          country: 'us',
          category: category || 'general',
          apiKey: process.env.NEWS_API_KEY,
        },
      });

      const news = response.data.articles.slice(0, 5).map((article: any) => ({
        title: article.title,
        description: article.description || 'No description available',
      }));

      const newsTable = new TableUIBuilder()
        .addColumns([
          { key: "title", header: "Headline", type: "text" },
          { key: "description", header: "Description", type: "text" },
        ])
        .rows(news)
        .build();

      const cardUI = new CardUIBuilder()
        .title(`Latest News${category ? ` - ${category}` : ''}`)
        .addChild(newsTable)
        .build();

      return {
        text: `Here are the latest news headlines${category ? ` for ${category}` : ''}`,
        data: { headlines: news },
        ui: cardUI,
      };
    } catch (error) {
      console.error('Error fetching news:', error);
      return {
        text: "Sorry, there was an error fetching the news",
        data: { headlines: [] },
        ui: new CardUIBuilder().title("Error").content("Unable to fetch news at this time.").build(),
      };
    }
  },
};

const newsService = defineDAINService({
  metadata: {
    title: "News Service",
    description: "A service for fetching the latest news headlines",
    version: "1.0.0",
    author: "Your Name",
    tags: ["news", "headlines", "information"],
  },
  identity: {
    apiKey: process.env.DAIN_API_KEY,
  },
  tools: [getNewsConfig],
});

newsService.startNode().then(({ address }) => {
  console.log("News Service is running at :" + address().port);
});
