.PHONY: install serve build clean

install:
	python3 -m pip install -r requirements.txt

serve:
	python3 -m mkdocs serve -f mkdocs.yml

build:
	python3 -m mkdocs build -f mkdocs.yml --clean

clean:
	rm -rf ../site
