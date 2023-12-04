/**
 * @source: https://github.com/pranjalkole/rights-rise
 *
 * @license AGPL-3.0-only
 *
 * Copyright (C) 2023  Pranjal Kole <pranjal.kole7@gmail.com>
 */

import { onAuthStateChanged, signOut } from "firebase/auth";
import { auth } from "../firebase.ts";
// import { Role } from "./misc.ts"
import React, { useState, useEffect } from "react";
import ReactDOM from "react-dom/client";
import "./index.css";

let displayName: string;
let email: string;
let role: string;
let idToken: string;
let chats: string[];
let emailVerified: boolean;

function Header({
  signedIn,
  handleLogout,
}: {
  signedIn: boolean;
  handleLogout: React.MouseEventHandler<HTMLAnchorElement>;
}) {
  return (
    <header>
      <h1>RightsRise</h1>
      {signedIn ? (
        <div>
          <>{displayName}</>|
          <a href="#" onClick={handleLogout}>
            Logout
          </a>
        </div>
      ) : (
        <div>
          <a href="/login.html">Login</a>|<a href="/register.html">Register</a>
        </div>
      )}
    </header>
  );
}

function Footer() {
  return (
    <footer>
      <h1>Game Icon</h1>
    </footer>
  );
}

function Spinner() {
  return (
    <div className="loader">
      <div className="spinner"></div>
    </div>
  );
}

function App() {
  enum State {
    Normal,
    Chat,
  }
  const [loading, setLoading] = useState(true);
  const [signedIn, setSignedIn] = useState(false);
  const [messages, setMessages] = useState<string[]>([]);
  const [state, setState] = useState(State.Normal);
  const [chat, setChat] = useState("");

  useEffect(() => {
    if (!signedIn || state != State.Chat) return;
    const interval = setInterval(async () => {
      const response = await fetch("/api/recvdm", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          idtoken: idToken,
          recvfrom: chat,
          afterTimestamp: 0,
        }),
      });
      setMessages(await response.json());
    }, 1000);
    return () => {
      clearInterval(interval);
    };
  }, [signedIn, chat]);

  useEffect(() => {
    return onAuthStateChanged(auth, async (user) => {
      setLoading(true);
      if (!user) {
        setSignedIn(false);
        setLoading(false);
        return;
      }
      displayName = user.displayName!;
      email = user.email!;
      emailVerified = user.emailVerified;
      idToken = await user.getIdToken(); /* TODO: wrap in try catch */
      const data = {
        email: email,
        idtoken: idToken,
      };
      await fetch("/api/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      })
        .then((response) => {
          if (response.status !== 200) {
            role = "Email does not exist in database"; // TODO
            setLoading(false);
            return;
          }
          response.json().then((data) => {
            console.log(data);
          });
        })
        .catch((error) => {
          alert("Could not fetch role from database, see console");
          console.log(error);
          setLoading(false);
          return;
        });

      await fetch("/api/dmlist", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          idtoken: idToken,
        }),
      })
        .then(async (response) => {
          chats = await response.json(); /* TODO: wrap in try catch */
          setSignedIn(true);
        })
        .catch((error) => {
          alert("Could not fetch DM list from database, see console");
          console.log(error);
        });
      setLoading(false);
    });
  }, []);

  useEffect(() => {
    const evSource = new EventSource("/api/recvmsg");
    evSource.onmessage = (event) => {
      setMessages((messages) => [...messages, event.data]);
    };
  }, []);

  function handleLogout() {
    setLoading(true);
    signOut(auth)
      .then(() => {
        setLoading(false);
      })
      .catch((error) => {
        let message;
        if (error.code == "auth/network-request-failed") {
          message =
            "A network error has occurred. Check your internet connection and see if firebase is blocked";
        } else {
          message = "Bug in application or firebase, see console";
          console.log(error);
        }
        alert(message);
        setLoading(false);
      });
  }

  if (loading) {
    return <Spinner />;
  }

  function formSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const message =
      (signedIn ? displayName : "Anon") + ": " + e.currentTarget.message.value;
    e.currentTarget.message.value = "";
    fetch("/api/sendmsg", {
      method: "POST",
      body: message,
    });
  }

  if (state == State.Normal) {
    return (
      <>
        <Header signedIn={signedIn} handleLogout={handleLogout} />
        {signedIn ? (
          <>
            <p>
              Signed in as {email} ({role}). Your email is{" "}
              {!emailVerified && <>not</>} verified
            </p>
            <a href="#" onClick={handleLogout}>
              Logout
            </a>
          </>
        ) : (
          <p>You are logged out</p>
        )}
        <div id="chat">
          {messages.map((message) => (
            <p>{message}</p>
          ))}
          <form onSubmit={formSubmit}>
            <input id="message" />
            <input type="submit" value="Send" />
          </form>
        </div>
        {signedIn && (
          <h1>
            <a href="/home/">Home</a>
          </h1>
        )}
        {signedIn && (
          <>
            <h1>Your chats</h1>
            {chats.length != 0 ? (
              chats.map((chat) => (
                <a
                  href="#"
                  onClick={() => {
                    setChat(chat);
                    setState(State.Chat);
                    setMessages([]);
                  }}
                >
                  {chat}
                </a>
              ))
            ) : (
              <p>You have no chats</p>
            )}
          </>
        )}
        <Footer />
      </>
    );
  }

  function handleSendDM(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    fetch("/api/senddm", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        idtoken: idToken,
        sendto: chat,
        message: event.currentTarget.message.value,
      }),
    }); /* TODO: handle errors */
  }

  /* state is State.Chat */
  return (
    <>
      <Header signedIn={signedIn} handleLogout={handleLogout} />
      <a href="#" onClick={() => setState(State.Normal)}>
        Back
      </a>
      <h1>{chat}</h1>
      <p>Messages</p>
      {messages.length != 0 ? (
        messages.map((message) => <p>{message}</p>)
      ) : (
        <p>No messages</p>
      )}
      <form onSubmit={handleSendDM}>
        <input name="message" id="message" />
        <button>Send</button>
      </form>
      <Footer />
    </>
  );
}

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
/* vim: set et sw=2: */
