# CaseAce Frontend

A modern React frontend for the CaseAce Law Firm Management System.

## Features

- **Modern UI/UX**: Built with Tailwind CSS and Heroicons for a clean, professional interface
- **Responsive Design**: Works seamlessly on desktop, tablet, and mobile devices
- **Real-time Updates**: Integrated with Socket.io for live notifications and messaging
- **Authentication**: Secure JWT-based authentication with role-based access control
- **Dashboard**: Comprehensive analytics and statistics visualization
- **Case Management**: Full CRUD operations for legal cases
- **Document Management**: Upload, view, and manage legal documents with Google Drive integration
- **Task Management**: Assign and track tasks with status updates
- **Appointment Scheduling**: Create and manage appointments with attendee responses
- **CRM**: Manage clients and employees with detailed profiles

## Tech Stack

- **React 18**: Latest React with hooks and functional components
- **React Router 6**: Client-side routing
- **React Query**: Server state management and caching
- **Tailwind CSS**: Utility-first CSS framework
- **Heroicons**: Beautiful SVG icons
- **Axios**: HTTP client for API requests
- **Socket.io Client**: Real-time communication
- **React Hook Form**: Form handling and validation
- **React Hot Toast**: Toast notifications
- **React Dropzone**: File upload with drag & drop

## Getting Started

### Prerequisites

- Node.js 16+ 
- npm or yarn
- Backend server running on port 9000

### Installation

1. Navigate to the frontend directory:
```bash
cd frontend
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm start
```

The application will be available at `http://localhost:3000`

### Building for Production

```bash
npm run build
```

## Project Structure

```
src/
├── components/          # Reusable UI components
│   ├── Layout.js       # Main layout with sidebar and header
│   ├── Sidebar.js      # Navigation sidebar
│   ├── Header.js       # Top header with notifications
│   ├── CaseModal.js    # Case creation/editing modal
│   ├── DocumentModal.js # Document upload modal
│   └── ...
├── contexts/           # React contexts
│   └── AuthContext.js  # Authentication context
├── pages/              # Page components
│   ├── Login.js        # Login page
│   ├── Register.js     # Registration page
│   ├── Dashboard.js    # Dashboard with analytics
│   ├── Cases.js        # Case management
│   ├── Documents.js    # Document management
│   ├── Tasks.js        # Task management
│   ├── Appointments.js # Appointment scheduling
│   └── CRM.js          # User management
├── App.js              # Main app component with routing
└── index.js            # Application entry point
```

## Key Features

### Authentication
- JWT-based authentication with secure cookies
- Role-based access control (Admin, Partner, Associate, Paralegal, Client)
- Protected routes and automatic redirects

### Dashboard
- Real-time statistics and analytics
- Case status distribution charts
- User activity tracking
- Recent notifications

### Case Management
- Create, edit, and delete cases
- Assign team members with different roles
- Track case status, priority, and billing hours
- Search and filter cases

### Document Management
- Drag & drop PDF upload
- Google Drive integration
- Document categorization and metadata
- Access control and tracking

### Task Management
- Create and assign tasks
- Status tracking (Todo, In Progress, Done)
- Deadline management
- Acceptance criteria

### Appointment Scheduling
- Create appointments with multiple attendees
- Response tracking (Accepted, Declined, Pending)
- Calendar integration
- Location and time management

### CRM
- Client and employee management
- User profiles with contact information
- Role-based user lists
- Search and filter functionality

## API Integration

The frontend communicates with the backend API through:

- **Authentication**: `/auth/login`, `/auth/register`
- **Cases**: `/api/cases/*`
- **Documents**: `/api/documents/*`
- **Tasks**: `/api/tasks/*`
- **Appointments**: `/api/appointments/*`
- **CRM**: `/api/crm/*`
- **Statistics**: `/api/statistics/*`

## Environment Variables

Create a `.env` file in the frontend directory:

```env
REACT_APP_API_URL=http://localhost:9000
REACT_APP_SOCKET_URL=http://localhost:9000
```

## Contributing

1. Follow the existing code style and patterns
2. Use functional components with hooks
3. Implement proper error handling
4. Add loading states for better UX
5. Test thoroughly before submitting

## License

This project is part of the CaseAce Law Firm Management System. 