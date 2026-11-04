from fastapi import FastAPI
from pydantic import BaseModel
from uuid import uuid4
import sqlite3

app = FastAPI()

@app.get("/")
def home():
    return {"message": "tungtungtung sahur"}

class newShot(BaseModel):
    name : str
    coffee : str
    method : str = "Espresso"
    dose : float
    yield_grams : float
    seconds : float

DB_PATH = "server/espresso.sqlite"


def createTable():
    connection = sqlite3.connect(DB_PATH)

    connection.execute(""" 
    CREATE TABLE IF NOT EXISTS shots (
            id TEXT PRIMARY KEY,
            name TEXT,
            coffee TEXT,
            method TEXT,
            dose REAL,
            yield_grams REAL,
            seconds REAL,
            created_at TEXT
        )""")

    connection.commit()
    connection.close()
createTable()

@app.get("/api/shots")
def listShots():
    connection = sqlite3.connect(DB_PATH)
    connection.row_factory = sqlite3.Row


    rows = connection.execute("SELECT * FROM shots").fetchall()
    connection.close()
    return [dict(row) for row in rows]



@app.post("/api/shots")
def preview_shot(newshot : newShot):
    shotID = str(uuid4())
    connection = sqlite3.connect(DB_PATH)
    connection.execute("""INSERT INTO shots
        (id, name, coffee, method, dose, yield_grams, seconds)
        VALUES (?, ?, ?, ?, ?, ?, ?)""",
            (  
            shotID,
            newshot.name,
            newshot.coffee,
            newshot.method,
            newshot.dose,
            newshot.yield_grams,
            newshot.seconds,
            ),
                    )
    connection.commit()
    connection.close()

    saved = newshot.model_dump()
    saved["id"] = shotID

    return saved

@app.delete("/api/shots/{shotID}")
def removeShot(shotID : str):
    connection = sqlite3.connect(DB_PATH)
    connection.execute("DELETE FROM shots WHERE id = ?", (shotID,))
    connection.commit()
    connection.close()
