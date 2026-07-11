# AI Usage Documentation

This document logs the participation of AI tools in building **CognitiveKB** and lists prompts, code origins, modifications, and validation methods.

---

## 1. AI Tools Utilized

- **Antigravity AI (Google DeepMind Team)**: Used as the primary pair-programmer to design database models, implement Express REST routes, build RAG prompt context logic, develop frontend dashboard layout, and verify compilation configs.

---

## 2. Interaction Workflow & Prompts

The system was developed iteratively through structured pair programming. Example prompt instructions included:
- *"Create a Mongoose document schema that holds the owner, timestamp, extracted text content, and metadata stats (pages, word count)."*
- *"Implement a RAG prompt for Gemini that feeds in the extracted context of documents and instructs the model to answer the user's question with markdown formatting."*
- *"Design a responsive React layout with collapsible sidebars, glowing dashboard charts, custom file drag zones, and animated skeletons."*

---

## 3. Code Generation and Adaptations

### Completely AI-Generated:
- **Authentication Routes & Controller**: Model validation, bcrypt password hashing, and token signing.
- **RAG Chat Logic**: The logic that merges user text files into context strings and passes them to the Gemini API (`@google/generative-ai` SDK).
- **Docker Integration**: Dockerfiles and Docker Compose files.

### Modified and Custom-Written:
- **Nginx Config for Vite SPAs**: Customized the fallback routing rule (`try_files $uri $uri/ /index.html`) to ensure page refreshes inside React Router routes do not throw 404s.
- **Custom Markdown Parser**: Hand-crafted a custom React Markdown renderer instead of relying on external npm libraries to ensure smooth Vite builds without type conflicts.

---

## 4. Issues Encountered & Rectified

- **Multer Memory Storage**: Originally, standard disk storage was considered. However, this required cleanup scripts to delete files after processing. The design was refactored to use `multer.memoryStorage()`, which keeps the files in buffer memory, parses them, saves the text, and frees up system memory instantly.
- **TypeScript Window Property Declares**: Resolved window navigation redirects by avoiding ad-hoc global extensions and instead using standard `window.location` references in Axios interceptors.

---

## 5. Correctness Verification
- Compiling code using `tsc` to verify typescript safety checks.
- Executing integration test suites inside `/backend`.
- Starting and verifying Docker containers via `docker-compose`.
