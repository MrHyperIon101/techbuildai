# TechBuild AI

**TechBuild AI** is an intelligent, AI-powered assistant designed to simplify every aspect of PC building, from component selection and compatibility checking to performance estimation and upgrade advice. Whether you're a first-time builder or a seasoned enthusiast, TechBuild AI provides the tools and insights you need to craft the perfect system.

![TechBuild AI Homepage](https://i.imgur.com/your-screenshot-url.png) <!-- Replace with an actual screenshot URL -->

## ✨ Key Features

This application leverages the power of generative AI to offer a suite of powerful, interconnected tools:

### Core Tools
- **🤖 AI PC Builder**: Get a complete, compatible PC build tailored to your budget, primary use case (Gaming, Workstation, etc.), storage needs, and aesthetic theme.
- **🚀 AI Upgrade Advisor**: Input your current PC components and a performance goal, and the AI will suggest the most impactful, budget-conscious, and compatible upgrade path.
- **Component Insights Hub**: A central database where you can search for any component and get a detailed overview, including technical specifications, key features, and related products. It automatically aggregates and displays performance data from all our benchmark tools.
- **⚖️ Component Comparator**: Directly compare two CPUs or GPUs side-by-side. The AI provides a detailed breakdown of metrics and a final verdict on which is better for different scenarios.

### Analysis & Estimation Tools
- **🎮 Gaming FPS Estimator**: Estimate the frames-per-second (FPS) you can expect for a specific game with a given CPU and GPU combination.
- **🔗 Bottleneck Calculator**: Identify potential performance bottlenecks between your CPU and GPU, complete with explanations and recommended resolutions.
- **✅ Compatibility Checker**: Manually verify the compatibility of a list of components, ensuring your chosen parts will work together seamlessly.

### Benchmark Database
Explore and compare performance metrics from a wide range of industry-standard benchmarks:
- **Cinebench** (R23 & 2024)
- **3DMark** (Time Spy, Port Royal)
- **Geekbench** (CPU & GPU Compute)
- **FurMark** (GPU Stress Test)
- **PCMark** (Overall System Performance)
- **AIDA64** (Memory & CPU Tests)
- **UserBenchmark**

### Resources
- **📖 Step-by-Step Build Guide**: A clear, illustrated guide walking you through the entire PC building process, from preparation to the first boot.
- **📜 Conversation History**: Keep track of all your interactions and AI-generated results for future reference.

## 🛠️ Tech Stack

This project is built with a modern, server-centric web stack:

- **Framework**: [Next.js](https://nextjs.org/) (App Router)
- **Language**: [TypeScript](https://www.typescriptlang.org/)
- **AI Integration**: [Firebase Genkit](https://firebase.google.com/docs/genkit)
- **UI**: [React](https://react.dev/)
- **Styling**: [Tailwind CSS](https://tailwindcss.com/)
- **Component Library**: [ShadCN UI](https://ui.shadcn.com/)

## 🚀 Getting Started

To get a local copy up and running, follow these simple steps.

### Prerequisites

- [Node.js](https://nodejs.org/en) (v18 or later recommended)
- `npm`, `yarn`, or `pnpm`

### Installation & Setup

1.  **Clone the repository:**
    ```sh
    git clone https://github.com/your-username/techbuild-ai.git
    cd techbuild-ai
    ```

2.  **Install dependencies:**
    ```sh
    npm install
    ```

3.  **Set up environment variables:**
    Create a `.env` file in the root of the project. You will need to add your Google AI (Gemini) API key, which is used by Genkit.
    ```env
    GEMINI_API_KEY=YOUR_API_KEY_HERE
    ```

4.  **Run the development server:**
    The application requires two processes to run concurrently: the Next.js frontend and the Genkit AI backend.

    - **Terminal 1: Start the Next.js app:**
      ```sh
      npm run dev
      ```
      The application will be available at `http://localhost:9002`.

    - **Terminal 2: Start the Genkit AI flows:**
      ```sh
      npm run genkit:watch
      ```
      This command starts the Genkit development server and watches for changes in your AI flow files. The Genkit UI will be available at `http://localhost:4000`.

You should now have the full application running locally!
