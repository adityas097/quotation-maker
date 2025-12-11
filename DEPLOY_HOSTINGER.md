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
    Open `http://<your-server-ip>:3000`
    *Note: You may need to open port 3000 in Hostinger Firewall or use Nginx as a reverse proxy to point domain.com -> localhost:3000.*

## Option B: Hostinger Shared Hosting (Setup Node.js App)

*Only applies if your plan supports "Setup Node.js App" in hPanel.*

1.  **Upload Files**: Use File Manager to upload the `quotation-maker` folder to `public_html/quotemaker`.
2.  **Go to hPanel -> Setup Node.js App**.
3.  **Create App**:
    -   **Node.js Version**: 18+
    -   **App Root**: `public_html/quotemaker/server`
    -   **Application URL**: `quotemaker` (e.g., domain.com/quotemaker)
    -   **Application Startup File**: `src/index.js`
4.  **Install Dependencies**: Click "NPM Install" button in hPanel.
    *(Note: You might need to manually build the `client` folder locally and upload the `client/dist` folder to the server since shared hosting might not let you run `npm run build` easily via UI)*.
    
    *Recommended Workflow for Shared Hosting*:
    1. Run `npm run build` on your local PC inside `client`.
    2. Upload the `client/dist` folder to your server alongside `server`.
    3. Ensure `server/src/index.js` path to `../../client/dist` is correct relative to where you put it.

## Troubleshooting

-   **Database**: The `database.sqlite` file will be created in `server` folder. Ensure permissions allow writing.
-   **Ports**: On shared hosting, the port is assigned automatically (Passenger). On VPS, you control port 3000.
