# Pocket Storage - Backend

This is the backend part of the **Pocket Storage** project.

## Table of Contents
- [Getting Started](#getting-started)
- [Technologies Used](#technologies-used)
- [Environment Variables](#environment-variables)
- [API Documentation](#api-documentation)
- [Running the Project](#running-the-project)

## Getting Started
These instructions will help you set up and run the backend on your local machine for development and testing purposes.

### Prerequisites
Make sure you have the following installed on your local machine:
- [Node.js](https://nodejs.org/) (v18.x or higher)
- [npm](https://www.npmjs.com/)

## Technologies Used
- **Nest.js** - Framework for building efficient, scalable Node.js server-side applications.
- **TypeORM** - ORM for TypeScript and JavaScript (ES7, ES6, ES5).
- **PostgreSQL** - Database used for storing application data.
- **Swagger** - API documentation tool, accessible at `/api/docs`.

## Environment Variables
To run the application, you need to set the following environment variables:

- `JWT_SECRET`: Secret key for JWT authentication.
- `DB_HOST`: Hostname for the database.
- `DB_PORT`: Port number for the database.
- `DB_USERNAME`: Username for database access.
- `DB_PASSWORD`: Password for database access.
- `DB_NAME`: Name of the database.

Create a `.env` file in the root of the project and add the variables like this:

```env
JWT_SECRET=your_jwt_secret
DB_HOST=your_db_host
DB_PORT=your_db_port
DB_USERNAME=your_db_username
DB_PASSWORD=your_db_password
DB_NAME=your_db_name
```

## API Documentation
API documentation is available at /api/docs. You can view the API endpoints through Swagger UI.

## Running the Project
To install the dependencies, run:
```bash
npm install
```
To start the application, use:
```bash
npm run start
```

The backend will now be running locally on port 3001.

## License
This project is licensed under the MIT License.