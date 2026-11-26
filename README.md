# MentorMind -- The AI That Teaches Like a Human

**An AI-powered personalized learning and tutoring system**

MentorMind is an academic project developed as part of the Master of
Computer Applications programme at the National Institute of Technology,
Tiruchirappalli. It brings document-based question answering, AI
tutoring, quiz generation and evaluation, learning progress tracking,
and study planning together in one platform.

The system uses Retrieval-Augmented Generation (RAG) to answer questions
using content retrieved from students' uploaded PDF study materials.

------------------------------------------------------------------------

## Table of Contents

-   [Project Overview](#project-overview)
-   [Key Features](#key-features)
-   [Technology Stack](#technology-stack)
-   [System Architecture](#system-architecture)
-   [RAG Workflow](#rag-workflow)
-   [Application Modules](#application-modules)
-   [Database Design](#database-design)
-   [Running the Project Locally](#running-the-project-locally)
-   [Environment Configuration](#environment-configuration)
-   [API Documentation](#api-documentation)
-   [Testing](#testing)
-   [Project Limitations](#project-limitations)
-   [Future Enhancements](#future-enhancements)
-   [Project Information](#project-information)

------------------------------------------------------------------------

## Project Overview

Students often need to search through lengthy study materials, clarify
academic doubts, practise concepts, and organize their study schedules.
These activities may require switching between multiple tools.

MentorMind aims to bring these learning activities into one application.
Students can upload PDF materials, ask questions, receive AI-generated
explanations, practise through quizzes, review learning-related
information, and manage study tasks.

The RAG-based question-answering workflow retrieves relevant content
from uploaded documents and supplies it as context to an AI service
before a response is generated.

## Key Features

### 1. User Authentication

-   User registration and login.
-   Access to the application's learning features.

### 2. Document Management

-   Upload PDF study materials.
-   View uploaded documents.
-   Process document text for retrieval.

### 3. AI Tutor

-   Ask academic questions through a chat interface.
-   Retrieve relevant content from uploaded study documents.
-   Generate responses using retrieved context and an AI service.

### 4. Quiz Generation and Evaluation

-   Generate practice quizzes using selected study material or topics.
-   Choose quiz settings such as difficulty and number of questions.
-   Submit answers and view evaluation results and feedback.

### 5. Learning Progress

-   View learning-related activity and progress information through the
    dashboard.

### 6. Study Planner and Study Tasks

-   Generate and view study plans.
-   Add and manage study tasks.
-   Mark tasks as completed.
-   Delete tasks.
-   Retain task information through database persistence.

### 7. Study Sessions

-   Access the study session functionality provided in the application.

------------------------------------------------------------------------

## Technology Stack

  -----------------------------------------------------------------------
  Component               Technology              Purpose
  ----------------------- ----------------------- -----------------------
  Frontend                React.js                User interface

  Backend                 Python, FastAPI         Application logic and
                                                  REST APIs

  Application database    MongoDB Atlas           User and
                                                  learning-related
                                                  application data

  Vector database         ChromaDB                Storage and retrieval
                                                  of document embeddings

  Embedding model         Sentence Transformers   Convert text into
                                                  vector embeddings

  AI services             Google Gemini, Groq     AI-powered responses
                                                  and learning features

  Frontend runtime and    Node.js, npm            Frontend dependency
  package manager                                 management and
                                                  development

  Development environment Visual Studio Code      Application development

  Version control         Git, GitHub             Source code management
  -----------------------------------------------------------------------

------------------------------------------------------------------------

## System Architecture

MentorMind follows a frontend-backend architecture.

1.  **Frontend -- React.js:** Provides the interface used by students to
    access the application's features.
2.  **Backend -- FastAPI:** Receives frontend requests, performs
    application operations, processes documents, and communicates with
    databases and AI services.
3.  **MongoDB Atlas:** Stores application-related records.
4.  **ChromaDB:** Stores document chunks and their vector embeddings for
    similarity-based retrieval.
5.  **Sentence Transformers:** Generates embeddings for document chunks
    and user queries.
6.  **AI Services -- Gemini and Groq:** Support AI-powered question
    answering and other learning features.

The frontend communicates with the backend through REST API endpoints.

------------------------------------------------------------------------

## RAG Workflow

MentorMind uses Retrieval-Augmented Generation to provide responses
grounded in uploaded study materials.

### Document Ingestion

1.  The student uploads a PDF document.
2.  The backend extracts text from the PDF.
3.  The extracted text is divided into smaller chunks.
4.  Sentence Transformers generates an embedding for each chunk.
5.  The chunks and embeddings are stored in ChromaDB.

### Question Answering

1.  The student submits a question through the AI Tutor.
2.  The backend generates an embedding for the question.
3.  ChromaDB performs a similarity search to find relevant document
    chunks.
4.  The retrieved chunks are prepared as context.
5.  The question and retrieved context are sent to the configured AI
    service.
6.  The generated response is returned to the frontend and displayed to
    the student.

``` text
                 DOCUMENT INGESTION

       PDF Upload
            |
            v
      Text Extraction
            |
            v
       Text Chunking
            |
            v
  Sentence Transformers
    (Embedding Generation)
            |
            v
         ChromaDB
   (Chunks + Embeddings)


              QUESTION ANSWERING

       Student Question
            |
            v
     Query Embedding
            |
            v
   ChromaDB Similarity Search
            |
            v
   Relevant Document Chunks
            |
            v
    Question + Retrieved Context
            |
            v
       AI Service
     (Gemini / Groq)
            |
            v
     Generated Response
            |
            v
        Student
```

------------------------------------------------------------------------

## Application Modules

  -----------------------------------------------------------------------
  Module                              Responsibility
  ----------------------------------- -----------------------------------
  User Authentication                 Registration and login

  Document Management                 PDF upload and processing

  AI Tutor                            Document-based question answering

  Quiz                                Quiz generation and evaluation

  Learning Progress                   Maintain and present learning
                                      activity information

  Study Planner                       Manage study plans, tasks, and
                                      schedules

  Analytics                           Present learning-related
                                      information

  Study Sessions                      Support study-session functionality
  -----------------------------------------------------------------------

------------------------------------------------------------------------

## Database Design

MentorMind uses MongoDB Atlas and ChromaDB for different storage
requirements.

### MongoDB Atlas

The application uses the following MongoDB collections:

  Collection            Purpose
  --------------------- -------------------------------
  `users`               User information
  `conversations`       Conversation records
  `messages`            Chat messages
  `quizzes`             Quiz-related records
  `learning_progress`   Learning progress information
  `student_memory`      Student-related memory data
  `study_sessions`      Study session records
  `study_tasks`         Study task information

### ChromaDB

ChromaDB is used as the vector database. It stores document chunks and
their embeddings and supports similarity searches for the RAG pipeline.

------------------------------------------------------------------------

## Running the Project Locally

The project is developed and tested in a local development environment.
The exact commands for starting the services depend on the entry-point
files and scripts in the checked-out source code.

### Prerequisites

Install or configure the following:

-   Python
-   Node.js and npm
-   MongoDB Atlas connection
-   Required AI service API credentials
-   Visual Studio Code or another code editor
-   Git

### Get the Source Code

Clone the project repository:

``` bash
git clone <YOUR_GITHUB_REPOSITORY_URL>
cd <PROJECT_DIRECTORY>
```

Replace the placeholders with the actual repository URL and directory
name.

### Backend Setup

1.  Open a terminal in the backend project directory.
2.  Create and activate a Python virtual environment.
3.  Install the dependencies listed in the backend dependency file (if
    provided).
4.  Configure the required environment variables.
5.  Start the FastAPI application using the actual application entry
    point in the project.

Example virtual environment commands:

**Windows:**

``` bash
python -m venv venv
venv\Scripts\activate
```

**macOS / Linux:**

``` bash
python3 -m venv venv
source venv/bin/activate
```

Install dependencies if the backend contains a `requirements.txt` file:

``` bash
pip install -r requirements.txt
```

Start the server using the module and application name defined by the
project. For example, if the entry point is `main.py` and the FastAPI
instance is named `app`:

``` bash
uvicorn main:app --reload
```

Adjust this command if the actual entry point is different.

### Frontend Setup

1.  Open another terminal in the frontend project directory.
2.  Install the Node.js dependencies.
3.  Start the development server using the script defined in
    `package.json`.

``` bash
npm install
npm run dev
```

If the project uses a different start script, use the corresponding
script from `package.json`.

### Connect the Services

-   Ensure the frontend API base URL points to the locally running
    FastAPI backend.
-   Ensure the backend has valid database connection settings and AI
    service credentials.
-   Start the backend and frontend in separate terminals.
-   Open the local frontend address printed by the development server.

------------------------------------------------------------------------

## Environment Configuration

The backend requires configuration for the services used by the
application. Check the project's existing configuration files and code
to identify the exact environment variable names.

Typical configuration categories include:

-   MongoDB Atlas connection string.
-   Google Gemini API credential.
-   Groq API credential.
-   Any application-specific settings required by the backend.

Create a local environment file only in the format expected by the
project. Do not commit real API keys, passwords, database credentials,
or other secrets to GitHub. Add local environment files to `.gitignore`.

------------------------------------------------------------------------

## API Documentation

The backend uses FastAPI to expose REST API endpoints.

When the backend is running locally, the interactive Swagger UI is
commonly available at:

``` text
http://127.0.0.1:8000/docs
```

The actual address and port may differ according to the backend
configuration.

The API groups cover areas such as authentication, document operations,
AI tutoring and RAG, quizzes, evaluation, analytics, progress, and study
planning.

------------------------------------------------------------------------

## Testing

The application was tested in a local development environment. Testing
covered the following areas:

-   User registration and login.
-   PDF upload and document text processing.
-   RAG-based question answering using uploaded study materials.
-   Quiz generation and answer evaluation.
-   Learning progress information.
-   Study task creation, completion, deletion, and persistence after
    page refresh.
-   MongoDB data storage and ChromaDB document indexing.
-   Communication between the frontend and backend.

------------------------------------------------------------------------

## Project Limitations

-   Response quality depends on the relevance of retrieved document
    content and the capabilities of the configured AI services.
-   Document-based question answering depends on the readability and
    quality of uploaded PDF files.
-   AI-generated quizzes and evaluations may require further refinement
    for consistency and accuracy.
-   Personalization and learning analytics can be expanded further.

------------------------------------------------------------------------

## Future Enhancements

Potential future improvements include:

-   More advanced personalized learning recommendations.
-   Enhanced learning analytics and progress reports.
-   Multilingual interaction with the AI Tutor.
-   Support for additional document formats such as DOCX and PPTX.
-   More detailed and consistent answer evaluation.
-   Additional learning resources and practice activities.

------------------------------------------------------------------------

## Project Information

  Detail               Information
  -------------------- ---------------------------------------------------
  Project              MentorMind -- The AI That Teaches Like a Human
  Project type         MCA Academic Minor Project
  Programme            Master of Computer Applications
  Institution          National Institute of Technology, Tiruchirappalli
  Department           Department of Computer Applications
  Development status   Developed and tested locally

------------------------------------------------------------------------

## References

-   [React Documentation](https://react.dev/learn)
-   [FastAPI Documentation](https://fastapi.tiangolo.com/tutorial/)
-   [MongoDB Atlas Documentation](https://www.mongodb.com/docs/atlas/)
-   [ChromaDB Documentation](https://docs.trychroma.com/)
-   [Sentence Transformers Documentation](https://www.sbert.net/)
-   [Google Gemini API
    Documentation](https://ai.google.dev/gemini-api/docs)
-   [Groq API Documentation](https://console.groq.com/docs/quickstart)
-   [Python Documentation](https://docs.python.org/3/)
-   [Node.js Documentation](https://nodejs.org/docs/latest/api/)
-   Lewis et al., "Retrieval-Augmented Generation for
    Knowledge-Intensive NLP Tasks," NeurIPS, 2020.
    [arXiv:2005.11401](https://arxiv.org/abs/2005.11401)
-   [GitHub Documentation](https://docs.github.com/)

------------------------------------------------------------------------

**MentorMind -- The AI That Teaches Like a Human**
