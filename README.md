# NorthCrest Bank of USA

A full-featured banking application with customer portal and administrative dashboard.

## Project Overview

NorthCrest Bank is a modern banking platform that provides comprehensive financial services to customers while giving administrators powerful tools to manage all banking operations.

## Project Structure

```
NorthCrestBankOfUSA/
├── admin/                      # Admin dashboard (this repository)
│   ├── src/
│   │   ├── assets/             # Static assets (images, styles)
│   │   ├── components/         # Reusable React components
│   │   ├── hooks/              # Custom React hooks
│   │   ├── layouts/            # Page layouts
│   │   ├── pages/              # Page components
│   │   ├── services/           # API integration
│   │   ├── store/              # Redux state management
│   │   ├── App.jsx
│   │   └── main.jsx
│   ├── index.html
│   ├── package.json
│   └── README.md
├── client/                     # Customer-facing banking portal
│   ├── src/
│   │   ├── components/
│   │   ├── layouts/
│   │   ├── pages/
│   │   ├── services/
│   │   ├── store/
│   │   ├── styles/
│   │   ├── App.jsx
│   │   └── main.jsx
│   └── ...
├── server/                     # Backend API server (if separated)
├── .env                        # Environment variables
├── .env.example
└── README.md                   # This file
```

## Application Components

### 1. Admin Panel (`/admin`)
The administrative dashboard for bank employees to manage all banking operations:
- User and account management
- KYC verification processing
- Transaction monitoring
- Loan and investment management
- Customer support ticket handling
- Analytics and reporting
- System configuration

### 2. Client Portal (`/client`)
The customer-facing banking application:
- Account overview and balance tracking
- Fund transfers and bill payments
- Loan applications and management
- Investment portfolio management
- Support ticket submission
- Profile management

## Technology Stack

### Frontend
- **React 18** - Modern React with hooks
- **Material-UI (MUI)** - Component library
- **Redux Toolkit** - State management
- **React Router v6** - Client-side routing
- **Axios** - HTTP client
- **Vite** - Build tool and dev server

### Common Features
- JWT-based authentication
- Responsive design for all devices
- Role-based access control
- Real-time updates
- Comprehensive error handling
- Modern, accessible UI

## Getting Started

### Admin Panel
```bash
cd admin
npm install
npm run dev
```
The admin server will start on `http://localhost:5174`

### Client Portal
```bash
cd client
npm install
npm run dev
```
The client server will start on `http://localhost:5173`

## Environment Variables

Create a `.env` file based on `.env.example` with the following variables:
- `VITE_API_URL` - Backend API URL
- `VITE_APP_NAME` - Application name
- Other environment-specific configurations

## Development Status

✅ **Completed**:
- All admin page components created
- Routing and navigation implemented
- Layout components with sidebar navigation
- Authentication protection
- Reusable component library
- Project structure properly organized

🔄 **In Progress**:
- Backend API integration
- Client portal enhancements
- Database setup
- Deployment configuration

## License

Private - All rights reserved.