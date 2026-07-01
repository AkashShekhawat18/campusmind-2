# Real Data Policy (CRITICAL)

This project must never use fabricated content.

- Do NOT generate fake scenarios, fake analytics, fake users, fake statistics, fake conversations, fake question papers, fake resources, fake research papers, fake courses, fake notifications, fake chat history, fake uploads, fake activity feeds, fake dashboards, fake graphs, fake percentages, fake dates, fake teacher names, fake student names, fake announcements, or placeholder educational content.
- The application should always represent the true state of the database.
- If the database is empty, the UI must gracefully display professional empty states (e.g. "No chats yet. Start your first conversation with Campus GPT.")
- Do not invent demo conversations or AI responses.
- Do not automatically create sample PDFs or question papers.
- Do not generate fake similarity percentages. Similarity analysis should only appear after real question papers have been uploaded and processed.
- Campus GPT should only answer using User input, Uploaded files, RAG-retrieved knowledge, Conversation memory, and the connected language model.
- The AI must never claim to have analyzed a file that has not been uploaded. If a user asks about a document that is unavailable, clearly state that the required document is not available instead of fabricating an answer.
- Every dashboard widget, chart, progress bar, table, notification, activity feed, and analytics panel must be connected to backend APIs and the PostgreSQL/SQLite database.
- If there is no data, render an elegant empty state instead of placeholder values.
- The frontend must never contain hardcoded arrays or mock JSON representing production data.
- All displayed information must originate from PostgreSQL/SQLite, uploaded documents, Vector database (RAG), Backend API responses, or user interactions.
- The final application should behave like a real production SaaS platform from the first login, even if the database is initially empty.
