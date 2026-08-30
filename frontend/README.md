# Cartura frontend

The frontend is the Next.js application in the Cartura pnpm workspace. Run development commands from the repository root so the shared contracts and backend dependencies are available.

Start the backend stack in the first terminal:

```bash
pnpm run dev:backend
```

After the API reports that it is running on port 4000, start the frontend in a second terminal:

```bash
pnpm run dev:frontend
```

The frontend waits for the API health check before starting. See the repository [Quick Start](../readme.md#quick-start) for environment setup, database preparation, URLs, and troubleshooting guidance.
