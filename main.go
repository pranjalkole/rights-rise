/**
 *
 * main.go
 *
 * Copyright (C) 2023  Pranjal Kole <pranjal.kole7@gmail.com>
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as published by
 * the Free Software Foundation, version 3 of the License only.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of 
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU Affero General Public License for more details.
 *
 * You should have received a copy of the GNU Affero General Public License
 * along with this program.  If not, see <https://www.gnu.org/licenses/>.
 *
 */

package main

import (
	"encoding/json"
	"fmt"
	"github.com/bvinc/go-sqlite-lite/sqlite3"
	"io"
	"log"
	"net/http"
	"net/mail"
	"strings"
	"sync"
	"time"
)

/* Add all future roles in between USER AND ADMIN
 * or change the code that depends on it.
 * See registerHandler.serveHTTP() */
const (
	_ = iota
	USER
	ADMIN
)

type registerHandler struct {
	db_write_lock sync.Mutex
}

func (h *registerHandler) ServeHTTP(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		return
	}

	type Message struct {
		Email string `json:"email"`
		Role int `json:"role"`
	}

	/* TODO: This accepts input of the form
	 * {"a": 1, "b": 2}garbage
	 * Think about whether this should be allowed */
	var m Message
	err := json.NewDecoder(r.Body).Decode(&m)
	if err != nil {
		log.Println("Could not decode JSON:", err)
		w.WriteHeader(http.StatusUnprocessableEntity) /* 422 Unprocessable Entity */
		return
	}

	if m.Role < USER || m.Role > ADMIN {
		log.Println("Invalid role", m.Role)
		w.WriteHeader(http.StatusUnprocessableEntity) /* 422 Unprocessable Entity */
		return
	}

	m.Email = strings.ToLower(m.Email)
	e, err := mail.ParseAddress(m.Email)
	if err != nil {
		log.Println("Could not parse email address:", err, "This should never happen, firebase is validating emails.")
		w.WriteHeader(http.StatusUnprocessableEntity) /* 422 Unprocessable Entity */
		return
	}
	if e.Name != "" {
		log.Println("Invalid email address. This should never happen, firebase is validating emails")
		w.WriteHeader(http.StatusUnprocessableEntity) /* 422 Unprocessable Entity */
		return
	}
	conn, err := sqlite3.Open("database.db")
	if err != nil {
		log.Println(err)
		w.WriteHeader(http.StatusInternalServerError) /* 500 Internal Server Error */
		return
	}
	defer conn.Close()

	stmt, err := conn.Prepare(`SELECT role from users where email = ?`, m.Email)
	if err != nil {
		log.Println(err)
		w.WriteHeader(http.StatusInternalServerError) /* 500 Internal Server Error */
		return
	}
	hasRow, err := stmt.Step()
	stmt.Close()
	if err != nil {
		log.Println(err)
		w.WriteHeader(http.StatusInternalServerError) /* 500 Internal Server Error */
		return
	}
	if hasRow {
		log.Println("Email", m.Email, "already exists in the database")
		w.WriteHeader(http.StatusConflict) /* 409 Conflict */
		return
	}

	err = conn.Exec(`INSERT INTO users VALUES (?, ?)`, m.Email, m.Role)
	if err != nil {
		log.Println(err)
		w.WriteHeader(http.StatusInternalServerError) /* 500 Internal Server Error */
		return
	}
	w.WriteHeader(http.StatusCreated) /* 201 Created */
}

func loginHandler(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		return
	}

	type Message struct {
		Email string `json:"email"`
	}

	/* TODO: This accepts input of the form
	 * {"a": 1, "b": 2}garbage
	 * Think about whether this should be allowed */
	var m Message
	err := json.NewDecoder(r.Body).Decode(&m)
	if err != nil {
		log.Println("Could not decode JSON:", err)
		w.WriteHeader(http.StatusUnprocessableEntity) /* 422 Unprocessable Entity */
		return
	}

	e, err := mail.ParseAddress(m.Email)
	if err != nil {
		log.Println("Could not parse email address:", err)
		w.WriteHeader(http.StatusUnprocessableEntity) /* 422 Unprocessable Entity */
		return
	}
	if e.Name != "" {
		log.Println("Invalid email address")
		w.WriteHeader(http.StatusUnprocessableEntity) /* 422 Unprocessable Entity */
		return
	}

	conn, err := sqlite3.Open("database.db")
	if err != nil {
		log.Println(err)
		w.WriteHeader(http.StatusInternalServerError) /* 500 Internal Server Error */
		return
	}
	defer conn.Close()

	stmt, err := conn.Prepare(`SELECT role from users where email = ?`, m.Email)
	if err != nil {
		log.Println(err)
		w.WriteHeader(http.StatusInternalServerError) /* 500 Internal Server Error */
		return
	}
	hasRow, err := stmt.Step()
	defer stmt.Close()
	if err != nil {
		log.Println(err)
		w.WriteHeader(http.StatusInternalServerError) /* 500 Internal Server Error */
		return
	}
	if !hasRow {
		log.Println("Email", m.Email, "does not exist in the database")
		w.WriteHeader(http.StatusNotFound) /* 404 Not Found */
		return
	}

	var role int
	err = stmt.Scan(&role)
	if err != nil {
		log.Println(err)
		w.WriteHeader(http.StatusInternalServerError) /* 500 Internal Server Error */
		return
	}

	err = json.NewEncoder(w).Encode(map[string]int{
		"role": role,
	})

	if err != nil {
		log.Println(err)
		w.WriteHeader(http.StatusInternalServerError) /* 500 Internal Server Error */
	}
}

