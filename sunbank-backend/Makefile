PY ?= python3
setup:
	$(PY) -m pip install -r requirements.txt
build:
	PYTHONPATH=. $(PY) -m app.pipeline
test:
	PYTHONPATH=. $(PY) -m pytest -q
api:
	PYTHONPATH=. $(PY) -m uvicorn app.api:app --host 0.0.0.0 --port 8000
demo: build test api
