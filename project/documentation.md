
# Project API Documentation

This documentation describes the API endpoints available in the project router for managing projects and project members.

## Base URL:
```
/project
```

---

### 1. **Create Project**
**Endpoint**: `/create`  
**Method**: `POST`  
**Description**: Creates a new project with the authenticated user as the project creator.

**Request Headers**:
- `Authorization: Bearer {token}` (required)

**Request Body**:
```json
{
  "name": "string",          // Project name (required)
  "description": "string",   // Project description (optional)
  "otherData": "..."         // Any other project-related data (optional)
}
```

**Response**:
- **201 Created**: Returns the created project data.
- **401 Unauthorized**: If the user is not authenticated.
- **500 Internal Server Error**: If there is an error during project creation.

**Example Response**:
```json
{
  "_id": "projectId",
  "name": "Project Name",
  "creator": "userId",
  "@type": "Project",
  ...
}
```

---

### 2. **Import Project from Manifest URL**
**Endpoint**: `/import?createFrom=url`  
**Method**: `POST`  
**Description**: Creates a new project from a specified manifest URL.

**Request Headers**:
- `Authorization: Bearer {token}` (required)

**Request Body**:
```json
{
  "url": "https://example.com/manifest.json" // Manifest URL (required)
}
```

**Query Parameters**:
- `createFrom`: Should be set to `url` `(createFrom is required)`.

**Response**:
- **201 Created**: Returns the imported project data.
- **400 Bad Request**: If `createFrom` is missing or incorrect, or if the manifest URL is invalid.
- **500 Internal Server Error**: If an error occurs during the import.

**Example Response**:
```json
{
  "_id": "projectId",
  "manifest": { ... },
  "createdBy": "userId"
}
```

---

### 3. **Get Project by ID**
**Endpoint**: `/:id`  
**Method**: `GET`  
**Description**: Retrieves a project by its ID, with permission checks for the requesting user.

**Request Headers**:
- `Authorization: Bearer {token}` (required)

**Path Parameters**:
- `id`: The unique project ID (required).

**Response**:
- **200 OK**: Returns the project data if the user has access.
- **401 Unauthorized**: If the user is not authenticated.
- **403 Forbidden**: If the user does not have permission to access the project.
- **404 Not Found**: If the project with the specified ID does not exist.

**Example Response**:
```json
{
  "_id": "projectId",
  "name": "Project Name",
  "creator":"creator ID",
  "description": "Project Description",
  "contributors": { "userID": {"displayName":"", "email":"", "roles":[...], "permissions":[...]}},
  ...
}
```

---

### 4. **Invite Member to Project**
**Endpoint**: `/:id/invite-member`  
**Method**: `POST`  
**Description**: Invites a user to a project by email and assigns them specific roles. Only users with sufficient permissions can invite members.

**Request Headers**:
- `Authorization: Bearer {token}` (required)

**Path Parameters**:
- `id`: The unique project ID (required).

**Request Body**:
```json
{
  "email": "user@example.com",  // Email of the user to invite (required)
  "roles": ["CONTRIBUTOR"]      // List of roles to assign (optional, default is CONTRIBUTOR)
}
```

**Response**:
- **200 OK**: If the user is successfully invited to the project.
- **400 Bad Request**: If the email is missing or invalid.
- **401 Unauthorized**: If the user is not authenticated.
- **403 Forbidden**: If the user does not have permission to invite members.
- **500 Internal Server Error**: If there is an error during the invitation process.

---

### 5. **Remove Member from Project**
**Endpoint**: `/:id/remove-member`  
**Method**: `POST`  
**Description**: Removes a member from a project. Only users with sufficient permissions can remove members.

**Request Headers**:
- `Authorization: Bearer {token}` (required)

**Path Parameters**:
- `id`: The unique project ID (required).

**Request Body**:
```json
{
  "userId": "userId" // ID of the user to remove (required)
}
```

**Response**:
- **204 No Content**: If the user is successfully removed from the project.
- **400 Bad Request**: If the `userId` OR `:id` is missing.
- **401 Unauthorized**: If the user is not authenticated.
- **403 Forbidden**: If the user does not have permission to remove members.
- **500 Internal Server Error**: If there is an error during the removal process.

---

### 6. **Improper Request Method Handler**
For all endpoints, if an improper HTTP method is used, the API will return:
- **405 Method Not Allowed**: "Improper request method. Use [POST/GET] instead."

---

This documentation covers the creation, import, retrieval, and member management for project resources. Each endpoint is protected by authentication and permission checks using Auth0 middleware.
