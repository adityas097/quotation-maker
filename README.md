# QuoteMaker

QuoteMaker is a streamlined web-based tool for businesses to create professional quotations, convert them into invoices, and manage a digital billbook.

## Features

- **Quotations**: Create professional quotes with specific items, rates, taxes (GST), and HSN codes.
- **Invoicing**: Convert approved quotes to invoices with one click.
- **Item Master**: Manage your product catalog with import support (CSV/Excel).
- **Billbook**: valid history of all invoices and their payment status.
- **Client Management**: Auto-saving client details with autocomplete search.
- **PDF Generation**: Printer-friendly layout for Quotes and Invoices.

## Tech Stack

- **Frontend**: React, Vite, Vanilla CSS (Premium Design)
- **Backend**: Node.js, Express
- **Database**: SQLite (Local file-based database)

## Getting Started

### Prerequisites

- Node.js installed on your machine.

### Installation

1. **Clone the Repository**:
   ```bash
   git clone https://github.com/adityas097/quotation-maker.git
   cd quotation-maker
   ```

2. **Quick Start (Windows)**:
   We have provided a script to start both servers.
   ```bash
   # Coming soon - manually run steps below for now
   ```

3. **Manual Setup**:
   
   **Terminal 1 (Backend)**:
   ```bash
   cd server
   npm install
   node src/index.js
   ```
   
   **Terminal 2 (Frontend)**:
   ```bash
   cd client
   npm install
   npm run dev
   ```

4. **Access the App**:
   Open browser at [http://localhost:5173](http://localhost:5173)

## Usage

1. Open http://localhost:5173.
2. Go to **Item Master** to populate your products (or upload a CSV).
3. Go to **Quotations** -> **New Quote** to start.
4. Go to **Billbook** to view converted invoices.

## License

Personal Use / Open Source
