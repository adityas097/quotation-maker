# Deploying QuoteMaker on Hostinger (VPS/Cloud)

Allows you to run the QuoteMaker app using **Node.js**.

## Option A: Hostinger VPS (Ubuntu/Debian)

1.  **SSH into your server**:
    ```bash
    ssh root@<your-server-ip>
    # (Enter password or use SSH key provided)
    ```

2.  **Install Node.js & Git** (if not installed):
    ```bash
    curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
    sudo apt-get install -y nodejs git
    ```

3.  **Clone the Repository**:
    ```bash
    git clone https://github.com/adityas097/quotation-maker.git
    cd quotation-maker
    ```

4.  **Install & Build**:
    We need to build the frontend so the backend can serve it.
    ```bash
    # install backend deps
    cd server
    npm install
    
    # install frontend deps & build
    cd ../client
    npm install
    npm run build
    ```

5.  **Run with PM2** (Process Manager):
    PM2 keeps your app running 24/7.
    ```bash
    npm install -g pm2
    cd ../server
    
    # Set NODE_ENV to production to enable static file serving
    pm2 start src/index.js --name "quotemaker" -- --serve-client
    # Or simply: NODE_ENV=production pm2 start src/index.js --name "quotemaker"
    
    pm2 save
    pm2 startup
    ```

6.  **Access App**:
    Open `http://<your-server-ip>:3000` in your browser.
    *(You may need to allow port 3000 in Hostinger firewall settings)*

---

## Option B: Hostinger Shared Hosting (cPanel/hPanel)

*Shared hosting is harder for Node.js apps. If you have "Node.js" selector in hPanel:*

1.  **Upload Files**:
    -   Upload `server` folder contents to root.
    -   Upload `client/dist` folder contents to `public` (or combine them).
2.  **Setup Node App**:
    -   App Entry file: `src/index.js`
    -   Run `npm install` from hPanel.

---

## 🔄 How to Update the Live Site

If you made changes (like the new Company Settings feature) and pushed them to GitHub, follow these steps on your server:

1.  **Navigate to project folder**:
    ```bash
    cd quotation-maker
    ```

2.  **Pull Latest Code**:
    ```bash
    git pull
    ```

3.  **Rebuild Frontend** (Important for UI changes):
    ```bash
    cd client
    npm install  # in case new dependencies were added
    npm run build
    ```

4.  **Restart Backend** (Critical for Database/API changes):
    ```bash
    cd ../server
    npm install  # in case new backend deps
    pm2 restart quotemaker
    ```

## 🚀 Quick Update Script (For your specific setup)

Based on your server structure (`public_html/.builds/source/repository`), run this one-liner or these commands to update everything:

```bash
# 1. Go to your repository
cd ~/public_html/.builds/source/repository

# 2. Pull the new code
git pull origin main

# 3. Update Frontend (Build & Copy to public_html)
cd client
npm install
npm run build
# Copy the built files to your main website folder (public_html)
# We go up 4 levels to reach public_html: client -> repository -> source -> .builds -> public_html
cp -r dist/* ../../../../

# 4. Update Backend (Database & API)
cd ../server
npm install
pm2 restart quotemaker
```

**Verify:**
1.  Check `http://n8n.elizainfotech.com` (Frontend should look new)
2.  Check `http://n8n.elizainfotech.com/api/companies` (Should return JSON, not 404)
