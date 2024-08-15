# Toro Backend

Backend service for the Toro Mobile Application, built with Express and TypeScript.

## Setup

1. **Clone the repository:**

    ```bash
    git clone https://github.com/yourusername/toro-backend.git
    cd toro-backend
    ```

2. **Install dependencies:**

    ```bash
    npm install
    ```

3. **Set up environment variables:**

    Create a .env file:

    ```plaintext
    FIREBASE_SERVICE_ACCOUNT='{
      "type": "service_account",
      "project_id": "your-project-id",
      ...
    }'
    ```

4. **Run the server:**

    ```bash
    npx ts-node src/index.ts
    ```

## Deployment

Push to master. Vercel takes care of it.
