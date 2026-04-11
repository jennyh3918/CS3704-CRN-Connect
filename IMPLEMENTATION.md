## 1. Features Implemented

*   A  signup and login system using Supabase Auth, that requires `@vt.edu` email addresses.
*   A home  page displaying joined classes.
*   The ability to join rooms by CRN and leave them.
*   Real time messaging and updates using Socket.IO.
*   All messages, reactions, and attachments are stored in a PostgreSQL database which is managed by Prisma ORM.
*   Support for threaded replies, emoji reactions, and file attachments (PDFs, Images, etc.).
*   Real-time online status indicators for all students currently in a specific class roster.
*   A well designed interface built with Tailwind CSS v4, focusing on readability.

## 2. Explanation of Generated Code
Google Gemini was used to create the architecture core architecture and implement core logic:
*   **Backend (Node.js/Express):** Gemini generated the Express server structure, middleware for Supabase JWT verification, and RESTful API routes for room and message management.
*   **Database (Prisma/PostgreSQL):** Gemini created the relational schema (Users, Rooms, Messages, Junction Tables).
*   **Frontend (React/TypeScript):** Gemini created the functional components for the Dashboard and Chat views, managed global state with React Context, and handled real-time event listeners for Socket.IO.

The generated code met our expectations for functionality and performance. The real-time messaging using Socket.io worked as intended and is smooth. The UI needed refinement as the initial output was too similar to existing chat apps like Discord. There were also some small UI changed needed like making the message box smaller or tweaking the general layout of the site.

## 3. AI Tools Used
*   Google gemini was used to write and generate the architecture of the project. We each used it to implement the specific tasks assigned to us. We used Gemini to allow us to accelerate our development and allow us to focus on implementing more features and making the app more usable. We want to be able to focus on what features we can add and refining what Gemini generated.

## 4. Prompt and Code Modifications

*   The initial prompt resulted in a sidebar like Discord. We refined our prompt to ask for a Dashboard layout with cards.
*   The initial chat box was too large and bulky. We had to prompt for a reduction in size to make it properly fit.
*   We added logic to the AI-generated signup function to strictly check the email string for the `@vt.edu` suffix before authenticating with Supabase.

## 5. AI Usage Labeling
All files generated or significantly modified by the AI contain a comment at the top:
`// Created by Google Gemini` or `/* Created by Google Gemini */`.

## 6. AI Prompt Log

### **Lois:**
*   "I want to start a backend for a chat app for my college classes. Can you set up a basic Node.js and Express server? Also, I need a database schema for users, chat rooms (using CRN numbers), and messages. Use PostgreSQL and Prisma."
*   "I'm getting a Prisma error P1012 saying the url property is no longer supported in schema files. I'm using Prisma 7"

### **Nathan:**
*   "How do I add login and signup to my React app using Supabase? I want separate pages for them. I also need the backend to check if the user is logged in."
*   "Where do I find my Supabase URL and keys in the dashboard? 
*   Should I use the 'publishable' or 'secret' key for my frontend?"
*   "This is for Virginia Tech students so make sure the signup page requires a '@vt.edu' email."

### **Antonio:**
*   "I need a home page for my app where students can see all the classes they've joined. Can you make it look like a list? Also I want to be able to change the color or leave the class if they want."
*   "Can you make it show the most recent message in the card or something about the latest activity"
*   "The list looks too much like Discord. Can you change the home page to be a Dashboard with a grid of cards for each class?"

### **Appiah**
*   "Can you build a clean, modern chat page for my React app? It should be full-screen with a member list on the side and a button to go back to the dashboard. Make sure messages show up instantly using socket.io."
*   "Im getting a Syntax Error in my AuthContext when I try to import User from the supabase library saying im not providing an export named User."

### **Jenny**
*   "I need to handle file uploads in my Express backend and show them in my React chat. Also can you set up Tailwind CSS for the whole project? Ill also need a file to keep track of my data types."
*   "Im getting a Vite error saying tailwindcss has moved to a separate PostCSS package"
*   "The typing box in the chat is way too huge and bulky can you make the chat input much smaller and more compact"

