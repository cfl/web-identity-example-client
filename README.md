## Setting up this sample client

Pre-requisites:
You must have Keycloak configured, or have access to a keycloak instance.
Follow instructions [here](https://github.com/cfl/Caiman?tab=readme-ov-file#local-development) to setup your local keycloak instance.

## Configure your client

Login in your keycloak instance, typically at http://localhost:8080/admin

Go to Manage Realms and either create a realm or select an existing CFL realm. Make sure to select the correct realm before proceeding

### Creating a client

1. Navigate to **Clients** → **Create client**
2. Configure the client:
   - **Client ID**: `sample-admin`
   - **Client Protocol**: `openid-connect`
   - Click **Next**

3. **Capability config**:
   - **Client authentication**: `OFF` (this is important if you plan to initiate sso from ui)
   - **Authorization**: `OFF`
   - **Authentication flow**: Check all standard flows
   - Click **Next**

4. **Login settings**:
   - **Valid redirect URIs**:
     - `http://localhost:3000/*` (for local development)
     - `https://your-domain.com/*` (for production)
   - **Valid post logout redirect URIs**: `+` (same as redirect URIs)
   - **Web origins**: `+` (or specify your domains)
   - Click **Save**
     with redirect URI `http://localhost:49613/*`. The valid post logout redirect URIs, and the web origins, are both "+"

5. **Set the CFL Theme**
   - After creating client, scroll down to LoginSettings
   - Select cfl-theme from the Login theme. If it is not present, you may have had some issues in the build process of keycloak.

6. **Get Client Credentials**
   - If you are using a public client, there is no client secret
   - But if you are using a confidential client (such as when SSO calls get initiated from backend), you can go to credentials tab in Keycloak to get your secret.

7. Create a user that you will use to login when testing the application under Users

8. **Add email to the jwt token values**
   - To make sure your token includes information such as your id or email, you need to configure that in Keycloak.
   - Go to Clients -> Client Scopes -> Create Client Scope
   - Check Include in token scope, click save
   - Go to add a preconfigured mapper, and choose email
   - Go to client, sample-admin, and client scopes, and click Add Client Scopes
   - Add your newly created scope (select default)

## Setup keycloak client, set the environment variables, run the client and backend

To run both the backend and front end, from the using-alligator-sso directory type

Create a .env file inside alligator-backend directory

```
KEYCLOAK_URL=http://localhost:8080
KEYCLOAK_REALM=cfl
```

Create a .env file inside alligator-frontend directory as well

```
VITE_KEYCLOAK_REALM=cfl
VITE_KEYCLOAK_AUTH_SERVER_URL=http://localhost:8080/
VITE_KEYCLOAK_CLIENT_ID=sample-admin // up to you if thats what you called your client
```

Then run both backend and frontend, from the top directory

```
npm install
npm run dev
```

To test your client worked, go to
`http://localhost:49613/`

You should be able to enter the username, password you created and be redirected to home page which should say "Hello <email>"

If it says, "Hello undefined", it means your client scope was not configured correctly, go back to step 8
