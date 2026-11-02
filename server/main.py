"""FastAPI backend for Kape Notes.

Run it with: python -m uvicorn server.main:app --reload --port 3000
"""

from contextlib import closing
from datetime import datetime, timezone
from pathlib import Path
import sqlite3
from uuid import uuid4

from fastapi import FastAPI, Request
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse
from pydantic import BaseModel, ConfigDict, Field


# The database file lives next to this source tree, so it works regardless of
# which folder you happen to be in when you start the server.
DATABASE_PATH = Path(__file__).resolve().parent.parent / "data" / "espresso.sqlite"
INVALID_SHOT_MESSAGE = "Add a name, coffee, and positive shot values."


def connect_database() -> sqlite3.Connection:
    """Open SQLite and return rows by column name as well as position."""
    connection = sqlite3.connect(DATABASE_PATH)
    connection.row_factory = sqlite3.Row
    return connection


def initialize_database() -> None:
    """Create the table on first run and upgrade older databases if needed."""
    DATABASE_PATH.parent.mkdir(parents=True, exist_ok=True)
    with closing(connect_database()) as connection:
        connection.execute(
            """CREATE TABLE IF NOT EXISTS shots (
                id TEXT PRIMARY KEY,
                name TEXT,
                coffee TEXT,
                dose REAL,
                yield_grams REAL,
                seconds INTEGER,
                created_at TEXT,
                method TEXT NOT NULL DEFAULT 'Espresso'
            )"""
        )

        # Older versions of the app did not save the brewing method. Add that
        # column once so their existing brew records still work.
        columns = {
            column["name"]
            for column in connection.execute("PRAGMA table_info(shots)")
        }
        if "method" not in columns:
            connection.execute(
                "ALTER TABLE shots ADD COLUMN method TEXT NOT NULL DEFAULT 'Espresso'"
            )
        connection.commit()


# FastAPI calls this app object for every incoming HTTP request.
# It also uses the title in the automatic API explorer at http://127.0.0.1:3000/docs.
app = FastAPI(title="Kape Notes API")


class NewShot(BaseModel):
    """The shape of a brew sent by the browser; FastAPI validates it for us."""

    # Field(...) adds simple rules: required text and positive, finite numbers.
    name: str = Field(min_length=1)
    coffee: str = Field(min_length=1)
    dose: float = Field(gt=0, allow_inf_nan=False)
    # The form calls this input "yield", while SQLite and the UI call it
    # "yield_grams". alias lets the API accept the form's existing JSON shape.
    yield_grams: float = Field(alias="yield", gt=0, allow_inf_nan=False)
    seconds: float = Field(gt=0, allow_inf_nan=False)
    # When the browser leaves method out, use the same Espresso default as before.
    method: str = "Espresso"

    # Also allow Python code to create this model using the normal field name.
    model_config = ConfigDict(populate_by_name=True)


class SavedShot(BaseModel):
    """The record shape returned to the browser after it is saved or listed."""

    id: str
    name: str
    method: str
    coffee: str
    dose: float
    yield_grams: float
    seconds: float
    created_at: str


# Keep the old API's friendly 400 error for invalid submitted brew data.
# FastAPI normally returns 422 for validation errors; this small handler changes
# that status and message to match what the existing frontend expects.
@app.exception_handler(RequestValidationError)
async def invalid_request(_request: Request, _error: RequestValidationError):
    return JSONResponse(status_code=400, content={"error": INVALID_SHOT_MESSAGE})


# This decorator connects GET /api/shots to the function immediately below it.
# response_model tells FastAPI what fields the JSON reply should contain.
@app.get("/api/shots", response_model=list[SavedShot])
def list_shots() -> list[SavedShot]:
    """GET means read: return every saved brew, newest first."""
    with closing(connect_database()) as connection:
        rows = connection.execute(
            "SELECT * FROM shots ORDER BY created_at DESC"
        ).fetchall()
    return [SavedShot(**dict(row)) for row in rows]


# This decorator connects POST /api/shots to this function. FastAPI sees the
# NewShot type and parses/validates the incoming JSON body before calling it.
@app.post("/api/shots", response_model=SavedShot, status_code=201)
def create_shot(shot: NewShot) -> SavedShot:
    """POST means create: validate a brew, save it, then return the new record."""
    created_at = datetime.now(timezone.utc).isoformat(timespec="milliseconds").replace(
        "+00:00", "Z"
    )
    saved = SavedShot(
        id=str(uuid4()),
        name=shot.name,
        method=shot.method,
        coffee=shot.coffee,
        dose=shot.dose,
        yield_grams=shot.yield_grams,
        seconds=shot.seconds,
        created_at=created_at,
    )

    # The ? marks are SQL parameters. Keeping values separate from SQL text
    # protects the query and safely handles user-entered apostrophes, etc.
    with closing(connect_database()) as connection:
        with connection:
            connection.execute(
                """INSERT INTO shots
                   (id, name, coffee, dose, yield_grams, seconds, created_at, method)
                   VALUES (?, ?, ?, ?, ?, ?, ?, ?)""",
                (
                    saved.id,
                    saved.name,
                    saved.coffee,
                    saved.dose,
                    saved.yield_grams,
                    saved.seconds,
                    saved.created_at,
                    saved.method,
                ),
            )
    return saved


# Create or upgrade the database when the API starts.
initialize_database()
