# JobTracker

A full-stack MERN job application tracker with JWT authentication, Kanban pipeline, interview management, and analytics.

## Features

- **Authentication**: User registration, login, logout, JWT-based sessions, protected routes
- **Dashboard**: Application statistics, status distribution, upcoming interviews, recent applications, follow-up reminders
- **Application Management**: Full CRUD with company, job title, location, work type, salary, recruiter info, notes, tags, and more
- **Kanban Board**: Drag-and-drop pipeline with 10 status columns (Saved → Applied → Screening → Interview → Technical → Final → Offer → Accepted, plus Rejected and Withdrawn)
- **Application Details**: Complete view with timeline, notes, interviews, recruiter info, and documents
- **Interview Management**: Schedule interviews with type, date, interviewer, meeting link, prep notes, and results
- **Follow-up System**: Set follow-up dates, view upcoming and overdue follow-ups
- **Notes**: Add and delete notes per application
- **Statistics**: Applications by status, month, source, work type, conversion rates
- **Search & Filtering**: Backend-powered search, filter by status/work type/employment type, sort by multiple fields
- **Pagination**: Server-side pagination for large datasets
- **Responsive UI**: Works on desktop, laptop, tablet, and mobile

## Tech Stack

- **Frontend**: React 19, React Router 7, MUI 9, Axios, Vite
- **Backend**: Node.js, Express 5, MongoDB, Mongoose, JWT, bcryptjs
- **Database**: MongoDB

## Folder Structure

```
job_tracker/
├── backend/
│   ├── controlling/
│   │   ├── applicationController.js
│   │   └── userController.js
│   ├── database/
│   │   ├── application.js
│   │   └── user.js
│   ├── middleware/
│   │   └── auth.js
│   ├── routing/
│   │   ├── applicationRouting.js
│   │   └── userroute.js
│   ├── seed/
│   │   └── seed.js
│   ├── tests/
│   │   ├── application.test.js
│   │   └── auth.test.js
│   ├── utils/
│   │   └── constants.js
│   ├── .env.example
│   ├── package.json
│   └── server.js
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── ApplicationDetails.jsx
│   │   │   ├── ApplicationForm.jsx
│   │   │   ├── ApplicationsList.jsx
│   │   │   ├── Dashboard.jsx
│   │   │   ├── DashboardHome.jsx
│   │   │   ├── KanbanBoard.jsx
│   │   │   ├── Login.jsx
│   │   │   ├── Signup.jsx
│   │   │   └── Statistics.jsx
│   │   ├── api.js
│   │   ├── App.css
│   │   ├── App.jsx
│   │   └── main.jsx
│   ├── index.html
│   ├── package.json
│   └── vite.config.js
└── README.md
```

## Installation

### Prerequisites

- Node.js 18+
- MongoDB (local or Atlas)

### Backend

```bash
cd backend
npm install
```

Create a `.env` file (see `.env.example`):

```env
PORT=5000
MONGO_URL=mongodb://127.0.0.1:27017/jobtracker
SECRET=your-long-random-secret-here
CLIENT_URL=http://localhost:5173
```

### Frontend

```bash
cd frontend
npm install
```

## Running the Application

### Start Backend

```bash
cd backend
npm run dev
```

The API runs on `http://localhost:5000`.

### Start Frontend

```bash
cd frontend
npm run dev
```

The app runs on `http://localhost:5173`.

### Seed Demo Data

```bash
cd backend
npm run seed
```

This creates a demo user (`demo@jobtracker.com` / `demo1234`) with 30 sample applications.

## API Overview

### Authentication

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/user/register` | Create account |
| POST | `/user/login` | Login |
| GET | `/user/me` | Get current user |

### Applications

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/application` | List applications (with search/filter/sort/pagination) |
| POST | `/application` | Create application |
| GET | `/application/:id` | Get application details |
| PATCH | `/application/:id` | Update application |
| PATCH | `/application/:id/status` | Change status (for Kanban) |
| DELETE | `/application/:id` | Delete application |
| GET | `/application/statistics` | Get analytics |

### Notes

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/application/:id/notes` | Add note |
| DELETE | `/application/:id/notes/:noteId` | Delete note |

### Interviews

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/application/:id/interviews` | Add interview |
| PATCH | `/application/:id/interviews/:interviewId` | Update interview |
| DELETE | `/application/:id/interviews/:interviewId` | Delete interview |

All application routes require a `Bearer` token in the `Authorization` header.

## Authentication Flow

1. User registers or logs in
2. Server returns a JWT token
3. Frontend stores token in `localStorage`
4. Axios interceptor attaches token to every request
5. Server validates token on protected routes
6. On 401, frontend redirects to login

## Build

### Frontend Production Build

```bash
cd frontend
npm run build
```

Output is in `frontend/dist/`.

### Backend Production Start

```bash
cd backend
npm start
```

## Testing

```bash
cd backend
npm test
```

Tests cover authentication, CRUD operations, and user isolation.

## Environment Variables

| Variable | Description |
|----------|-------------|
| `PORT` | Server port (default: 5000) |
| `MONGO_URL` | MongoDB connection string |
| `SECRET` | JWT signing secret |
| `CLIENT_URL` | Allowed CORS origin |
| `VITE_API_URL` | Frontend API base URL (frontend only) |

## Known Limitations

- No file upload for resumes/cover letters (tracked by filename only)
- No email notifications
- No real-time updates (polling-based)
- Single-user mode (no team features)
