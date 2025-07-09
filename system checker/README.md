# Gig Worker Finder – System Checker

A quick tool to ensure your machine is ready to run the **Gig Worker Finder** stack.

## Install (one-time)
```bash
npm install --prefix "system checker"
```

## Usage
```bash
# From project root
node "system checker/index.js"

# or, inside the folder
npm run check --prefix "system checker"
```

What it validates:
1. Node ≥ 18 and npm ≥ 9
2. Presence of `server/.env` and `frontend/.env` and basic required keys
3. Port 5000 (API) and 3000 (React) are free
4. Connectivity to the MongoDB URI in `server/.env`
5. `node_modules` installed for both backend and frontend

The script exits with code **0** on success, **1** if any check fails.
