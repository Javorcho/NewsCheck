# NewsCheck Frontend

This is the frontend application for the NewsCheck project, a news verification and analysis platform.

## Features

- User authentication (login/register)
- News verification and analysis
- User feedback system
- Admin dashboard
- Responsive design with Tailwind CSS

## Prerequisites

- Node.js (v14 or higher)
- npm (v6 or higher)

## Setup

1. Install dependencies:
   ```bash
   npm install
   ```

2. Create a `.env` file in the root directory with the following variables:
   ```
   REACT_APP_API_URL=http://localhost:5000
   ```

3. Start the development server:
   ```bash
   npm start
   ```

The application will be available at `http://localhost:3000`.

## Development

- The application is built with React and TypeScript
- Styling is done with Tailwind CSS
- State management is handled through React Context
- Routing is managed with React Router
- API communication is done with Axios

## Project Structure

```
src/
  ├── components/     # React components
  ├── contexts/       # React contexts
  ├── services/       # API services
  ├── types/          # TypeScript types
  ├── App.tsx         # Main application component
  └── index.tsx       # Application entry point
```

## Available Scripts

- `npm start` - Runs the app in development mode
- `npm test` - Launches the test runner
- `npm run build` - Builds the app for production
- `npm run eject` - Ejects from Create React App

## Contributing

1. Create a new branch for your feature
2. Make your changes
3. Submit a pull request

## License

This project is licensed under the MIT License. 