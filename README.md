
# Uptoskills Intern Management & Workforce Tracking System

## Project Overview

The Uptoskills Intern Management & Workforce Tracking System is an enterprise-grade workforce operations platform designed to manage organizational hierarchy, intern activities, attendance tracking, performance evaluation, social media engagement tasks, proof verification workflows, notifications, audit logging, and analytics reporting within the Uptoskills ecosystem.

The platform provides centralized workforce management while maintaining strict role-based access control, hierarchy-driven authorization, attendance integrity, and operational transparency. The system supports multiple organizational roles and enables structured management of interns and leadership teams through a scalable and secure architecture.

---

## Organizational Hierarchy

The platform follows a hierarchical management structure:

- Admin
- Senior Team Lead
- Team Lead
- Captain
- Intern

Each role operates within defined permission boundaries and can access only the resources, users, and operational data permitted by the authorization model.

---

## Core Functional Modules

### 1. Authentication & Session Management
- Secure user authentication
- JWT-based access control
- Refresh token rotation
- Redis-backed session management
- Password security using Argon2

### 2. Authorization Architecture
- Role-Based Access Control (RBAC)
- Hierarchy validation
- Ownership validation
- Route-level access protection
- Permission-driven resource access

### 3. Workforce & Hierarchy Management
- User management
- Department management
- Team assignment management
- Reporting structure maintenance
- Organizational hierarchy mapping

### 4. Attendance Management System
- Daily attendance tracking
- Attendance history management
- Monthly attendance reporting
- Attendance analytics and insights

### 5. Performance & Rating System
- Performance evaluation workflows
- Rating management
- Performance history tracking
- Team productivity analysis

### 6. Social Media Task Management
- Campaign creation and assignment
- Task distribution workflows
- Activity tracking
- Completion monitoring

### 7. Proof Submission & Verification
- Screenshot and proof uploads
- Verification workflows
- Approval and rejection processes
- Proof status management

### 8. Notification System
- Task notifications
- Attendance reminders
- Rating notifications
- System announcements
- Operational alerts

### 9. Audit Logging System
- Authentication logs
- Activity tracking
- Role modification tracking
- Attendance audit logs
- Verification audit trails

### 10. Analytics & Reporting
- Attendance analytics
- Performance analytics
- Department-level insights
- Workforce productivity reporting
- Dashboard statistics

---

## Security Architecture

Security is a primary design objective of the platform and includes:

- JWT Authentication
- Refresh Token Rotation
- Session Security
- Role-Based Authorization
- Ownership Validation
- Hierarchy Validation
- SQL Injection Prevention
- XSS Protection
- CSRF Protection
- Input Validation using Zod
- Rate Limiting
- Audit Logging
- Secure API Access Controls

---

## Database Architecture

The system is built on PostgreSQL and consists of the following primary entities:

- Users
- Roles
- Departments
- Attendance
- Ratings
- Social Tasks
- Proof Submissions
- Notifications
- Audit Logs
- Sessions

The database design emphasizes scalability, relational integrity, reporting efficiency, and future extensibility.

---

## Technology Stack

### Backend
- Node.js
- TypeScript
- Fastify

### Database
- PostgreSQL
- pg Driver

### Cache & Session Layer
- Redis

### Validation
- Zod

### Logging
- Pino Logger

### Authentication & Security
- JWT
- Refresh Token Rotation
- Argon2

### File Management
- Fastify Multipart
- Cloudinary / S3 Compatible Storage

### Background Processing
- Node Cron

### Documentation
- Swagger / OpenAPI

---

## Architecture Approach

The system follows a **Modular Monolithic Enterprise Architecture**. Functionality is organized into domain-specific modules while maintaining a unified deployment model. This approach enables easier maintenance, scalability, code ownership, and future service extraction if required.

The architecture is designed to support future organizational growth, system integrations, advanced analytics, and enterprise-level operational requirements.

---

## Project Goals

The primary objectives of the platform are:

- Secure workforce management
- Structured hierarchy management
- Reliable attendance tracking
- Transparent performance evaluation
- Accountability through audit logging
- Scalable operational workflows
- Analytics-driven decision making
- Enterprise-grade security and maintainability

The platform is intended to function not merely as an internship tracking system but as a scalable workforce management solution capable of supporting long-term organizational operations and future ecosystem integrations.

---

## Getting Started

### Prerequisites
- Node.js (v18 or later)
- PostgreSQL (v14 or later)
- Redis (v6 or later)
- npm or yarn

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/rajat-wyrm/Skillnova.git
   cd Skillnova
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**  
   Create a `.env` file based on `.env.example` and configure your database, Redis, and JWT secrets.

4. **Run database migrations**
   ```bash
   npm run migrate
   ```

5. **Start the development server**
   ```bash
   npm run dev
   ```

6. **Access the API documentation**  
   Open `http://localhost:3000/api/docs` (Swagger UI)

---

## API Overview

All API endpoints are protected by JWT and RBAC. Example endpoints:

| Method | Endpoint                     | Description                     |
|--------|------------------------------|---------------------------------|
| POST   | /api/auth/login              | Authenticate user              |
| POST   | /api/auth/refresh            | Refresh access token           |
| GET    | /api/users                   | List users (admin only)        |
| POST   | /api/attendance              | Mark daily attendance          |
| GET    | /api/attendance/report       | Get attendance report          |
| POST   | /api/tasks                   | Create social task (TL+)       |
| POST   | /api/proofs                  | Submit proof of completion     |
| GET    | /api/analytics/dashboard     | Get dashboard statistics       |

Complete OpenAPI documentation is available at `/api/docs`.

---

## Contributing

We follow a structured contribution process:

1. Fork the repository.
2. Create a feature branch (`git checkout -b feature/your-feature`).
3. Commit your changes with conventional commit messages.
4. Push to your fork and open a Pull Request.
5. Ensure all tests pass and code coverage does not decrease.

Please read our [Code of Conduct](CODE_OF_CONDUCT.md) before contributing.

---

## License

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.

---

## Contact

- **Project Maintainer**: Rajat
- **GitHub**: [rajat-wyrm](https://github.com/rajat-wyrm)
- **Repository**: [https://github.com/rajat-wyrm/Skillnova](https://github.com/rajat-wyrm/Skillnova)

For security issues, please email directly (do not use the public issue tracker).

---

*Last updated: June 2026*