/*func checkForUpgrade(headerValue []byte) (string, error) {
	var starts []arr = 0
	var ends []arr
	if headerValue[0] == ',' {
		return "", errors.New("Invalid header")
	}
	for i := 1; j < len(headerValue)-1; i++ {
		if headerValue[i] == ',' {
			if headerValue[i+1] == ' ' {
				ends = append(ends, i+2)
			} else {
				ends = append(ends, i+1)
			}
		}
	}
}*/

var msgs []string

func sendmsgHandler(w http.ResponseWriter, r *http.Request) {
	msg, err := io.ReadAll(r.Body)
	if err != nil {
		log.Println("Could not read request body", err)
		return
	}
	msgs = append(msgs, string(msg))
	w.WriteHeader(http.StatusOK)
}

func recvmsgHandler(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "text/event-stream")
//	w.Header().Set("Connection", "keep-alive")
	index := 0
	for {
		if index == len(msgs) {
			time.Sleep(time.Second)
		} else {
			for ; index < len(msgs); index++ {
				fmt.Fprintf(w, "data: %s\n\n", msgs[index])
			}
			w.(http.Flusher).Flush()
		}
	}
}

/*func chatHandler(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		return
	}
	if r.Header.Get("Upgrade") != "websocket" {
		log.Println("Header \"Upgrade\" is not \"websocket\"")
		return
	}
	connection := r.Header.Values("Connection")
//	for i := 0; i < len(connection); i++ {
//		if hasUpgrade(connection[i]) {
//			goto 
//		}
/	}
	if r.Header.Values("Connection") != "Upgrade" {
		log.Println("Header \"Connection\" is not \"Upgrade\"")
	}
	key := r.Header.Get("Sec-WebSocket-Key")
	if key == "" {
		log.Println("Header \"Sec-WebSocket-Accept\" is empty")
		return
	}
	version := r.Header.Get("Sec-WebSocket-Version")
	log.Println("websockets version:", version)
	sha1sum := sha1.Sum([]byte(key + "258EAFA5-E914-47DA-95CA-C5AB0DC85B11"))
	encoded := base64.StdEncoding.EncodeToString(sha1sum[:])
	log.Println(encoded)
	w.Header().Add("Upgrade", "websocket")
	w.Header().Add("Connection", "Upgrade")
	w.Header().Add("Sec-WebSocket-Accept", encoded)
	w.WriteHeader(http.StatusSwitchingProtocols)
			hj, ok := w.(http.Hijacker)
		if !ok {
			http.Error(w, "webserver doesn't support hijacking", http.StatusInternalServerError)
			return
		}
		conn, _, err := hj.Hijack()
		if err != nil {
			log.Println("cant hijack")
			http.Error(w, err.Error(), http.StatusInternalServerError)
			return
		}
		// Don't forget to close the connection:
		defer conn.Close()
		var buf []byte
		log.Println("here222")
		n, err := conn.Read(buf)
		if (err != nil) {
			log.Println(err)
			return
		}
		log.Println(buf, n)
/*		bufrw.WriteString("Now we're speaking raw TCP. Say hi: ")
		bufrw.Flush()
		s, err := bufrw.ReadString('\n')
		if err != nil {
			log.Printf("error reading string: %v", err)
			return
		}
		fmt.Fprintf(bufrw, "You said: %q\nBye.\n", s)
		bufrw.Flush()*/
//}

func main() {
	conn, err := sqlite3.Open("database.db")
	if err != nil {
		log.Fatal("Could not connect to database: ", err)
	}

	err = conn.Exec("PRAGMA journal_mode=WAL")
	if err != nil {
		log.Fatal("Could not use WAL mode: ", err)
	}

	err = conn.Exec("CREATE TABLE users(email TEXT, role INTEGER, name TEXT, address TEXT)")
	// TODO: find a better way to check existence of table
	if err != nil {
		/* Table already exists */
	}

	err = conn.Exec("CREATE TABLE points(email TEXT, points INTEGER)")
	// TODO: find a better way to check existence of table
	if err != nil {
		/* Table already exists */
	}

	/* Serve the frontend/dist directory */
	http.Handle("/", http.FileServer(http.Dir("frontend/dist")))

	http.Handle("/api/register", new(registerHandler))
	http.HandleFunc("/api/login", loginHandler)
	http.HandleFunc("/sendmsg", sendmsgHandler)
	http.HandleFunc("/recvmsg", recvmsgHandler)

	log.Println("Listening at https://localhost:8000")
	log.Fatal(http.ListenAndServeTLS(":8000", "server.crt", "server.key", nil))
}
