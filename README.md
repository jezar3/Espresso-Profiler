# Kape Notes

A small React + TypeScript coffee-brew log. The browser UI is ready; the backend
is currently cleared so you can rebuild it yourself.

## Backend practice

The old backend code was removed. Recreate `server/main.py` and define a FastAPI
object named `app` there. `requirements.txt` still lists FastAPI and Uvicorn.
The database file `data/espresso.sqlite` is kept, so your saved brews are safe.

## Start the app

You need Node.js and Python 3.10 or newer.

```powershell
npm install
python -m venv .venv
.\.venv\Scripts\Activate.ps1
python -m pip install -r requirements.txt
npm run dev
```

After you recreate `server/main.py`, run `npm run dev` and open the Vite URL
(usually <http://127.0.0.1:5173>). Then you can open
<http://127.0.0.1:3000/docs> to try your API routes.

Until `server/main.py` exists, `npm run dev` cannot start the backend. To run
only the frontend while you practice, use `npx vite --host 127.0.0.1` in a
terminal.

## What to study

As you rebuild `server/main.py`, a good learning order is:

1. **Python basics:** imports, variables, functions, and type hints.
2. **HTTP routes:** `@app.get` reads the brew list; `@app.post` saves a brew.
3. **Pydantic model:** `NewShot` describes and checks the incoming brew fields.
4. **SQLite:** create the table, read rows with `SELECT`, and save a brew with
   `INSERT` and `commit()`.
5. **Running the server:** Uvicorn starts the FastAPI `app`; Vite forwards the
   browser's `/api` requests to it.

You can skip React, CSS, and most npm details while learning FastAPI. You only
need `npm run dev` to start the whole app. `node_modules` contains downloaded
frontend dependencies; you do not need to study those files.

## Where is the code?

The browser shows the website, not the Python source code. Open or create
`server/main.py` in your code editor to work on the backend. Once it is running,
`http://127.0.0.1:3000/docs` shows the API routes and lets you try them; it does
not display the server's Python code.
