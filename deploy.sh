#!/bin/bash

# Deployment Script for Hostinger
# Run this script from the root of the repository

echo "🚀 Starting Deployment..."

# 1. Pull latest code
echo "📥 Pulling latest code from Git..."
git pull origin main

# 2. Build Frontend
echo "🏗️ Building Frontend..."
cd client
npm install
npm run build

# 3. Deploy Frontend (Copy to public_html)
# Assuming repo is at: ~/public_html/.builds/source/repository
# We need to copy to: ~/public_html
echo "📂 Copying frontend files to public_html..."
# Go up 4 levels: client -> repository -> source -> .builds -> public_html
cp -r dist/* ../../../../

# 4. Restart Backend
echo "🔄 Restarting Backend Server..."
cd ../server
npm install
pm2 restart quotemaker

echo "✅ Deployment Complete!"
echo "Please check http://n8n.elizainfotech.com"
