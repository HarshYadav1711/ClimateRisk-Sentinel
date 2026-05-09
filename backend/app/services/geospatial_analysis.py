"""Legacy module name — orchestration moved to `app.services.analysis.pipeline`."""


def run_placeholder_analysis() -> None:
    raise NotImplementedError("Use `run_aoi_analysis` from `app.services.analysis.pipeline`.")
