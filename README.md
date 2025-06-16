# What's Bruin? 🐻

**Connecting Bruins, Brewing Opportunities**

_Winner at LA Hacks 2025_

[![Website](https://img.shields.io/badge/Website-whatsbruin.co-blue)](https://whatsbruin.co)
[![Devpost](https://img.shields.io/badge/Devpost-View%20Submission-orange)](https://devpost.com/software/what-s-bruin)

## 🌟 Overview

**What's Bruin?** is an AI-powered networking platform that revolutionizes how students build meaningful connections with alumni and professors. Using advanced decision-making algorithms, the platform intelligently matches students with mentors based on personality traits, academic interests, and career aspirations - creating authentic, high-value relationships that drive real opportunities.

Built in under 10 hours during LA Hacks 2025, this project demonstrates the power of rapid innovation and purposeful technology in solving real student problems.

## 🎯 The Problem

Building genuine connections in college is challenging. Students often struggle with:

- **Information Overload**: Endless LinkedIn profiles and faculty directories
- **Missed Opportunities**: Potential mentors and resources hidden in plain sight
- **Lack of Context**: No meaningful way to identify shared interests or compatible personalities
- **Intimidation Factor**: Overwhelming process of reaching out to professionals

## 💡 The Solution

What's Bruin? bridges the gap between students and the incredible resources around them through:

### 🔍 **Intelligent Matching**

- Cross-references student profiles with vetted alumni and faculty databases
- Matches based on personality traits, research interests, and career goals
- Provides rich context including university affiliation, department, research areas, and publications

### 🧠 **AI-Powered Decision Engine**

- Leverages DAIN's dynamic tool selection to route students to the most impactful services
- Adapts recommendations based on individual student needs and goals
- Minimizes friction while maximizing meaningful outcomes

### 📊 **Rich Profile Data**

- University affiliation and department information
- Email addresses for direct contact
- Research areas and relevant publications
- Professional background and experience

## 🛠️ Technology Stack

- **AI Framework**: [DAIN Protocol](https://dain.ai) - Dynamic decision engine and tool selection
- **Data Integration**: [Linkd](https://linkd.inc) - Alumni and professional data parsing
- **Backend**: Node.js + TypeScript
- **Cloud Platform**: Google Cloud
- **API Framework**: Hono.js
- **Data Validation**: Zod
- **Caching**: Node-Cache for performance optimization

## 🚀 Features

### Core Functionality

- **Smart Alumni Matching**: Find mentors who share your academic focus and career aspirations
- **Professor Connections**: Connect with faculty members in your research areas
- **Personality-Based Filtering**: Matches based on compatibility and shared interests
- **Rich Context Delivery**: Comprehensive information to start meaningful conversations

### Technical Capabilities

- **High-Performance API**: Optimized search with intelligent caching
- **Batch Processing**: Efficient handling of multiple search queries
- **Retry Logic**: Robust error handling with exponential backoff
- **Real-time Results**: Fast response times for seamless user experience

## 📋 Getting Started

### Prerequisites

- Node.js (v16 or higher)
- npm or yarn
- DAIN Protocol CLI
- Linkd API access

### Installation

1. **Clone the repository**

   ```bash
   git clone https://github.com/yourusername/whats-bruin.git
   cd whats-bruin
   ```

2. **Install dependencies**

   ```bash
   cd networking
   npm install
   ```

3. **Configure environment variables**

   ```bash
   cp .env.example .env
   # Edit .env with your API keys:
   # LINKD_API_KEY=your_linkd_api_key
   # DAIN_API_KEY=your_dain_api_key
   ```

4. **Run the development server**

   ```bash
   npm run dev
   ```

5. **Build for production**

   ```bash
   npm run build
   ```

6. **Deploy with DAIN**
   ```bash
   npm run deploy
   ```

## 🔧 Usage

### Basic Alumni Search

```typescript
// Find alumni from a specific school
const results = await alumniService.findAlumni(
  "computer science machine learning",
  "UCLA",
  undefined, // no specific company
  undefined, // no multiple companies
  10 // limit results
);
```

### Company-Specific Search

```typescript
// Find alumni working at specific companies
const results = await alumniService.findAlumni(
  "product management",
  "UC Berkeley",
  "Google",
  undefined,
  5
);
```

### Multi-Company Search

```typescript
// Search across multiple companies
const results = await alumniService.findAlumni(
  "software engineering",
  "Stanford",
  undefined,
  ["Microsoft", "Apple", "Meta"],
  15
);
```

## 🏗️ Project Structure

```
whats-bruin/
├── networking/                 # Main networking service
│   ├── src/
│   │   └── index.ts           # Core alumni finder logic
│   ├── package.json           # Dependencies and scripts
│   ├── tsconfig.json          # TypeScript configuration
│   └── dain.json              # DAIN service configuration
├── ai-image-generator/        # Additional AI services
├── email_smart/               # Email automation service
└── README.md                  # This file
```

## 🌊 The Pivot Story

What's Bruin? has a unique origin story. Originally built around Spectacles hardware, our team spent most of the hackathon weekend deep in technical integration, only to face insurmountable compatibility issues late Saturday night.

Rather than compromise, we made the difficult decision to pivot completely - building What's Bruin? from the ground up in under 10 hours. This experience taught us:

- **Resilience Under Pressure**: How to maintain quality while moving fast
- **User-Centered Design**: Building for real needs, not just technical novelty
- **Collaborative Innovation**: The power of team alignment during crisis

## 🎯 Impact & Accomplishments

- **🏆 Winner at LA Hacks 2025**: Recognized for innovation and social impact
- **⚡ Rapid Development**: Built from concept to demo in under 10 hours
- **🎓 Student-Focused**: Addresses real pain points in academic networking
- **🤝 Meaningful Connections**: Facilitates authentic, high-value relationships

## 🔮 Future Roadmap

While our current focus is on networking, we envision What's Bruin? evolving into a comprehensive student and entrepreneur platform:

### For Students

- **Project Market Research**: AI-generated insights for student projects
- **Survey Tools**: Campus-based data collection and analysis
- **Academic Collaboration**: Find study groups and research partners

### For Businesses

- **Marketing Asset Generation**: Auto-generated posters, flyers, and designs
- **Social Media Packages**: Instagram posts, TikTok content, and calendars
- **Brand Development**: Complete branding solutions for startups

### Long-term Vision

Transform What's Bruin? into the ultimate **one-stop-shop for connections, marketing, and growth** - empowering students and young entrepreneurs to launch with clarity, confidence, and community.

## 👥 Team

**Created by passionate students who understand the networking struggle:**

- **[Aarfan Hussain](mailto:Aarfanh@UW.Edu)** - Full-Stack
- **Ashwin Prabou** - Full-Stack Developer
- **Victor Liu** - Full-Stack Developer
- **Anshul Chennavaram** - Full-Stack Developer

## 🤝 Contributing

We welcome contributions from the community! Whether you're fixing bugs, adding features, or improving documentation, your help makes What's Bruin? better for everyone.

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **LA Hacks 2025** for providing the platform and inspiration
- **DAIN Protocol** for the powerful AI decision engine
- **Linkd** for comprehensive professional data access
- **UCLA Community** for being our first users and supporters

## 📞 Contact & Support

- **Website**: [whatsbruin.co](https://whatsbruin.co)
- **Devpost**: [View our submission](https://devpost.com/software/what-s-bruin)
- **Email**: [Contact the team](mailto:Aarfanh@UW.Edu)

---

_Built with ❤️ by students, for students. Connecting Bruins, Brewing Opportunities._
