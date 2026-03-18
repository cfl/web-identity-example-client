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
     - `http://localhost:3001/*` (for local development)
     - `https://your-domain.com/*` (for production)
   - **Valid post logout redirect URIs**: `+` (same as redirect URIs)
   - **Web origins**: `+` (or specify your domains)
   - Click **Save**
     with redirect URI `http://localhost:49613/*`. The valid post logout redirect URIs, and the web origins, are both "+"

5. **Set the CFL Theme**
   - After creating client, scroll down to Login Settings
   - Select **cfl-theme** from the Login theme. If it is not present, you may have had some issues in the build process of keycloak.
   - Click **Save**

6. **Get Client Credentials**
   - Since this sample is using a public client, there is no client secret
   - But if you are using a confidential client (such as when SSO calls get initiated from backend), you can go to credentials tab in Keycloak to get your secret. Set the VITE_KEYCLOAK_CLIENT_SECRET environment variable with this value.

7. Create a user that you will use to login when testing the application under Users

8. **Add email to the jwt token values**
   - To make sure your token includes information such as your id or email, you need to configure that in Keycloak.
   - Go to Client Scopes -> Create Client Scope, named "email scope"
   - Check Include in token scope, click save
   - Click on Add a Predefined Mapper, and choose email
   - Go to Clients -> sample-admin -> client scopes, and click Add Client Scopes
   - Add your newly created 'email scope' (select default)

## Setup Webhooks (Optional)

The **agent** service supports receiving webhooks from Keycloak for real-time user event notifications. This is a separate service from the main backend.

### Create Client for Agent Service

The agent needs a separate confidential client to authenticate with Keycloak for webhook registration. This is different from the `sample-admin` client used by the frontend.

1. In Keycloak admin console, go to **Clients** → **Create client**
2. Configure the admin client:
   - **Client ID**: `sample-admin-agent`
   - **Client Protocol**: `openid-connect`
   - Click **Next**

3. **Capability config**:
   - **Client authentication**: `ON` (this makes it confidential)
   - **Authorization**: `OFF`
   - **Service accounts roles**: `ON` (enables client credentials flow)
   - Click **Next**, then **Save**

4. **Assign Admin Roles**:
   - Go to **Service Account Roles** tab
   - Assign necessary admin roles for webhook management (e.g., realm-admin or specific event listener permissions)

5. **Get Client Secret**:
   - Go to **Credentials** tab
   - Copy the **Client Secret**

6. **Add to agent .env**:
   ```
   KEYCLOAK_CLIENT_ID=sample-admin  # The client you want to monitor
   KEYCLOAK_AGENT_CLIENT_ID=sample-admin-agent
   KEYCLOAK_AGENT_CLIENT_SECRET=your_copied_client_secret
   ```

The agent will automatically get access tokens using these credentials when needed for webhook registration. No manual token management required!

### Choose Agent Exposure Method:

**Option 1: Cloud Deployment**  
Set `AGENT_URL` to your public agent URL

**Option 2: Local Development with Ngrok**  
1. Sign up at [ngrok.com](https://ngrok.com) and get your auth token
2. Add `NGROK_AUTH_TOKEN` to `agent/.env`

**Option 3: Skip Webhooks Entirely**  
Don't set `AGENT_URL` or `NGROK_AUTH_TOKEN`. The agent service will automatically exit, and the app will work without webhooks (you won't receive real-time user deletion events).

## Setup keycloak client, set the environment variables, run the services

### Backend Service

Create a .env file inside the `backend` directory:

```
KEYCLOAK_URL=http://localhost:8080
KEYCLOAK_REALM=cfl
KEYCLOAK_CLIENT_ID=sample-admin
KEYCLOAK_ADMIN_CLIENT_ID=sample-admin-backend
KEYCLOAK_ADMIN_CLIENT_SECRET=your_admin_client_secret
FRONTEND_URL=http://localhost:49613  # Your frontend URL for CORS
PORT=3001  # Backend port
```

### Agent Service (Optional - for webhooks)

Create a .env file inside the `agent` directory:

```
KEYCLOAK_URL=http://localhost:8080
KEYCLOAK_REALM=cfl
KEYCLOAK_CLIENT_ID=sample-admin  # The client whose events you want to monitor
KEYCLOAK_AGENT_CLIENT_ID=sample-admin-agent  # Agent's auth credentials
KEYCLOAK_AGENT_CLIENT_SECRET=your_agent_client_secret
PORT=3002  # Agent port
AGENT_URL=  # Optional: your agent URL if publicly accessible
NGROK_AUTH_TOKEN=your_ngrok_token_here  # Optional: only if using ngrok
```

**Note:** If you don't set either `AGENT_URL` or `NGROK_AUTH_TOKEN`, the agent service will exit immediately on startup since it has no way to receive webhooks.

### Frontend Service

Create a .env file inside the `frontend` directory:

```
VITE_KEYCLOAK_REALM=cfl
VITE_KEYCLOAK_AUTH_SERVER_URL=http://localhost:8080/
VITE_KEYCLOAK_CLIENT_ID=sample-admin
```

## Running the Services

From the root directory, you can run all services (backend, frontend, and optionally agent):

```
npm install
npm run dev
```

Or run each service individually:

**Backend:**
```bash
cd backend
npm install
npm run dev
```

**Frontend:**
```bash
cd frontend
npm install
npm run dev
```

**Agent (optional - for webhooks):**
```bash
cd agent
npm install
npm run dev
```

To test your client worked, go to
`http://localhost:49613/`

You should be able to enter the username, password you created and be redirected to home page which should say "Hello 'your users email'"

If it says, "Hello undefined", it means your client scope was not configured correctly, go back to step 8
