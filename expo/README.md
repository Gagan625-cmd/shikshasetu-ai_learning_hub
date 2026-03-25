ShikshaSetu: AI Learning Hub – Complete Project Documentation
1. Project Overview

ShikshaSetu is an AI-powered educational platform designed for Indian students (Grades 6–10) and teachers, supporting NCERT and ICSE curricula with multi-language support across 10 Indian languages.

Purpose

To bridge learning gaps using Artificial Intelligence by enabling:

Personalized learning paths

Automated, syllabus-aligned content generation

Intelligent assessments and evaluations

AI-powered teacher productivity tools

Positioning

ShikshaSetu functions as a learning companion, not merely a content app. It addresses real challenges in Indian education such as linguistic diversity, curriculum fragmentation, and teacher workload through a unified AI-driven platform.

2. Architecture & Technology Stack
2.1 Frontend Stack

Framework: React Native (Expo SDK 54.0.0+)

Platforms: Android, iOS, Web (React Native Web)

Language: TypeScript (strict mode)

Routing: Expo Router (file-based routing)

Styling: React Native StyleSheet API

Icons: lucide-react-native

UI Components: Custom animated components with LinearGradient

Technical Rationale:
The frontend prioritizes cross-platform compatibility, type safety, and performance on low-end devices. Expo’s managed workflow removes native complexity while enabling access to camera, microphone, storage, and multimedia—critical for AI-powered educational features.

3. State Management Architecture

Local UI State: React useState

Global Context: @nkzw/create-context-hook

Server / AI State: @tanstack/react-query v5

Persistence: @react-native-async-storage/async-storage

Design Philosophy:
A layered state model avoids Redux complexity while remaining scalable. AI calls are treated as server-side mutations, and user progress is cached locally to support offline-first learning.

4. Backend Architecture

API Framework: Hono

API Layer: tRPC (end-to-end type safety)

Database: SurrealDB

Serialization: SuperJSON

Backend Location: /backend directory

Engineering Perspective:
The backend is optimized for AI-driven workloads, where response structures evolve dynamically. tRPC ensures type safety between frontend and backend, reducing integration errors and improving development velocity.

5. AI / ML Integration Overview

AI SDK: @rork-ai/toolkit-sdk

Text Generation: generateText()

Structured AI Output: generateObject() with Zod schemas

Conversational AI: useRorkAgent()

Speech-to-Text: Whisper-based models

Vision AI: Multimodal evaluation models

Emotion Detection: Sentiment analysis from text/voice

Image Generation: DALL·E 3

AI Philosophy:
ShikshaSetu combines deterministic AI (for assessments) with generative AI (for explanations) and stateful agents (for interaction), ensuring both reliability and engagement.

6. AI / ML Pipeline Architecture
6.1 AI Content Generation Pipeline
const generateMutation = useMutation({
  mutationFn: async () => {
    const prompt = `Generate comprehensive study notes for ${board} Grade ${grade}...`;
    const result = await generateText({ 
      messages: [{ role: 'user', content: prompt }] 
    });
    return result;
  }
});


Explanation:
This pattern encapsulates prompt creation, AI invocation, and result handling. React Query manages loading, caching, retries, and errors, ensuring consistent and syllabus-aligned AI outputs.

6.2 Structured Quiz Generation
const QuizSchema = z.object({
  questions: z.array(z.object({
    question: z.string(),
    options: z.array(z.string()),
    correctAnswer: z.number(),
    explanation: z.string(),
  }))
});


Explanation:
Zod schemas act as AI output contracts, enforcing structured, machine-readable responses. This enables automatic grading, analytics, and reliable assessments.

6.3 Conversational AI Interview System
const { messages, sendMessage } = useRorkAgent({
  tools: {},
});


Explanation:
useRorkAgent() maintains conversational memory, enabling viva-style oral assessments with adaptive difficulty and human-like interaction.

6.4 Vision AI Exam Scanner
const scanMutation = useMutation({
  mutationFn: async () => {
    const prompt = `You are an AI exam paper evaluator...`;
    const result = await generateText({ 
      messages: [{ role: 'user', content: prompt }] 
    });
    return JSON.parse(cleanedResult);
  }
});


Explanation:
Vision AI evaluates handwritten responses contextually and returns structured grading data, reducing subjectivity and teacher workload.

6.5 Voice Assistant Pipeline
const processVoice = async (uri: string) => {
  // Stage 1: Speech-to-Text
  // Stage 2: Emotion Detection
  // Stage 3: Content Generation
};


Explanation:
A multi-stage pipeline preserves emotional context and adapts explanations accordingly, enabling emotion-aware pedagogy.

7. Environment Configuration & Security

No physical .env file is used

Environment variables are injected securely at runtime via the Rork platform

process.env.EXPO_PUBLIC_RORK_API_BASE_URL


Benefits:

No credential leakage

Cross-platform compatibility

Cloud-native, production-ready security

8. Setup & Run Instructions (Brief)
Prerequisites

Node.js (v18 or later)

npm or yarn

Expo CLI

Internet connection (for AI services)

Steps to Run the Project

Install dependencies

npm install


Start the Expo development server

npx expo start


Run on device or emulator

Scan QR code using Expo Go (Android/iOS), or

Press w to run on web, a for Android emulator

Backend & AI Services

