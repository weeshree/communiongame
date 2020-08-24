import React, {useState, useEffect} from 'react';
import { Router } from "@reach/router";

import useCookie from "./hooks/useCookie.js";

import Landing from "./pages/Landing.js";
import Waiting from "./pages/Waiting.js";
import Game from "./pages/Game.js";

import './App.css';


export default function App() {
  const cookie = useCookie()
  const [ongoing, setOngoing] = useState(true)
  const [spectator, setSpectator] = useState(false)
  const [realOngoing, setRealOngoing] = useState(false)
  // useEffect(() => {cookie.updateUser("")}, [])
  // useEffect(() => {
  //   fetch("/delete")
  // })
  useEffect(()=> {
    console.log(ongoing);
    if(cookie.user == "" || !(ongoing^realOngoing)) return;
    console.log(ongoing+" "+realOngoing);
    fetch("/api/getUsers").then(response=>
      {
          // console.log("Checking if good to go")
          response.json().then((data) =>
          {
            setSpectator(!data.users.includes(cookie.user))
            if(data.users.length == 0) {
              setRealOngoing(false);
              setOngoing(false);
            }
            else {
              console.log(data.users);
              setRealOngoing(true)
            }
          })
      }
    )
  })

  // useEffect(()=>{
  //   // console.log("ONGOING "+ongoing)
  // }, [ongoing])
  return (cookie.user == "" ? 
    <Router>
      <Landing path="/" cookie={cookie}></Landing>
    </Router>
      :
    <Router>
      {realOngoing ?
      <Game path="/" cookie={cookie}></Game> 
      :
      // <Game path="/" cookie={cookie}></Game> 
      <Waiting path="/" setOngoing = {setOngoing} isSpectator={spectator} cookie={cookie}></Waiting>
      }
    </Router>
  )
}
