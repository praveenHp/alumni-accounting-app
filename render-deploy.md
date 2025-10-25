# Deploy to Render

## Steps:

1. **Create Render Account**
   - Go to https://render.com
   - Sign up with GitHub

2. **Create Web Service**
   - Click "New +" → "Web Service"
   - Connect your GitHub repository
   - Configure:
     - Name: alumni-accounting-app
     - Environment: Node
     - Build Command: npm install
     - Start Command: npm start

3. **Deploy**
   - Click "Create Web Service"
   - Your app will be available at: https://your-app-name.onrender.com

## Cost: FREE (with limitations - app sleeps after 15 min of inactivity)
