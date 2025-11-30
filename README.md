# 🚀 Flow Execution System – React Flow + NestJS Backend

This project is a full-stack flow-execution system that allows users to design, execute, and visualize data-processing flows.

It integrates:

- **React Flow** (Frontend: visual flow editor)
- **NestJS + WebSocket** (Backend: real-time flow engine)
- **Custom Engine** (Script, Condition, AI, Output nodes)
- **Gemini API integration** (AI node execution)

---

## 🌟 Project Overview

### Node Types
| Node Type | Description |
|-----------|-------------|
| **Start Node** | Provides initial input data for the flow |
| **Script Node** | Executes custom JavaScript and returns an object |
| **Conditional Node** | Evaluates a condition and selects `true` or `false` branch |
| **AI Node** | Uses Gemini AI to generate text and attach it to the data |
| **Output Node** | Ends the flow and returns the final processed result |

### Flow Execution
The backend engine (`engine.ts`) handles:
- Step-by-step node execution  
- Branching logic  
- Error handling  
- Real-time WebSocket events:  
  - `run:started`  
  - `node:started`  
  - `node:succeeded`  
  - `node:failed`  
  - `run:finished`


```bash
⚙️ Backend Setup (NestJS)
1️⃣ Install dependencies
cd server
npm install
2️⃣ Create a .env file
Backend requires two environment variables:

DATABASE_URL=
GEMINI_API_KEY=

DATABASE_URL — PostgreSQL connection string
GEMINI_API_KEY — used by the AI Node (Gemini)

3️⃣ Start backend
npm run start


🎨 Frontend Setup (React Flow Editor)
1️⃣ Install dependencies
cd client
npm install

2️⃣ Start development server
npm run dev