Backend APIs, database (SurrealDB), and AI services are pre-configured via the Rork platform

No manual environment setup is required

All credentials are injected securely at runtime

9. Key Outcomes

ShikshaSetu demonstrates:

Deterministic AI control using schemas

Stateful conversational intelligence

Multimodal AI (text, voice, vision)

Strong type safety across the stack

Production-ready security practices

Pedagogically grounded AI design

10.Implemented features
1. Curriculum-Aware Multilingual Content Generation
What is implemented?

AI generates study notes, explanations, and summaries in 10 Indian languages

Content is generated per board (NCERT / ICSE) and per grade (6–10)

Technical mechanism:

Dynamic prompt construction injects:

board

grade

subject

language

AI generation is invoked using generateText() inside controlled mutations

Why this matters?

Most AI tools translate English explanations.
ShikshaSetu generates natively in the target language, preserving:

Conceptual clarity

Cultural context

Grade-appropriate vocabulary

2. Language-First AI Prompt Engineering (Not Translation-First)
What is implemented

Prompts explicitly instruct the AI to:

Think and respond in the selected Indian language

Avoid English sentence structures

Use locally understandable terminology

Technical mechanism

Language preference is injected before AI generation

Not applied as a post-processing translation step

Why this matters

Translation pipelines:

Preserve English cognitive bias

Increase hallucination risk

Break pedagogical flow

ShikshaSetu avoids this by language-native generation.

3. Type-Safe Multilingual Output Enforcement
What is implemented

Zod schemas enforce structure on AI output across all languages

z.object({
  question: z.string(),
  explanation: z.string()
})

Technical mechanism

AI output is validated after generation

Invalid or malformed responses are rejected

Why this matters

Multilingual AI often fails due to:

Mixed scripts

Partial translations

Structural inconsistency

Schemas ensure language independence with structural consistency.

4. Multilingual Quiz & Assessment Generation
What is implemented

Quizzes are generated directly in the learner’s language

Options, explanations, and feedback are all localized

Technical mechanism

Structured quiz generation via generateObject()

Language parameter embedded in schema-driven AI calls

Why this matters

Most platforms:

Teach in local language

Assess in English

ShikshaSetu ensures learning and evaluation happen in the same language, eliminating cognitive switching.

5. Multilingual Conversational AI (Viva / Oral Exams)
What is implemented

AI interview system supports regional-language conversations

Maintains context across turns

Technical mechanism

useRorkAgent() stores:

Conversation history

Language preference

Difficulty progression

Why this matters

Rural learners struggle with:

Oral exams conducted in English

Concept explanation under language pressure

ShikshaSetu enables native-language viva assessments.

6. Emotion-Aware Language Adaptation (Voice Input)
What is implemented

Voice-based input supports regional accents

Emotional cues influence explanation complexity

Technical mechanism

Speech-to-Text → Emotion Detection → Content Generation pipeline

Language maintained throughout the pipeline

Why this matters

Language crisis is not only linguistic — it is emotional.
This feature:

Detects confusion or hesitation

Simplifies explanations in the same language

Improves learner confidence

7. Multilingual Exam Evaluation (Vision + Language)
What is implemented

Handwritten answers in regional languages are evaluated

Feedback is returned in the same language

Technical mechanism

Vision AI interprets handwriting

AI evaluates semantics, not grammar

JSON-structured multilingual feedback

Why this matters

Traditional OCR fails on:

Regional scripts

Mixed-language answers

ShikshaSetu evaluates meaning, not spelling perfection.

8. Language-Persistent Learning Profiles
What is implemented

Each learner’s language preference is persistent

Language choice influences:

Notes

Quizzes

Interviews

Feedback

Technical mechanism

Language stored in Context + AsyncStorage

Injected into every AI interaction

Why this matters

Learners are not forced to:

Re-select language

Adapt to English defaults

The system adapts to the learner — not the reverse.

9. Teacher-Side Multilingual Content Support
What is implemented

Teachers can generate:

Lesson plans

Explanations

Assessment material
in multiple Indian languages

Technical mechanism

Same AI pipelines reused with teacher-specific prompts

Why this matters

Teachers often:

Teach in regional languages

Prepare content in English

ShikshaSetu removes this burden.

10. Multilingual Video Learning Integration
What is implemented

Curated video links aligned with:

Language

Subject

Grade

Technical mechanism

Video library mapped to language metadata

Accessed directly from the platform

Why this matters

Students reinforce AI-generated explanations using human-created content in their language.

11. Offline-First Multilingual Persistence
What is implemented

Generated content is cached locally

Language consistency maintained offline

Technical mechanism

AsyncStorage persistence

React Query cache hydration

Why this matters

Rural connectivity issues should not force:

Language fallback

Content loss

12. Language-Neutral System Design
What is implemented

No hardcoded English strings in AI logic

Language is always a parameter, never a default

Technical mechanism

Language injected at API boundary

UI and AI layers decoupled

Why this matters

This ensures future scalability to:

More Indian languages

Dialects

Code-mixed inputs
10. Conclusion

ShikshaSetu is a production-ready, education-first AI platform, designed to address real challenges in Indian classrooms.

By integrating multilingual NLP, structured AI outputs, adaptive learning, and secure cloud-native architecture, ShikshaSetu ensures that language and location are no longer barriers to quality education.

“When education speaks the learner’s language, understanding follows naturally.”
