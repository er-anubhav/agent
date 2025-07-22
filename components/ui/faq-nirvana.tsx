import { FaqSection } from "./faq";

const INFOASSIST_FAQS = [
  {
    question: "How does InfoAssist integrate with our existing tools?",
    answer: "InfoAssist seamlessly connects with Notion, Google Drive, GitHub, Confluence, Slack, and more through secure APIs. Our platform automatically syncs and indexes your content, making it instantly searchable through natural language queries without disrupting your current workflows.",
  },
  {
    question: "What makes InfoAssist different from traditional search tools?",
    answer: "Unlike basic search, InfoAssist uses advanced AI to understand context, relationships, and intent. It doesn't just find documents - it provides intelligent answers with citations, understands follow-up questions, and learns from your team's knowledge patterns.",
  },
  {
    question: "Is our data secure with InfoAssist?",
    answer: "Absolutely. InfoAssist employs enterprise-grade security with end-to-end encryption, role-based access control, and SOC 2 compliance. Your data never leaves your control, and we follow strict privacy standards to protect your team's sensitive information.",
  },
  {
    question: "How quickly can our team get started with InfoAssist?",
    answer: "Most teams are up and running within 24 hours. Our simple onboarding process includes automatic content indexing, team member invitations, and personalized setup assistance. No technical expertise required - just connect your tools and start asking questions.",
  },
  {
    question: "What types of content can InfoAssist process?",
    answer: "InfoAssist handles all major file types including documents (PDF, DOC, MD), code repositories, wikis, presentations, spreadsheets, and more. It can process text, images with OCR, and even extract insights from video transcripts and audio files.",
  },
  {
    question: "How accurate are InfoAssist's AI responses?",
    answer: "InfoAssist provides highly accurate responses by grounding answers in your actual content and providing source citations. The AI is designed to say 'I don't know' rather than guessing, and you can always trace back to the original source documents for verification.",
  },
];

export function NirvanaFaq() {
  return (
    <FaqSection
      title="Frequently Asked Questions"
      description="Everything you need to know about InfoAssist's AI knowledge assistant platform"
      items={INFOASSIST_FAQS}
      contactInfo={{
        title: "Still have questions?",
        description: "Our team is here to help you understand how InfoAssist can transform your team's knowledge workflows",
        buttonText: "Contact Our Team",
        onContact: () => {
          // In a real implementation, this could open a contact form or navigate to a contact page
          console.log("Contact support clicked");
          window.open("mailto:support@infoassist.tech", "_blank");
        },
      }}
    />
  );
}
