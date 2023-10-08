all:
	cd frontend && npm run build
	go build

fetch:
	cd frontend && npm install

.PHONY: all fetch
