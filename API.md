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

### 3. **Collaborators**

Manage the users and roles in a Project.

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

#### `PUT /project/:projectId/collaborator/:collaboratorId/setRoles` 🔐

- **Description**: Set the roles of a User in a project, replacing all currently defined roles.
- **Parameters**:
  - `projectId`: ID of the project.
  - `collaboratorId`: ID of the collaborator.
- **Request Body**:

    ```json
    {
        "roles": ["string"] | "string"
    }
    ```
- **Responses**:

    - **200**: Roles set successfully
    - **400**: Roles setting failed, validation errors
    - **401**: Unauthorized
    - **403**: Forbidden
    - **500**: Server error

The User requesting this action must have permissions to set roles for the collaborator. The <kbd>OWNER</kbd> role cannot be set using this endpoint.

#### `POST /project/:projectId/switch/owner` 🔐

- **Description**: Transfer ownership of a project to another user.
- **Parameters**:
  - `projectId`: ID of the project.
- **Request Body**:

    ```json
    {
        "newOwnerId": "hexstring"
    }
    ```
- **Responses**:

    - **200**: Ownership transferred successfully
    - **400**: Ownership transfer failed, validation errors
    - **401**: Unauthorized
    - **403**: Forbidden
    - **500**: Server error

The User requesting this action must be the current owner of the project. The <kbd>OWNER</kbd> role will be removed from the current owner and assigned to the new owner. The new owner must be a member of the project. If the current owner has no other roles, the <kbd>CONTRIBUTOR</kbd> role will be assigned to them.

#### `POST /project/:projectId/setCustomRoles` 🔐

- **Description**: Set custom roles for a Project group. Custom roles must be provided as a JSON object with keys as roles and values as arrays of permissions or space-delimited strings.
- **Parameters**:
    - `projectId`: ID of the project.
- **Request Body**:

        ```json
        {
                "roles": {
                        "roleName": ["permission1", "permission2"] | "space-delimited permissions"
                }
        }
        ```

- **Responses**:

        - **200**: Custom roles set successfully
        - **400**: Invalid request, validation errors
        - **401**: Unauthenticated request
        - **403**: Permission denied
        - **500**: Server error

The User requesting this action must have permissions to update roles. Default roles cannot be modified using this endpoint. Custom roles can be complicated and there is more detailed description of their use in the [Cookbook](#).

---

### 4. **Users**

Private account modification, personal details, and public profile retrieval.

#### `GET /my/profile` 🔐

- **Description**: Retrieve the profile of the authenticated user.
- **Responses**:

    - **200**: Profile found
        ```json
        {
            "_id": "hexstring",
            "_sub": "string",
            "agent": "URI<Agent>",
            "email": "string",
            "profile": {
                "displayName": "string",
                "custom": Any
            }
            "name": "string"
        }
        ```
    - **401**: Unauthorized
    - **500**: Server error

Users can always see and manipulate their own profile. The profile object is a projection of the full user object.

#### `GET /my/projects` 🔐

- **Description**: Retrieve a list of projects the authenticated user is a member of.
- **Responses**:

    - **200**: Projects found
        ```json
        [
            {
                "_id": "hexstring",
                "label": "string",
                "roles": ["string"]
            }, ...
        ]
        ```
    - **401**: Unauthorized
    - **500**: Server error

The response is a list of projects the user is a member of regardless of the permissions afforded to them in each project.

#### `GET /user/:id`

- **Description**: Retrieve the public profile of a user.
- **Parameters**:
  - `id`: ID of the user.
- **Responses**:

    - **200**: Profile found
        ```json
        {
            "_id": "hexstring",
            "displayName": "string",
            "custom": Any
        }
        ```
    - **404**: Profile not found
    - **500**: Server error

The response is a projection of the full user object. The public profile is available to all users and serialized into this response with whatever the user has chosen to share. The `custom` field is not an actual property - it is a placeholder for any additional fields the user has added to their profile. The `displayName` and `_id` fields are always present.
