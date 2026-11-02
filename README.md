# Kape Notes

A small React + TypeScript coffee-brew log. The browser UI talks to a Python
FastAPI backend, which saves brews in `data/espresso.sqlite` (a local SQLite file).

## Start the app

You need Node.js and Python 3.10 or newer.

```powershell
npm install
python -m venv .venv
.\.venv\Scripts\Activate.ps1
python -m pip install -r requirements.txt
npm run dev
```

Open the Vite URL printed in the terminal (usually <http://127.0.0.1:5173>).
The API runs on port 3000. Open <http://127.0.0.1:3000/docs> to try its routes
in FastAPI's interactive API explorer.

`server/main.py` is the backend. It has two routes: `GET /api/shots` lists
brews, and `POST /api/shots` validates and saves one. Comments in that file
explain the FastAPI ideas as they are used.

## What to study

If your goal is to understand the backend, study these parts of
`server/main.py` in order:

1. **Python basics:** imports, variables, functions, and type hints.
2. **HTTP routes:** `@app.get` reads the brew list; `@app.post` saves a brew.
3. **Pydantic models:** `NewShot` describes and checks incoming data; `SavedShot`
   describes the response.
4. **SQLite:** `initialize_database`, `list_shots`, and `create_shot` show how
   the app creates the table, reads rows, and safely inserts a brew.
5. **Running the server:** Uvicorn starts the FastAPI `app`; Vite forwards the
   browser's `/api` requests to it.

You can skip React, CSS, and most npm details while learning FastAPI. You only
need `npm run dev` to start the whole app. `node_modules` contains downloaded
frontend dependencies; you do not need to study those files.
