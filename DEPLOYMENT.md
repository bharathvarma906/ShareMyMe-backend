# Deploying ShareMyMeal Backend to Render via Docker

This guide walks you through deploying the backend API service to [Render](https://render.com) using Docker.

---

## 🚀 Deployment Options on Render

### Option 1: Render Web Service (Manual Setup - Recommended)

1. **Push your code to GitHub**:
   ```bash
   git add .
   git commit -m "Add Dockerfile and Render deployment configurations"
   git push origin main
   ```

2. **Log in to [Render Dashboard](https://dashboard.render.com)**.

3. **Click "New +" -> "Web Service"**.

4. **Connect your GitHub repository**:
   - Select `ShareMyMe-backend` (or your repository containing the backend).

5. **Configure the Service**:
   - **Name**: `sharemymeal-backend`
   - **Language / Runtime**: Select **`Docker`**
   - **Branch**: `main`
   - **Region**: Choose the closest region (e.g., Singapore, Frankfurt, Oregon)
   - **Instance Type**: `Free`

6. **Add Environment Variables**:
   In the **Environment Variables** section, add the following key-value pairs:

   | Key | Value | Description |
   |-----|-------|-------------|
   | `NODE_ENV` | `production` | Enables production mode optimizations |
   | `MONGO_URI` | `mongodb+srv://<user>:<password>@cluster0.mongodb.net/sharemymeal?retryWrites=true&w=majority` | Your MongoDB Atlas connection string |
   | `JWT_SECRET` | `your_secret_key_here` | Long random secret string for JWT authentication |
   | `JWT_EXPIRE` | `30d` | Expiration duration for user sessions |
   | `ALLOWED_ORIGINS` | `*` (or your deployed frontend URL) | Permitted origins for CORS requests |

   *(Note: Render automatically injects `PORT=10000`, which our server code handles seamlessly).*

7. **Health Check Path**:
   - Under **Advanced Settings**, set **Health Check Path** to `/api/health`.

8. **Click "Create Web Service"**.
   - Render will build the Docker container and start your service.
   - Once deployed, your backend will be live at `https://<service-name>.onrender.com`.

---

### Option 2: Render Blueprint (Infrastructure as Code)

We have included a `render.yaml` file in the repository.

1. In Render Dashboard, click **New +** -> **Blueprint**.
2. Connect your repository.
3. Render will automatically read `render.yaml`, configure the Docker runtime, set `/api/health`, and prompt you to fill in `MONGO_URI`.

---

## 🔍 Verification & Health Check

Once your service is live on Render:
- **Ping Root**: `https://<your-service>.onrender.com/`
- **Health Check**: `https://<your-service>.onrender.com/api/health`
  - Returns JSON showing API status, database connectivity status (`connected` / `disconnected`), and server uptime.

---

## 🔗 Connecting with the Frontend

In your frontend project:
1. Update `.env.production` (or Vercel / Netlify environment variables):
   ```env
   VITE_API_BASE_URL=https://<your-render-service-url>.onrender.com/api
   ```
2. Redeploy the frontend.
