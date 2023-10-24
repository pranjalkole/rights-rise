all:
	cd frontend && npm run build
	go build

cert:
	openssl req -x509 -out server.crt -keyout server.key -newkey rsa:2048 -nodes -sha256 -subj '/CN=localhost' -extensions EXT -config <(printf "[dn]\nCN=localhost\n[req]\ndistinguished_name = dn\n[EXT]\nsubjectAltName=DNS:localhost\nkeyUsage=digitalSignature\nextendedKeyUsage=serverAuth")

clean:
	rm -rf database.db rights-rise frontend/dist server.crt server.key

fetch:
	cd frontend && npm install

.PHONY: all cert clean fetch
