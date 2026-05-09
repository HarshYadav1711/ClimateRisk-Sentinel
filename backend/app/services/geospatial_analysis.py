"""
Service layer — orchestrate domain logic, external data access, and analysis jobs.

Geospatial pipelines (raster/vector IO, PostGIS, STAC clients) will plug in here.
"""


async def run_placeholder_analysis() -> None:
    """Reserved hook for future synchronous analysis entrypoint."""
    raise NotImplementedError("Analysis pipeline not implemented in skeleton.")
