"""Start the Zhihu demo using settings relative to this checkout."""

import os
import runpy
from importlib.metadata import distribution
from pathlib import Path


def main():
    root = Path(__file__).resolve().parent
    env_file = Path(os.environ.get("ZHIHU_ENV_FILE", ".zhihu.env")).expanduser()
    os.environ["ZHIHU_ENV_FILE"] = str((root / env_file).resolve())
    os.chdir(root)

    defaults = {
        "GRADIO_SERVER_NAME": "127.0.0.1",
        "GRADIO_SERVER_PORT": "7860",
        "GRADIO_ANALYTICS_ENABLED": "False",
        "KH_OPEN_BROWSER": "False",
        "KH_ENABLE_FIRST_SETUP": "False",
        "KH_FEATURE_USER_MANAGEMENT": "False",
        "USE_LIGHTRAG": "False",
        "USE_MS_GRAPHRAG": "False",
        "HF_HUB_OFFLINE": "1",
        "ANONYMIZED_TELEMETRY": "False",
        "XDG_CACHE_HOME": str(root / ".cache"),
        "MPLCONFIGDIR": str(root / ".cache" / "matplotlib"),
    }
    for name, value in defaults.items():
        os.environ.setdefault(name, value)

    tokenizer_cache = distribution("llama-index-core").locate_file(
        "llama_index/core/_static/tiktoken_cache"
    )
    if tokenizer_cache.is_dir():
        os.environ.setdefault("TIKTOKEN_CACHE_DIR", str(tokenizer_cache))

    runpy.run_path(str(root / "app.py"), run_name="__main__")


if __name__ == "__main__":
    main()
