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
	"crypto/rsa"
	"crypto/x509"
	"encoding/json"
	"encoding/pem"
	"errors"
	"fmt"
	"github.com/bvinc/go-sqlite-lite/sqlite3"
	"github.com/golang-jwt/jwt/v5"
	"io"
	"log"
	"net/http"
	"sync"
	"time"
)

/* Add all future roles in between USER AND ADMIN
 * or change the code that depends on it.
 * See registerHandler.ServeHTTP() */
const (
	_ = iota
	USER
	ADMIN
)

const FIREBASE_PROJECT_ID = "testing-ff0e3"

var keys map[string]string

func keyfunc(token *jwt.Token) (interface{}, error) {
	kid := token.Header["kid"].(string)
	publickey := keys[kid]
	if len(publickey) == 0 {
		return nil, errors.New("Invalid signing key ID")
	}
	block, _ := pem.Decode([]byte(publickey))
	cert, err := x509.ParseCertificate(block.Bytes)
	if (err != nil) {
		log.Println("Could not parse certificate:", err)
		return nil, err
	}
	return cert.PublicKey.(*rsa.PublicKey), nil
}

func verifyIdToken(token string) (string, error) {
	parsedToken, err := jwt.Parse(token, keyfunc, jwt.WithValidMethods([]string{ "RS256" }))
	if (err != nil) {
		log.Println("Could not verify ID Token:", err)
		return "", err
	}
	claims := parsedToken.Claims.(jwt.MapClaims)
	now := float64(time.Now().Unix())
	uid := claims["sub"].(string)
	if claims["exp"].(float64) <= now || claims["iat"].(float64) > now || claims["aud"].(string) != FIREBASE_PROJECT_ID || claims["iss"].(string) != "https://securetoken.google.com/" + FIREBASE_PROJECT_ID || len(uid) == 0 || claims["auth_time"].(float64) >= now {
		log.Println("Invalid ID Token")
		return "", errors.New("Invalid ID Token")
	}
	return uid, nil
}

var db_write_lock sync.Mutex

