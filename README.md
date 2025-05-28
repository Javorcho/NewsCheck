# NewsCheck API

A Flask-based REST API for news verification and analysis.

## Setup

1. Create a virtual environment:
```bash
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

2. Install dependencies:
```bash
pip install -r requirements.txt
```

3. Create a `.env` file with the following variables:
```
SECRET_KEY=your-secret-key-here
JWT_SECRET_KEY=your-jwt-secret-key
DATABASE_URL=sqlite:///newscheck.db
```

4. Initialize the database:
```bash
flask db init
flask db migrate
flask db upgrade
```

5. Run the development server:
```bash
python app.py
```

## API Endpoints

### Authentication

#### Register a new user
- **POST** `/api/auth/register`
```json
{
    "username": "string",
    "email": "string",
    "password": "string"
}
```

#### Login
- **POST** `/api/auth/login`
```json
{
    "username": "string",
    "password": "string"
}
```

#### Get user profile
- **GET** `/api/auth/profile`
- Requires: JWT token

#### Update user profile
- **PUT** `/api/auth/profile`
- Requires: JWT token
```json
{
    "email": "string",
    "password": "string"
}
```

### News Analysis

#### Submit news for analysis
- **POST** `/api/news/analyze`
- Requires: JWT token
```json
{
    "content": "string"  // URL or text content
}
```

#### Get user's news history
- **GET** `/api/news/history`
- Requires: JWT token
- Query params: `page`, `per_page`

#### Get news details
- **GET** `/api/news/<news_id>`
- Requires: JWT token

### Feedback

#### Submit feedback
- **POST** `/api/feedback/submit/<news_id>`
- Requires: JWT token
```json
{
    "agrees_with_analysis": boolean,
    "comment": "string"
}
```

#### Update feedback
- **PUT** `/api/feedback/<feedback_id>`
- Requires: JWT token
```json
{
    "agrees_with_analysis": boolean,
    "comment": "string"
}
```

#### Delete feedback
- **DELETE** `/api/feedback/<feedback_id>`
- Requires: JWT token

#### Get news feedback
- **GET** `/api/feedback/news/<news_id>`
- Requires: JWT token

### Admin Routes

#### List users
- **GET** `/api/admin/users`
- Requires: Admin JWT token
- Query params: `page`, `per_page`

#### Get user details
- **GET** `/api/admin/users/<user_id>`
- Requires: Admin JWT token

#### Block user
- **POST** `/api/admin/users/<user_id>/block`
- Requires: Admin JWT token
```json
{
    "duration_minutes": number,
    "reason": "string"
}
```

#### Unblock user
- **POST** `/api/admin/users/<user_id>/unblock`
- Requires: Admin JWT token

#### List news requests
- **GET** `/api/admin/news`
- Requires: Admin JWT token
- Query params: `page`, `per_page`

#### Delete news request
- **DELETE** `/api/admin/news/<news_id>`
- Requires: Admin JWT token

#### Get system stats
- **GET** `/api/admin/stats`
- Requires: Admin JWT token

## Security Features

- Password hashing using bcrypt
- JWT-based authentication
- Rate limiting for failed login attempts
- User blocking system
- Admin-only routes protection
- Input validation and sanitization

## Database Schema

The application uses SQLite with the following main tables:
- `users`: User accounts and authentication
- `news_requests`: News analysis requests and results
- `feedback`: User feedback on analysis results
- `failed_logins`: Failed login attempts tracking
- `blocked_users`: User blocking records

## Error Handling

All endpoints return appropriate HTTP status codes:
- 200: Success
- 201: Created
- 400: Bad Request
- 401: Unauthorized
- 403: Forbidden
- 404: Not Found
- 409: Conflict
- 500: Internal Server Error
