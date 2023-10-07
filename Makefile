all:
	cd frontend && npm run build
	go build

.PHONY: all
