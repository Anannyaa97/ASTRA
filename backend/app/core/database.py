"""SQLAlchemy engine, session factory and declarative Base."""
from sqlalchemy import create_engine, inspect, text
from sqlalchemy.orm import DeclarativeBase, sessionmaker

from app.core.config import settings

# check_same_thread=False is needed for SQLite when FastAPI uses threads.
connect_args = {"check_same_thread": False} if settings.database_url.startswith("sqlite") else {}
engine = create_engine(settings.database_url, connect_args=connect_args)
SessionLocal = sessionmaker(bind=engine, autoflush=False, autocommit=False)


class Base(DeclarativeBase):
    pass


def get_db():
    """FastAPI dependency: yields a DB session and always closes it."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def ensure_columns(db_engine=None):
    """Add columns that newer versions of ASTRA need to a database made by an older version.

    create_all() only creates missing TABLES, so an existing astra.db would not get new columns by itself.
    Each step is safe to run again."""
    db_engine = db_engine or engine
    wanted = {"missions": [("sun_level", "VARCHAR(12) DEFAULT 'normal'"), ("sun_info", "JSON")]}
    inspector = inspect(db_engine)
    with db_engine.begin() as conn:
        for table, columns in wanted.items():
            if not inspector.has_table(table):
                continue
            have = {c["name"] for c in inspector.get_columns(table)}
            for name, ddl in columns:
                if name not in have:
                    conn.execute(text(f"ALTER TABLE {table} ADD COLUMN {name} {ddl}"))
