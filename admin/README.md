# NorthCrest Bank Admin Panel

This is the administrative dashboard for NorthCrest Bank of USA, built with React, Material-UI, and Redux.

## Project Structure

```
admin/
├── src/
│   ├── assets/             # Static assets
│   │   ├── images/         # Images, logos, and graphics
│   │   └── styles/         # Global styles and CSS files
│   ├── components/         # Reusable React components
│   │   ├── DataTable.jsx   # Generic data table component
│   │   ├── LoadingSpinner.jsx
│   │   ├── ProtectedRoute.jsx  # Route protection component
│   │   └── StatCard.jsx    # Statistics card component
│   ├── hooks/              # Custom React hooks
│   │   ├── useAuth.jsx     # Authentication hook
│   │   └── useTransactions.jsx
│   ├── layouts/            # Page layout components
│   │   ├── AuthLayout.jsx  # Layout for auth pages (login)
│   │   └── DashboardLayout.jsx  # Main dashboard layout with sidebar
│   ├── pages/              # Page components for each route
│   │   ├── Accounts.jsx
│   │   ├── AuditLogs.jsx
│   │   ├── Dashboard.jsx
│   │   ├── Investments.jsx
│   │   ├── KYCReview.jsx
│   │   ├── Loans.jsx
│   │   ├── Login.jsx
│   │   ├── Reports.jsx
│   │   ├── Settings.jsx
│   │   ├── SupportTickets.jsx
│   │   ├── Transactions.jsx
│   │   ├── Transfers.jsx
│   │   └── Users.jsx
│   ├── services/           # API service layer
│   │   └── api.js          # Axios configuration and API calls
│   ├── store/              # Redux store configuration
│   │   ├── slices/         # Redux slices
│   │   │   └── authSlice.js
│   │   └── store.js
│   ├── App.jsx             # Main app component with routing
│   └── main.jsx            # Application entry point
├── index.html
├── package.json
└── README.md
```

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build

## Features

- **User Management**: View and manage bank customers
- **KYC Review**: Process and approve customer verification documents
- **Account Management**: Monitor and manage all bank accounts
- **Transaction Monitoring**: View and track all financial transactions
- **Loan Management**: Review and process loan applications
- **Investment Tracking**: Monitor customer investment portfolios
- **Support Tickets**: Handle customer support requests
- **Reports & Analytics**: Generate comprehensive reports
- **Audit Logs**: Track all administrative actions
- **System Settings**: Configure bank parameters and settings