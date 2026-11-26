import os
from pathlib import Path

from decouple import config
from starlette.routing import Mount, Route
from explore_api import perspectives
from starlette.staticfiles import StaticFiles
from theflow.settings import settings as flowsettings

KH_APP_DATA_DIR = getattr(flowsettings, "KH_APP_DATA_DIR", ".")
KH_GRADIO_SHARE = getattr(flowsettings, "KH_GRADIO_SHARE", False)
GRADIO_TEMP_DIR = os.getenv("GRADIO_TEMP_DIR", None)
# override GRADIO_TEMP_DIR if it's not set
if GRADIO_TEMP_DIR is None:
    GRADIO_TEMP_DIR = os.path.join(KH_APP_DATA_DIR, "gradio_tmp")
    os.environ["GRADIO_TEMP_DIR"] = GRADIO_TEMP_DIR


from ktem.main import App  # noqa

app = App()
demo = app.make()
explore_dir = Path(__file__).resolve().parent / "frontend" / "explore"
demo.queue().launch(
    app_kwargs={"routes": [Route("/explore/api/perspectives", perspectives, methods=["POST"]), Mount("/explore", app=StaticFiles(directory=explore_dir, html=True))]}
    if explore_dir.is_dir() else {},
    favicon_path=app._favicon,
    inbrowser=config("KH_OPEN_BROWSER", default=True, cast=bool),
    allowed_paths=[
        "libs/ktem/ktem/assets",
        GRADIO_TEMP_DIR,
    ],
    blocked_paths=[
        str(Path(os.environ.get("ZHIHU_ENV_FILE", ".zhihu.env")).expanduser().resolve()),
    ],
    share=KH_GRADIO_SHARE,
)
