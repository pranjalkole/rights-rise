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
	"github.com/bvinc/go-sqlite-lite/sqlite3"
	"log"
	"net/http"
	"net/mail"
	"strings"
	"sync"
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
	type Message struct {
		Email string `json:"email"`
		Role int `json:"role"`
	}

	/* TODO: This accepts input of the form
	 * {"a": 1, "b": 2}garbage
	 * Think about whether this should be allowed */
	var m Message
	err := json.NewDecoder(r.Body).Decode(&m)
	if (err != nil) {
		log.Println("Could not decode JSON:", err)
		w.WriteHeader(http.StatusUnprocessableEntity) /* 422 Unprocessable Entity */
		return
	}

	if (m.Role < USER || m.Role > ADMIN) {
		log.Println("Invalid role", m.Role)
		w.WriteHeader(http.StatusUnprocessableEntity) /* 422 Unprocessable Entity */
		return
	}

	m.Email = strings.ToLower(m.Email)
	e, err := mail.ParseAddress(m.Email)
	if (err != nil) {
		log.Println("Could not parse email address:", err, "This should never happen, firebase is validating emails.")
		w.WriteHeader(http.StatusUnprocessableEntity) /* 422 Unprocessable Entity */
		return
	}
	if (e.Name != "") {
		log.Println("Invalid email address. This should never happen, firebase is validating emails")
		w.WriteHeader(http.StatusUnprocessableEntity) /* 422 Unprocessable Entity */
		return
	}
	conn, err := sqlite3.Open("database.db")
	if (err != nil) {
		log.Println(err)
		w.WriteHeader(http.StatusInternalServerError) /* 500 Internal Server Error */
		return
	}
	defer conn.Close()

	stmt, err := conn.Prepare(`SELECT role from users where email = ?`, m.Email)
	if (err != nil) {
		log.Println(err)
		w.WriteHeader(http.StatusInternalServerError) /* 500 Internal Server Error */
		return
	}
	hasRow, err := stmt.Step()
	stmt.Close()
	if (err != nil) {
		log.Println(err)
		w.WriteHeader(http.StatusInternalServerError) /* 500 Internal Server Error */
		return
	}
	if (hasRow) {
		log.Println("Email", m.Email, "already exists in the database")
		w.WriteHeader(http.StatusConflict) /* 409 Conflict */
		return
	}

	err = conn.Exec(`INSERT INTO users VALUES (?, ?)`, m.Email, m.Role)
	if (err != nil) {
		log.Println(err)
		w.WriteHeader(http.StatusInternalServerError) /* 500 Internal Server Error */
		return
	}
	w.WriteHeader(http.StatusCreated) /* 201 Created */
}

func loginHandler(w http.ResponseWriter, r *http.Request) {
	type Message struct {
		Email string `json:"email"`
	}

	/* TODO: This accepts input of the form
	 * {"a": 1, "b": 2}garbage
	 * Think about whether this should be allowed */
	var m Message
	err := json.NewDecoder(r.Body).Decode(&m)
	if (err != nil) {
		log.Println("Could not decode JSON:", err)
		w.WriteHeader(http.StatusUnprocessableEntity) /* 422 Unprocessable Entity */
		return
	}

	e, err := mail.ParseAddress(m.Email)
	if (err != nil) {
		log.Println("Could not parse email address:", err)
		w.WriteHeader(http.StatusUnprocessableEntity) /* 422 Unprocessable Entity */
		return
	}
	if (e.Name != "") {
		log.Println("Invalid email address")
		w.WriteHeader(http.StatusUnprocessableEntity) /* 422 Unprocessable Entity */
		return
	}

	conn, err := sqlite3.Open("database.db")
	if (err != nil) {
		log.Println(err)
		w.WriteHeader(http.StatusInternalServerError) /* 500 Internal Server Error */
		return
	}
	defer conn.Close()

	stmt, err := conn.Prepare(`SELECT role from users where email = ?`, m.Email)
	if (err != nil) {
		log.Println(err)
		w.WriteHeader(http.StatusInternalServerError) /* 500 Internal Server Error */
		return
	}
	hasRow, err := stmt.Step()
	defer stmt.Close()
	if (err != nil) {
		log.Println(err)
		w.WriteHeader(http.StatusInternalServerError) /* 500 Internal Server Error */
		return
	}
	if (!hasRow) {
		log.Println("Email", m.Email, "does not exist in the database")
		w.WriteHeader(http.StatusNotFound) /* 404 Not Found */
		return
	}

	var role int
	err = stmt.Scan(&role)
	if (err != nil) {
		log.Println(err)
		w.WriteHeader(http.StatusInternalServerError) /* 500 Internal Server Error */
		return
	}

	err = json.NewEncoder(w).Encode(map[string]int{
		"role": role,
	})

	if (err != nil) {
		log.Println(err)
		w.WriteHeader(http.StatusInternalServerError) /* 500 Internal Server Error */
	}
}


func main() {
	conn, err := sqlite3.Open("database.db")
	if (err != nil) {
		log.Fatal("Could not connect to database: ", err)
	}

	err = conn.Exec("PRAGMA journal_mode=WAL")
	if (err != nil) {
		log.Fatal("Could not use WAL mode: ", err)
	}

	err = conn.Exec("CREATE TABLE users(email text, role integer)")
	// TODO: find a better way to check existence of table
	if (err != nil) {
		/* Table already exists */
	}

	/* Serve the frontend/dist directory */
	http.Handle("/", http.FileServer(http.Dir("frontend/dist")))

	http.Handle("/api/register", new(registerHandler))
	http.HandleFunc("/api/login", loginHandler)

	log.Println("Listening on port 8000")
	log.Fatal(http.ListenAndServe(":8000", nil))
}
