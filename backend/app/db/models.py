from datetime import datetime, timezone
from uuid import uuid4

from geoalchemy2 import Geometry
from sqlalchemy import DateTime, String
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base


class StoredAOI(Base):
    """Persisted AOI geometry + normalized GeoJSON snapshot for reproducibility."""

    __tablename__ = "stored_aois"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid4()))
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
    )
    label: Mapped[str | None] = mapped_column(String(256), nullable=True)
    geojson: Mapped[dict] = mapped_column(JSONB, nullable=False)
    geom = mapped_column(Geometry(geometry_type="POLYGON", srid=4326), nullable=False)
