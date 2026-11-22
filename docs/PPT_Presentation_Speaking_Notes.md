# CampusOne — Presentation Speaking Notes

This document contains individual speaking material for the three CampusOne team members, based on the six-slide Microsoft Innovate 2026 Round 1 submission in [`ppt/campusOne_round1_ppt.pdf`](ppt/campusOne_round1_ppt.pdf).

The scripts are written to be spoken naturally. Treat them as a guide rather than a word-for-word requirement. The submitted deck describes the prototype and planned next steps; keep that distinction clear when presenting.

## Suggested division of the six slides

| Slides | Speaker | Focus |
|---|---|---|
| 1–2 | Armaan Choudhary | Introduce CampusOne and the team |
| 3–4 | Abhay Chandra | Explain the problem, solution, and routing/orchestration |
| 5–6 | Kanishk Dhiman | Explain retrieval and infrastructure, impact, feasibility, and next steps |

Allow roughly 45–60 seconds per speaker. If the panel gives a shorter slot, use the short version under each speaker and keep the extra detail for questions.

---

## Armaan Choudhary — Frontend and Security

### Short speaking version

“Hello, we are Team Campus One, Team ID 35, and our idea is called ‘One Front Door for Everything.’ I’m Armaan Choudhary, and I work on the frontend and security.

CampusOne gives students one place to ask for help across campus services. They can describe their issue in ordinary language instead of first figuring out which department or portal to use. The web workspace is the student-facing entry point, while authentication and access controls help ensure that each user can access only their own conversations and information.

The goal is to make campus support easier to reach while keeping the experience understandable and secure. I’ll hand over to Abhay to explain how the system understands a request and routes it.”

### Expanded version and useful detail

“The main experience we are designing is deliberately simple: sign in, open one conversation, and ask a campus question. The student should not need to know whether Wi-Fi belongs to IT, a fee issue belongs to Finance, or a maintenance request belongs to Facilities before they can begin.

My area is the student-facing web experience and security. The frontend presents the conversation and makes the assistant’s response and supporting sources visible. Authentication establishes who is asking, and role and ownership checks are important because conversation history and support requests can contain personal information. The assistant should help a student with their own request, not reveal another student’s records.

The submitted proposal describes Microsoft Entra ID single sign-on as a next step. It is a planned integration, so we should not present it as already deployed. The same is true of connecting the prototype to a university-wide identity system.”

### Likely questions

**Why does the project need its own frontend?**  
The frontend gives students one consistent entry point and lets us show answers, citations, clarification questions, and handoff status in one flow. It does not replace the university’s existing systems.

**How do you protect student information?**  
Users authenticate, and server-side authorization must scope conversations and actions to the signed-in user and their role. A production deployment should also use the university identity provider, secure secret management, and the institution’s privacy and retention rules.

**Is Microsoft Entra ID already integrated?**  
No. It is listed in the submitted deck as a next-round plan. Describe the current prototype accurately and identify Entra ID as planned work.

---

## Abhay Chandra — AI Orchestration and Routing

### Short speaking version

“The problem we are addressing is fragmented campus support. Students may have to choose between separate portals or helpdesks, and they often do not know which office owns their issue. That leads to misrouted requests, repeated explanations, and delays. Generic chatbots create another problem: they can answer confidently without proving where a campus-specific claim came from.

CampusOne acts as one conversational front door. Its orchestration layer identifies the likely intent and campus domain, then sends the request to the appropriate specialist workflow. If the request is unclear, the assistant can ask a focused clarification. If it cannot resolve the issue safely, it can hand the request to a person with the conversation context.

This means the student does not have to route themselves. Kanishk will explain how the system retrieves supporting campus information for an answer.”

### Expanded version and useful detail

“A student might ask about a portal login, a fee payment, or a broken air conditioner without knowing which department to contact. Existing department-specific tools put that routing burden on the student. A general-purpose assistant may understand the words but still lack approved campus information and a reliable escalation path.

CampusOne separates deciding where a request belongs from answering it. The orchestration layer considers the request and its conversation context, then routes it to a registered domain such as IT, Finance, Facilities, Academics, or Administration. More than one domain can be relevant when a message contains separate actionable issues.

