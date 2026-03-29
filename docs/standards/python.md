# Python Development

Use `uv` for everything. No pip, no virtualenv, no poetry, no pipx.

## Python version

Use the current stable release. At time of writing that's 3.13; 3.12 remains a solid choice. `uv` will pin the version in `.python-version` — commit that file and keep the team in sync. Mirror this version in `pyproject.toml`, ruff, and mypy config.

## Project setup

```bash
uv init myproject
cd myproject
uv sync
```

This gives you `pyproject.toml`, `.python-version`, and a managed `.venv`. Don't touch the venv directly.

## Running things

Always `uv run`. Never activate the venv manually.

```bash
uv run python main.py
uv run pytest -v
uv run ruff check .
```

Correct Python version and dependencies, every time.

## Dependencies

```bash
uv add requests                  # runtime dep
uv add --group dev ruff pytest   # dev dep
uv remove somelib                # remove
uv sync                          # reinstall from lockfile
```

`uv.lock` is committed. `requirements.txt` is not used.

## Global CLI tools

```bash
uv tool install pre-commit
uv tool install repomix
```

Not `pip install --user` or `pipx`. `uv tool` manages isolated environments per tool.

## Inline scripts

For standalone scripts with their own dependencies:

```python
# /// script
# requires-python = ">=3.12"
# dependencies = ["httpx"]
# ///
import httpx
```

```bash
uv run script.py
```

For project CLIs, use `[project.scripts]` in `pyproject.toml`.

## Dev tooling

### Ruff — formatting and linting

Replaces black, isort, flake8, and most of pylint. One tool.

```bash
uv run ruff format .             # format
uv run ruff check .              # lint
uv run ruff check --fix          # lint + autofix
```

Starter config in `pyproject.toml`:

```toml
[tool.ruff]
target-version = "py312"     # keep in sync with .python-version
line-length = 88

[tool.ruff.lint]
select = [
    "E",    # pycodestyle errors
    "W",    # pycodestyle warnings
    "F",    # pyflakes
    "I",    # isort (import sorting)
    "UP",   # pyupgrade
    "B",    # flake8-bugbear
    "SIM",  # flake8-simplify
    "RUF",  # ruff-specific
]
```

Solid baseline without noise. Add `"S"` (security), `"PT"` (pytest style), `"D"` (docstrings) as the project matures.

### Mypy — static type checking

Worth adding for anything with an API surface or shared library code. Not every script needs it.

```bash
uv add --group dev mypy
uv run mypy src/
```

```toml
[tool.mypy]
python_version = "3.12"      # keep in sync with .python-version
check_untyped_defs = true
warn_return_any = true
```

Start permissive and tighten as coverage improves. `check_untyped_defs = true` is the single most useful non-strict setting — it typechecks function bodies even without annotations.

### Pytest

```bash
uv add --group dev pytest pytest-cov
uv run pytest -v
uv run pytest --cov=src/ --cov-report=term-missing
```

```toml
[tool.pytest.ini_options]
testpaths = ["tests"]
addopts = "-v --tb=short"
```

Keep tests in `tests/` mirroring `src/` structure. Prefer plain functions over test classes.

## Project layout

```
myproject/
├── pyproject.toml
├── uv.lock
├── .python-version
├── justfile
├── README.md
├── src/
│   └── myproject/
│       ├── __init__.py
│       └── main.py
└── tests/
    └── test_main.py
```

Use `src/` layout. It prevents accidental imports from the project root and makes packaging unambiguous.

## pyproject.toml skeleton

```toml
[project]
name = "myproject"
version = "0.1.0"
requires-python = ">=3.12"   # pin to current stable; update when you start the project
dependencies = []

[dependency-groups]
dev = ["ruff", "pytest", "pytest-cov", "mypy"]

[tool.ruff]
target-version = "py312"     # keep in sync with .python-version
line-length = 88

[tool.ruff.lint]
select = ["E", "W", "F", "I", "UP", "B", "SIM", "RUF"]

[tool.mypy]
python_version = "3.12"      # keep in sync with .python-version
check_untyped_defs = true
warn_return_any = true

[tool.pytest.ini_options]
testpaths = ["tests"]
addopts = "-v --tb=short"
```

## What not to do

- Don't `pip install`. Use `uv add` or `uv tool install`.
- Don't activate the venv. Use `uv run`.
- Don't create `requirements.txt`. The lockfile is `uv.lock`.
- Don't use `setup.py` or `setup.cfg`. Everything is in `pyproject.toml`.
- Don't use black or isort separately. Ruff handles both.
- Don't start with `mypy --strict` on existing code. Tighten incrementally.
