
# InfoAssist — Your Team’s Instant AI Knowledge Assistant


InfoAssist is an intelligent AI-powered assistant designed to make your team’s collective knowledge instantly accessible and actionable — across all platforms, documents, and formats.

---

## Table of Contents

- [InfoAssist — Your Team’s Instant AI Knowledge Assistant](#infoassist--your-teams-instant-ai-knowledge-assistant)
  - [Table of Contents](#table-of-contents)
  - [Why InfoAssist Exists](#why-infoassist-exists)
  - [What InfoAssist Does](#what-infoassist-does)
  - [Core Features](#core-features)
  - [🏗️ Project Structure](#️-project-structure)
  - [🧩 Key Technologies](#-key-technologies)
  - [⚡ Getting Started](#-getting-started)
  - [📝 Customization \& Extensibility](#-customization--extensibility)
  - [Business Potential \& Market Opportunity](#business-potential--market-opportunity)
  - [Future Roadmap](#future-roadmap)
  - [Contributing](#contributing)
  - [Links](#links)
  - [📄 License](#-license)
  - [✨ Acknowledgements](#-acknowledgements)

---

## Why InfoAssist Exists

Teams drown in scattered, siloed knowledge — from Slack chats, Google Drive docs, Notion databases, and PDFs.

Searching across multiple tools wastes valuable time, causing context loss and frustration.

Existing AI assistants lack seamless integration with your personal and cloud-stored knowledge bases, limiting their usefulness.

Teams need a smart, unified solution that understands context and answers questions instantly.

---

## What InfoAssist Does

InfoAssist acts as a unified AI knowledge agent that:

- Indexes and understands your team’s internal documents, across Notion, Google Drive, PDFs, and more.
- Enables users to ask natural language questions and get precise, context-aware answers immediately.
- Supports uploading new documents for instant indexing and querying.
- Offers multi-channel access including a powerful Telegram bot interface.
- Empowers teams to make faster, smarter decisions based on unified knowledge.

---


## Core Features

- **Multi-platform Document Integration**: Import and sync documents from Notion, Google Drive, PDFs, and user uploads.
- **Smart AI Q&A**: Powered by advanced large language models that answer questions with context from your team’s knowledge.
- **Instant Document Indexing**: Upload any file, and InfoAssist immediately makes it searchable and queryable.
- **Telegram Bot Access**: Interact with your knowledge base on the go, outside the website.
- **User Authentication & Access Control**: Secure registration, login, and role-based permissions.
- **Unified Search Experience**: No more hopping between apps; get all answers in one place.

---

## 🏗️ Project Structure

```
agent/
  app/                # Next.js app directory (routes, layouts, API)
  components/         # UI components (chat, artifacts, sidebar, etc.)
  hooks/              # Custom React hooks
  lib/                # Core logic (AI, DB, ingestion, utils, etc.)
  vector-store/       # Vector search and FAISS integration
  public/             # Static assets
  artifacts/          # Artifact handlers (text, code, image, sheet)
  ...
```

---

## 🧩 Key Technologies

- **Next.js** (App Router)
- **TypeScript**
- **React** (with hooks and context)
- **Drizzle ORM** (PostgreSQL)
- **FAISS** (Vector search)
- **OpenAI / Gemini / LLMs**
- **Tailwind CSS** (for styling)
- **Vercel** (deployment & observability)

---

## ⚡ Getting Started

1. **Clone the repo:**
   ```sh
   git clone https://github.com/er-anubhav/agent.git
   cd agent
   ```
2. **Install dependencies:**
   ```sh
   npm install
   ```
3. **Configure environment:**
   - Copy `.env.example` to `.env.local` and fill in required values (Postgres URL, API keys, etc).
4. **Run the development server:**
   ```sh
   npm run dev
   ```
5. **Open [http://localhost:3000](http://localhost:3000) in your browser.**

---

## 📝 Customization & Extensibility

- **Artifacts**: Add new artifact types in `artifacts/` and register them in `components/artifact.tsx`.
- **Knowledge Connectors**: Extend document ingestion via `lib/ingestion/` (Notion, GDocs, etc).
- **AI Models**: Configure or add new models in `lib/ai/models.ts` and `lib/ai/providers.ts`.
- **UI Components**: Build new UI in `components/` and use hooks from `hooks/`.

---

---

## Business Potential & Market Opportunity

The remote and hybrid work era demands seamless knowledge sharing.

Enterprises waste millions in lost productivity searching for info.

InfoAssist enables faster decision-making and reduces onboarding time for new employees.

Can expand into vertical-specific knowledge assistants (legal, medical, finance).

Subscription-based SaaS model with tiered plans for teams of all sizes.

Potential for enterprise licensing, API access, and premium AI model integrations.

---

## Future Roadmap

- Add support for more document platforms (Dropbox, SharePoint).
- Multi-lingual support for global teams.
- Advanced analytics for knowledge gaps and usage insights.
- Enhanced context retention for longer conversations.
- Mobile app for iOS and Android.
- Offline document indexing and querying.

---

## Contributing

Contributions are welcome. Fork, branch, and submit PRs for bug fixes, new features, or improvements.

---


## Links

- [InfoAssist.tech](https://infoassist.tech)
- [Demo Video](https://youtu.be/JyM39Gt5RXg)

---

## 📄 License

This project is licensed under the MIT License. See `LICENSE` for details.

---

## ✨ Acknowledgements

- [Next.js](https://nextjs.org/)
- [Drizzle ORM](https://orm.drizzle.team/)
- [FAISS](https://github.com/facebookresearch/faiss)
- [OpenAI](https://openai.com/)
- [Vercel](https://vercel.com/)

---

> Made with ❤️ by [er-anubhav](https://github.com/er-anubhav)
