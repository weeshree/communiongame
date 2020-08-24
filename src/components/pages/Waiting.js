import React, {useState, useEffect, useReducer} from 'react'
// import './Landing.scss';
import './Waiting.scss';

import io from "socket.io-client"

let socket;
export default function Waiting(props) {
    
    const initialState = {users: [props.cookie.user], ready: [false]}
    const [state, dispatch] = useReducer(socketReducer, initialState);

    const [include, setInclude] = useState("")
    const [exclude, setExclude] = useState("")
    const [includes, setIncludes] = useState([])
    const [excludes, setExcludes] = useState([])
    const [allReady, setAllReady] = useState(false)
    const [gameStarted, setGameStarted] = useState(false)

    const cards = ['cellar', 'chapel', 'moat', 'harbinger', 'merchant', 'vassal', 'village', 'workshop', 'bureaucrat', 'gardens', 'militia', 'moneylender', 'poacher', 'remodel', 'smithy', 'throne room', 'bandit', 'council room', 
        'festival', 'laboratory', 'library', 'market', 'mine', 'sentry', 'witch', 'artisan',
        'courtyard', 'lurker', 'pawn', 'masquerade', 'shanty town', 'steward', 'swindler',
        'wishing well', 'baron', 'bridge', 'conspirator', 'diplomat', 'ironworks', 'mill',
        'mining village', 'secret passage', 'courtier', 'duke', 'minion', 'patrol', 'replace',
        'torturer', 'trading post', 'upgrade', 'harem', 'nobles'
        ]

    useEffect(() => {
        // console.log("Opening socket")
        // var socket = openSocket("http://localhost:5000");
        // var socket = socketIOClient("http://localhost:5000");
        // console.log(users, typeof(users))
        socket = io()
        console.log(socket)

        socket.on('sendstatus', function(name) {
            dispatch(["send status", name])
        })

        socket.on('ready', function(name) {
            if(name == props.cookie.user) return;
            console.log("socket detected "+name+" ready")
            
            dispatch(["ready", name])
        })
        socket.on('not ready', function(name) {
            if(name == props.cookie.user) return;
            console.log("socket detected "+name+" not ready")

            dispatch(["not ready", name])
        })
        socket.on('departed', function(name) {
            if(name == props.cookie.user) return;
            console.log("socket detected "+name+" departed")
            dispatch(["departed", name])
        })

        socket.on("gametime", function(name) {
            if(name == props.cookie.user) return;
            setAllReady(true);
            props.setOngoing(true);
        })
        return () => {
            try {socket.close();}
            catch(e) {}
        }
    }, [])

    useEffect(() => {
        if(allReady) return; 
        // console.log(state.ready)
        if(state.ready.length<=1) 
        {
            setAllReady(false);
            return;
        }
        for(var i=0; i<state.ready.length; i++) if(!state.ready[i]) {
            setAllReady(false);
            return;
        }


        var imWinner = true
        for(var i=0; i<state.users.length; i++) if(state.users[i].localeCompare(props.cookie.user) > 0) imWinner = false

        if(imWinner) setGTracker(true)
        setAllReady(true);
    })



    const [gTracker, setGTracker] = useState(false)
    useEffect(()=>{
        if(gTracker && !gameStarted) {
            const requestOptions = {
                method:'POST',
                headers:{'Content-Type': 'application/json', 'Accept': 'application/json'},
                body: JSON.stringify({userList: state.users, cardIncludes: includes, cardExcludes: excludes})
            }
            setGameStarted(true)
            fetch("/api/startGame", requestOptions).then(
                response => {
                    socket.emit("gametime", props.cookie.user);
                    setAllReady(true);
                    props.setOngoing(true);
                }
            )
        }
    }, [gTracker])

    const clicked = () =>
    {
        console.log("CLICKED")
        let arr = [...state.ready]
        // console.log(users)
        arr[0] = !arr[0]

        if(arr[0]) 
        {
            socket.emit("ready", props.cookie.user);
            dispatch(["ready", props.cookie.user])
        }
        else 
        {
            socket.emit("not ready", props.cookie.user);
            dispatch(["not ready", props.cookie.user])
        }
    }

    const clearAll = () => {
        fetch("/delete").then((response) => {
            console.log(response)
            props.cookie.updateUser("")
        })
    }

    function socketReducer(state, [type, name])
    {
        var ind = state.users.indexOf(name)
        let arr = [...state.ready]
        switch (type) {
            case "ready":
                if(ind >= 0) 
                {
                    arr[ind] = true
                    return {
                        ...state,
                        ready: arr
                    }
                }
                else {
                    return {
                        ...state,
                        ready: [...state.ready, true],
                        users: [...state.users, name]
                    }
                }
            case "not ready":
                if(ind >= 0) 
                {
                    arr[ind] = false
                    return {
                        ...state,
                        ready: arr
                    }
                }
                else {
                    return {
                        ...state,
                        ready: [...state.ready, false],
                        users: [...state.users, name]
                    }
                }
            case "departed":
                if(ind >= 0)
                {
                    arr.splice(ind, 1)
                    let arr2 = [...state.users]
                    arr2.splice(ind, 1)
                    return {
                        ...state,
                        ready: arr,
                        users: arr2
                    }
                }
                break
            case "send status":
                console.log("socket detected new user")
                // console.log("I'm "+(state.ready[0] ? "":"not ")+"ready")
                if(state.ready[0]) socket.emit("ready", props.cookie.user)
                else socket.emit("not ready", props.cookie.user)
                break
        }
        return state 
    }

//     //admin
// //nIK7E2cLPMgFWpHC
// mongodb+srv://admin:nIK7E2cLPMgFWpHC@cluster0.m7qfc.mongodb.net/<dbname>?retryWrites=true&w=majority
    return <div class="backdrop-waiting">

        <div class="container-waiting">
            {state.users.map((name, i) => 
                <>
                <div key={i}>{name}
                <div class={"dot "+(state.ready[i]?"green":"")}></div>
                </div>


                {/* <p key={i}>{name}</p>
                <ul>
                    <li>
                        {state.ready[i] ? 
                            <> <p>Ready</p> {i==0 ? <button onClick={() => {clicked(false)}}>Not Ready</button> : <></>} </>
                            : 
                            <> <p>Not Ready</p> {i==0 ? <button onClick={() => {clicked(true)}}>Ready</button> : <></>} </>
                        }
                    </li> 
                </ul>
                </> */}
                </>
            )}
            {state.ready[0] ? <button onClick={()=>clicked(false)}>Not Ready</button> : <button onClick={()=>clicked(true)}>Ready</button>}

            {props.cookie.user == 'weeshree' ? <>

            <label>Include</label>
            <input type="text" id="include" onChange={(e)=>setInclude(e.target.value)} value={include}/>
            <button onClick={()=>{
                if(cards.indexOf(include)>=0)
                    setIncludes([...includes, include])
                setInclude("")
                }}>Include Card</button>
            <ul>
            {includes.map((name, i) =>
                <li key={i} id={name} onClick={(e) => {
                    let arr = [...includes]
                    arr.splice(includes.indexOf(e.target.id, 1))
                    setIncludes(arr)
                }}>{name}</li>
            )}
            </ul>

            <label>Don't Include</label>
            <input type="text" id="exclude" onChange={(e)=>setExclude(e.target.value)} value={exclude}></input>
            <button onClick={()=>{
                if(cards.indexOf(exclude)>=0)
                    setExcludes([...excludes, exclude])
                setExclude("")
                }}>Exclude Card</button>
            <ul>
            {excludes.map((name, i) =>
                <li key={i} id={name} onClick={(e) => {
                    let arr = [...excludes]
                    arr.splice(excludes.indexOf(e.target.id, 1))
                    setExcludes(arr)
                }}>{name}</li>
            )}
            </ul>

            </>
            :
            <> </>}
            
            {/* <div>{state.users.length}</div>
            <div>{state.ready.length}</div>
            {allReady ? <div>AYE AYE CAPTAIN</div> : <div> ARE YOU READY KIDS?</div>} */}
        </div>
    </div>
}