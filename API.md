# TPEN Services API Documentation

This document provides an overview of the available routes in the TPEN Services API. These routes allow interaction with the application for various functionalities.

## Base URL

```
https://api.t-pen.org

<development> https://dev.api.t-pen.org
```

## Endpoints

### 1. **Authentication**

Endpoints marked with a 🔐 requiring authentication expect a valid JWT token in the `Authorization` header.

---

### 2. **Project**

#### `POST /project/create` 🔐

- **Description**: Create a new project. This is a high-skill maneuver requiring a complete project object.
- **Request Body**:

    ```json
    {
        "label": "string",
        "metadata": [ { Metadata } ],
        "layers": [ { Layer } ],
        "manifests": [ "URIs<Manifest>" ],
        "creator": "URI<Agent>",
        "group": "hexstring"
    }
    ```

- **Responses**:

    - **200**: Project created successfully
    - **400**: Project creation failed, validation errors
    - **401**: Unauthorized
    - **500**: Server error

    The Location header of a successful response is the Project id.

#### `POST /import?createFrom="URL"` 🔐

- **Description**: Create a new project by importing a web resource.
- **Request Body**:

    ```json
    {
        "url": "URL<IIIF:Manifest>"
    }
    ```

- **Responses**:

    - **200**: Project created successfully
    - **400**: Project creation failed, validation errors
    - **401**: Unauthorized
    - **500**: Server error

    The Location header of a successful response is the Project id. The project will be created with the label and metadata of the imported resource. A complete project object will be created with the imported resource as the first manifest and returned.

#### `GET /project/:id` 🔐

- **Description**: Retrieve a project by ID.
- **Parameters**:
  - `id`: ID of the project.
- **Responses**:

    - **200**: Project found
        ```json
        {
            "id": "string",
            "label": "string",
            "metadata": [ { Metadata } ],
            "creator": "URI<Agent>",
            "layers": [ { Layer } ],
            "manifests": [ "URIs<Manifest>" ],
            "group": "hexstring",
            "tools": [ "string" ],
            "options": { OptionsMap }
        }
        ```
    - **404**: Project not found
    - **401**: Unauthorized
    - **403**: Forbidden
    - **500**: Server error

The response is not a complete Project data object, but a projection designed for use in the client interface.

---

### 3. **Contributors**

#### `POST /project/:projectId/invite-member` 🔐

- **Description**: Invite a user to a project. If the user does not have a TPEN account, they will be sent an email invitation.
- **Parameters**:
  - `projectId`: ID of the project as a hexstring or the Project slug.
- **Request Body**:

    ```json
    {
        "email": "string",
        "roles": ["string"] | "string"
    }
    ```

    - `email`: The email address of the user to invite.
    - `roles`: The roles of the user in the project as an array or space-delimited string.
- **Responses**:

    - **200**: User invited successfully
    - **400**: User invitation failed, validation errors
    - **401**: Unauthorized
    - **403**: Forbidden
    - **500**: Server error

This API is not able to track the status of the invitation. Email addresses that fail to be delivered or are rejected by the recipient will not be reported.

#### `POST /project/:projectId/remove-member` 🔐

- **Description**: Remove a user from a project group.
- **Parameters**:
  - `projectId`: ID of the project.
- **Request Body**:

    ```json
    {
        "userID": "string"
    }
    ```
- **Responses**:

    - **204**: User removed successfully
    - **401**: Unauthorized
    - **403**: Forbidden
    - **500**: Server error

This removes a user and their roles from the project. The user will no longer have access to the project, but their annotations will remain with full attribution.

