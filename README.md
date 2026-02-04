# Blog API

A RESTful API for a blog application with user authentication, posts, and comments.

## Features

- User registration and authentication (JWT)
- Create, read, update, and delete posts
- Create, read, update, and delete comments
- Protected routes (only authenticated users can create/edit/delete)
- Authorization (users can only edit/delete their own content)

## Technologies Used

- Node.js
- Express.js
- MongoDB (Mongoose)
- JWT for authentication
- bcrypt for password hashing

## Setup Instructions

### Prerequisites

- Node.js installed
- MongoDB Atlas account (or local MongoDB)

### Installation

1. Clone the repository
2. Install dependencies:

```bash
   npm install
```

3. Create a `.env` file with the following variables (see `.env.example` for template):

```
   MONGODB_URI=your_mongodb_connection_string
   JWT_SECRET=your_jwt_secret_key
   PORT=3000
```

4. Start the server:

```bash
   npm run dev
```

Server runs on `http://localhost:3000`

## API Endpoints

### Authentication

#### Register User

- **POST** `/users`
- **Body:**

```json
{
  "username": "string",
  "email": "string",
  "password": "string"
}
```

- **Response:** User object (without password)

#### Login

- **POST** `/login`
- **Body:**

```json
{
  "username": "string",
  "password": "string"
}
```

- **Response:** JWT token

### Posts

#### Create Post

- **POST** `/posts`
- **Authentication** JWT token
- **Body:**

```json
{
  "title": "string",
  "content": "string"
}
```

- **Response** "Post created successfully", Post Object

#### Get all Posts

- **GET** `/posts`
- **Response:**

```json
  {
    "posts": [Post objects],
    "pagination": {
      "currentPage": 1,
      "totalPages": 3,
      "totalPosts": 25,
      "postsPerPage": 10
    }
  }
```

- **Query Parameters (optional):**
  - `page` (default: 1)
  - `limit` (default: 10)

#### Get Post by ID

- **GET** `/posts/:id`
- **Response** Post Object

#### Update Post

- **PUT** `/posts/:id`
- **Authentication** JWT token
- **Body:**

```json
{
  "title": "string",
  "content": "string"
}
```

- **Response** "Post successfully updated", Post Object

#### Delete Post

- **DELETE** `/posts/:id`
- **Authentication** JWT token
- **Response** "post successfully deleted"

### Comments

#### Create Comment

- **POST** `/posts/:postId/comments`
- **Authentication** JWT token
- **Body**

```json
{
  "content": "string"
}
```

- **Response** "Comment", Comment Object

#### Get Comments by Post ID

- **GET** `/posts/:postId/comments`
- **Response:**

```json
  {
    "posts": [Comment objects],
    "pagination": {
      "currentPage": 1,
      "totalPages": 3,
      "totalPosts": 25,
      "postsPerPage": 10
    }
  }
```

- **Query Parameters (optional):**
  - `page` (default: 1)
  - `limit` (default: 10)

#### Update Comment

- **PUT** `/comments/:id`
- **Authentication** JWT token
- **Body**

```json
{
  "content": "string"
}
```

- **Response** "Comment successfully saved", Comment Object

#### Delete Comment

- **DELETE** `/comments/:id`
- **Authentication** JWT token
- **Response** "Comment successfully deleted"

## Example Responses

### Success Response (Post Created)

```json
{
  "message": "Post created successfully",
  "post": {
    "_id": "697cb32124e27a85a1553d30",
    "title": "My First Post",
    "content": "This is the content",
    "author": "697a25cf1db736f0635188e8",
    "createdAt": "2026-01-30T13:33:21.317Z",
    "updatedAt": "2026-01-30T13:33:21.317Z"
  }
}
```

### Error Response (Unauthorized)

```json
{
  "error": "Invalid token"
}
```

### Error Response (Not Found)

```json
{
  "error": "Post not found"
}
```

## Testing the API

Use Postman or any API client:

1. Register a user at `/users`
2. Login at `/login` to get your JWT token
3. Copy the token
4. For protected routes, add Authorization header:
   - Type: Bearer Token
   - Token: [paste your JWT]

## Notes

- Tokens expire after 24 hours
- Users can only edit/delete their own posts and comments
- All timestamps are in UTC