We do not want uncertainty to look like confidence. When the intent is ambiguous, the assistant should ask a short question that helps select the right path. When the request is unsupported or remains unresolved, it should offer human help rather than invent a policy answer. The handoff should retain useful context so the student does not need to explain the entire issue again.

The proposal describes LangGraph for orchestration and a Groq-hosted language model in the AI stack. The model helps interpret and compose responses, while routing policy and retrieved evidence constrain what the application does.”

### Likely questions

**What happens when a question could belong to two departments?**  
If it contains two distinct actionable requests, the system can route both. If it is genuinely unclear which department is intended, it should ask the student to clarify rather than silently guess.

**How do you reduce hallucinations?**  
Routing alone does not establish that an answer is true. Campus-specific answers should be grounded in approved retrieved material, show citations, and fall back to clarification or human support when evidence is insufficient.

**Why use orchestration instead of one prompt?**  
The workflow separates routing, domain-specific retrieval, answer generation, clarification, and handoff. That makes the behavior easier to constrain, inspect, and extend than relying on one unrestricted response step.

---

## Kanishk Dhiman — RAG Engine and Infrastructure

### Short speaking version

“After CampusOne identifies the right domain, it needs reliable campus information to answer. My area is the retrieval-augmented generation pipeline and infrastructure.

The system searches the relevant domain’s knowledge base for supporting material, then uses that evidence to prepare an answer with source and page citations. The purpose is to let a student check where a response came from. If the available material does not support an answer, the assistant should say so or offer a human handoff instead of filling the gap with a guess.

The prototype uses PostgreSQL with pgvector for stored knowledge and retrieval, alongside a FastAPI backend. The next steps in our submission are to broaden the approved knowledge base and prepare an Azure deployment. I’ll close with the impact we expect and how we plan to develop the prototype.”

### Expanded version and useful detail

“The retrieval pipeline is what connects the assistant’s language ability to institution-specific information. Documents are divided into searchable sections, represented for retrieval, and associated with metadata such as their source, department, and page. When a request is routed to a domain, CampusOne searches that domain’s material and supplies relevant passages to the answer step.

The answer should be traceable: citations point back to the source material, and the student can see the basis for a campus-specific claim. Keeping knowledge separated by domain also helps avoid answering a Finance question from an unrelated IT document. If retrieval finds no suitable evidence, the system should not treat the language model’s general knowledge as a substitute for university policy; it should explain the limitation or escalate.

The submitted technical approach names PostgreSQL and pgvector for data and vector search, Python and FastAPI for the backend, and LangChain/PyPDF for document processing. The proposal also describes Azure deployment and Azure OpenAI as planned next steps. The current prototype and the future deployment plan should be described separately.”

“The expected impact is faster access to routine support, fewer repetitive Tier-1 questions for staff, and answers that are easier to audit. Our next steps are to add comprehensive approved documents across campus domains, prepare enterprise deployment, and connect human escalation to institutional support tooling.”

### Likely questions

**What does RAG mean here?**  
Retrieval-augmented generation means the system searches relevant source material first and gives those passages to the language model as evidence for its response. The model generates the explanation; the institutional source remains the authority.

**What if the documents are missing or outdated?**  
The system should avoid presenting an unsupported answer as policy. The knowledge base needs approved, current documents and ownership; gaps should lead to a transparent no-answer or human escalation.

**Are Azure and Azure OpenAI already in production?**  
No. The Round 1 deck lists Azure deployment and Azure OpenAI as next steps. Present them as plans unless the deployment has since been completed and verified.

---

## Shared 20-second closing

“CampusOne brings campus support behind one conversational entry point. It routes requests to the right domain, grounds answers in campus information, and provides a path to a person when the system cannot resolve an issue. We want students to spend less time finding the right office and give support teams better-contextualized requests.”

## Delivery reminders

- Explain the student problem before naming frameworks or infrastructure.
- Expand acronyms the first time: retrieval-augmented generation (RAG), role-based access control (RBAC), and single sign-on (SSO).
- Say “the prototype supports” for implemented capabilities and “we plan to” for future integrations or deployment.
- Do not promise perfect routing, zero hallucinations, or production readiness. Explain the safeguards and remaining work instead.
- Use one concrete example if the panel asks for a demo: a student asks about Wi-Fi, CampusOne routes it to IT, retrieves the approved instructions, and returns an answer with its source.