func registerHandler(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		return
	}

	type Message struct {
		DisplayName string `json:"displayName"`
		IdToken string `json:"idtoken"`
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

	if len(m.DisplayName) == 0 {
		log.Println("Display name cannot be empty")
		return
	}

	uid, err := verifyIdToken(m.IdToken)
	if err != nil {
		log.Println("Invalid ID Token:", err)
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

	stmt, err := conn.Prepare(`SELECT uid FROM clients WHERE uid = ? OR displayName = ?`, uid, m.DisplayName)
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
		log.Println("User already exists in the database")
		w.WriteHeader(http.StatusConflict) /* 409 Conflict */
		return
	}

	db_write_lock.Lock()
	err = conn.Exec(`INSERT INTO clients VALUES (?, ?, ?)`, uid, m.DisplayName, USER)
	db_write_lock.Unlock()
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
		IdToken string `json:"idtoken"`
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

	uid, err := verifyIdToken(m.IdToken)
	if err != nil {
		log.Println("Invalid ID Token:", err)
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

	stmt, err := conn.Prepare(`SELECT displayName, role FROM clients WHERE uid = ?`, uid)
	if err != nil {
		log.Println(err)
		w.WriteHeader(http.StatusInternalServerError) /* 500 Internal Server Error */
		return
	}
	defer stmt.Close()

	hasRow, err := stmt.Step()
	if err != nil {
		log.Println(err)
		w.WriteHeader(http.StatusInternalServerError) /* 500 Internal Server Error */
		return
	}
	if !hasRow {
		log.Println("Uid", uid, "does not exist in the database")
		w.WriteHeader(http.StatusNotFound) /* 404 Not Found */
		return
	}

	var displayName string
	var role int
	err = stmt.Scan(&displayName, &role)
	if err != nil {
		log.Println(err)
		w.WriteHeader(http.StatusInternalServerError) /* 500 Internal Server Error */
		return
	}

	type MessageOut struct {
		DisplayName string `json:"displayName"`
		Role int `json:"role"`
	}
	var m_out MessageOut
	m_out.DisplayName = displayName
	m_out.Role = role

	err = json.NewEncoder(w).Encode(m_out)

	if err != nil {
		log.Println(err)
		w.WriteHeader(http.StatusInternalServerError) /* 500 Internal Server Error */
	}
}

/* TODO: store this in database and put a mutex for writing */
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

func sendDMHandler(w http.ResponseWriter, r *http.Request) {
	type Message struct {
		IdToken string `json:"idtoken"`
		Sendto string `json:"sendto"`
		Message string `json:"message"`
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

	from_uid, err := verifyIdToken(m.IdToken)
	if err != nil {
		log.Println("Invalid ID Token:", err)
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

	stmt, err := conn.Prepare(`SELECT uid FROM clients WHERE displayName = ?`, m.Sendto)
	if err != nil {
		log.Println(err)
		w.WriteHeader(http.StatusInternalServerError) /* 500 Internal Server Error */
		return
	}
	defer stmt.Close()

	hasRow, err := stmt.Step()
	if err != nil {
		log.Println(err)
		w.WriteHeader(http.StatusInternalServerError) /* 500 Internal Server Error */
		return
	}
	if !hasRow {
		log.Println("User does not exist in the database")
		w.WriteHeader(http.StatusNotFound) /* 404 Not Found */
		return
	}

	var to_uid string
	err = stmt.Scan(&to_uid)
	if err != nil {
		log.Println(err)
		w.WriteHeader(http.StatusInternalServerError) /* 500 Internal Server Error */
		return
	}

	db_write_lock.Lock()
	err = conn.Exec(`INSERT INTO messages VALUES (STRFTIME('%s'), ?, ?, ?)`, from_uid, to_uid, m.Message)
	db_write_lock.Unlock()
	if err != nil {
		log.Println(err)
		w.WriteHeader(http.StatusInternalServerError) /* 500 Internal Server Error */
		return
	}
	w.WriteHeader(http.StatusCreated) /* 201 Created */
}

func DMListHandler(w http.ResponseWriter, r *http.Request) {
	type Message struct {
		IdToken string `json:"idtoken"`
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

	uid, err := verifyIdToken(m.IdToken)
	if err != nil {
		log.Println("Invalid ID Token:", err)
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
	stmt, err := conn.Prepare(`SELECT DISTINCT displayName FROM clients INNER JOIN messages ON clients.uid = messages.from_id OR clients.uid = messages.to_id WHERE (messages.from_id = ? OR messages.to_id = ?) AND clients.uid != ?`, uid, uid, uid)
	if err != nil {
		log.Println(err)
		w.WriteHeader(http.StatusInternalServerError) /* 500 Internal Server Error */
		return
	}
	defer stmt.Close()

	out := make([]string, 0);

	for {
		hasRow, err := stmt.Step()
		if err != nil {
			log.Println(err)
			w.WriteHeader(http.StatusInternalServerError) /* 500 Internal Server Error */
			return
		}
		if !hasRow {
			/* The query is finished */
			break
		}

		var displayName string
		err = stmt.Scan(&displayName)
		if err != nil {
			log.Println(err)
			w.WriteHeader(http.StatusInternalServerError) /* 500 Internal Server Error */
			return
		}
		out = append(out, displayName)
	}

	err = json.NewEncoder(w).Encode(out)
	if err != nil {
		log.Println(err)
		w.WriteHeader(http.StatusInternalServerError) /* 500 Internal Server Error */
	}
}

func recvDMHandler(w http.ResponseWriter, r *http.Request) {
	type Message struct {
		IdToken string `json:"idtoken"`
		RecvFrom string `json:"recvfrom"`
		AfterTimestamp int `json:"afterTimestamp"`
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

	uid, err := verifyIdToken(m.IdToken)
	if err != nil {
		log.Println("Invalid ID Token:", err)
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
	stmt, err := conn.Prepare(`SELECT displayName, message FROM clients INNER JOIN messages ON clients.uid = messages.from_id WHERE (clients.uid = ? OR clients.displayName = ?) AND messages.timestamp > ? ORDER BY messages.timestamp`, uid, m.RecvFrom, m.AfterTimestamp)
	if err != nil {
		log.Println(err)
		w.WriteHeader(http.StatusInternalServerError) /* 500 Internal Server Error */
		return
	}
	defer stmt.Close()

	out := make([]string, 0);

	for {
		hasRow, err := stmt.Step()
		if err != nil {
			log.Println(err)
			w.WriteHeader(http.StatusInternalServerError) /* 500 Internal Server Error */
			return
		}
		if !hasRow {
			/* The query is finished */
			break
		}

		var displayName string
		var message string
		err = stmt.Scan(&displayName, &message)
		if err != nil {
			log.Println(err)
			w.WriteHeader(http.StatusInternalServerError) /* 500 Internal Server Error */
			return
		}
		out = append(out, displayName + ": " + message)
	}

	err = json.NewEncoder(w).Encode(out)
	if err != nil {
		log.Println(err)
		w.WriteHeader(http.StatusInternalServerError) /* 500 Internal Server Error */
	}
}

func main() {
	conn, err := sqlite3.Open("database.db")
	if err != nil {
		log.Fatal("Could not connect to database: ", err)
	}

	err = conn.Exec("PRAGMA journal_mode=WAL")
	if err != nil {
		log.Fatal("Could not use WAL mode: ", err)
	}

	err = conn.Exec("CREATE TABLE IF NOT EXISTS clients(uid TEXT, displayName TEXT, role INTEGER)")
	if err != nil {
		log.Fatal("Could not create table: ", err)
	}

	err = conn.Exec("CREATE TABLE IF NOT EXISTS messages(timestamp INTEGER, from_id TEXT, to_id TEXT, message TEXT)")
	if err != nil {
		log.Fatal("Could not create table: ", err)
	}

	/*err = conn.Exec("CREATE TABLE IF NOT EXISTS points(uid TEXT, points INTEGER)")
	if err != nil {
		log.Fatal("Could not create table: ", err)
	}*/

	conn.Close()

	/* TODO: store keys in database, use Cache-Control */
	resp, err := http.Get(
		"https://www.googleapis.com/robot/v1/metadata/x509/securetoken@system.gserviceaccount.com")
	if err != nil {
		log.Fatal("Could not get firebase keys: ", err)
	}
	json.NewDecoder(resp.Body).Decode(&keys)

	/* Serve the frontend/dist directory */
	http.Handle("/", http.FileServer(http.Dir("frontend/dist")))

	http.HandleFunc("/api/register", registerHandler)
	http.HandleFunc("/api/login", loginHandler)
	http.HandleFunc("/api/sendmsg", sendmsgHandler)
	http.HandleFunc("/api/recvmsg", recvmsgHandler)
	http.HandleFunc("/api/senddm", sendDMHandler)
	http.HandleFunc("/api/recvdm", recvDMHandler)
	http.HandleFunc("/api/dmlist", DMListHandler)

	log.Println("Listening at http://localhost:8000")
	log.Fatal(http.ListenAndServe(":8000", nil))
}
