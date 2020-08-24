import React, {useState, useEffect, useReducer} from 'react'

import './Game.scss';
import Card from '../modules/Card'
import Tile from '../modules/Tile'


import io from "socket.io-client"
import {victories,treasures,actions,bigcards,prices,sidecards,sidecardPrices,attackCards,reactCards} from "../constants/constants"
import { Howl } from 'howler';

let socket;

export default function Game(props) {


    const [player, setPlayer] = useState({})
    const [kingdom, setKingdom] = useState([])
    const [players, setPlayers] = useState([])
    const [playedCards, setPlayedCards] = useState([])
    const [hand, setHand] = useState([])
    const [deck, setDeck] = useState([])
    const [discard, setDiscard] = useState([])
    const [sidePile, setSidePile] = useState([])

    const initialSelect = {type: "", number: 0, selected:[], upTo: true}
    const [select, setSelect] = useState(initialSelect)
    const [selectedCards, setSelectedCards] = useState([])

    const initialState = {turn: "", turnCt: 1, actions: 1, buys: 1, coins: 0, waiting: "", kingdom: [],
        supply: [10,10,10,10,10,10,10,10,10,10,8,30,8,40,8,60,20], playedCards: [], throneMe: [], maskedCard: -1,numMerchants:0, numBridges: 0, trash: [], vps: []}

    const [supply, setSupply] = useState([])
    const [phase, setPhase] = useState(0)
    const [state, dispatch] = useReducer(socketReducer, initialState);
    const [nextPlayer, setNextPlayer] = useState("")

    const [choiceModal, setChoiceModal] = useState([])
    const [throned, setThroned] = useState(0)
    const [display, setDisplay] = useState([])

    const [playCardTracker, setPlayCardTracker] = useState(-1)

    const [loading, setLoading] = useState(false)
    const [liveActions, setLiveActions] = useState(0)
    const [trashToggle, setTrashToggle] = useState(false)
    const [kingdomToggle, setKingdomToggle] = useState(false)

    const [focused, setFocused] = useState(false)

    const onFocus=()=>{setFocused(true); console.log("FOCUS")}
    const onBlur=()=>{setFocused(false); console.log("BLUR");}

    useEffect(()=> {
        window.addEventListener('focus', onFocus)
        window.addEventListener('blur', onBlur)

        return ()=> {
            window.removeEventListener('focus',onFocus)
            window.removeEventListener('blur',onBlur)
        }
    })


    function socketReducer(state, [nextState])
    {
        // console.log("Sigh.. a dispatch")
        return {
            ...state,
            turn: nextState.turn,
            turnCt: nextState.turnCt,
            actions: nextState.actions,
            buys: nextState.buys,
            coins: nextState.coins,
            waiting: nextState.waiting,
            supply: nextState.supply,
            playedCards: nextState.playedCards,
            throneMe: nextState.throneMe,
            numBridges: nextState.numBridges,
            maskedCard: nextState.maskedCard,
            maskInProgress: nextState.maskInProgress,
            numMerchants: nextState.numMerchants,
            trash: nextState.trash,
            vps: nextState.vps,
            kingdom: nextState.kingdom,
        }
    }
    
    useEffect(()=>{
        // console.log(phase);
    },[phase])
    
    const [refetch, setRefetch] = useState(true);
    useEffect(()=> {
        // console.log(" r e f e t c h ")
        if(!refetch) return;
        if(props.isSpectator) 
        {
            fetch("/api/getKingdom").then(response=>
                {response.json().then((data) => 
                    {
                        data.kingdomCards = data.kingdomCards.sort((a,b) => prices[a]-prices[b])
                        setKingdom(data.kingdomCards)
                        let arr = []
                        sidecards.forEach((card) => arr.push(bigcards.indexOf(card)))
                        setSupply([...data.kingdomCards, ...arr])
                    })
                }
            ).then(
                fetch("/api/getUsers").then(response=>
                {
                    response.json().then((data) =>
                    {
                        data.users = data.users.sort((a,b) => a.localeCompare(b))
                        setPlayers(data.users)
                        setNextPlayer(data.users[(data.users.indexOf(props.cookie.user)+1)%data.users.length])
                    })
                })
            )

            return;
        }
        console.log("ON LOAD...")
        fetch("/api/getState?name="+props.cookie.user).then(response =>
            {
                response.json().then(
                    (data) => {
                        console.log("LOAD DATA")
                        console.log("SAFE LEN SET AS "+data.state.playedCards.length)
                        // console.log(data.state)
                        setSafeLen(data.state.playedCards.length)
                        dispatch([data.state])
                        if(data.state.turn == props.cookie.user && data.state.turnCt==1) 
                            socket.emit("log", {player: props.cookie.user, newTurn: 1})
                        setKingdom(data.state.kingdom)
                        let arr = []
                        sidecards.forEach((card) => arr.push(bigcards.indexOf(card)))
                        setSupply([...data.state.kingdom, ...arr])
                        setPlayer(data.name)
                        setHand(data.hand)
                        setDeck(data.deck)
                        setSelect(data.select)
                        setDiscard(data.discard)
                        dispatchLogs(data.logs)
                        // console.log("Setting phase...")
                        setPhase(data.phase)
                        setLaggedPhase(data.phase-1);
                        // setSentryActive(false)
                        // setPatrolActive(false)
                        // setWishingActive(false)
                        // setNumPassages(-1)
                        // setDisplay([])
                        // setChoiceModal([])
                        setAnyChanges(false);
                    }
                )
            }).then(
                fetch("/api/getUsers").then(response=>
                {
                    response.json().then((data) =>
                    {
                        
                        setPlayers(data.users)
                        setNextPlayer(data.users[(data.users.indexOf(props.cookie.user)+1)%data.users.length])
                        setRefetch(false);
                        console.log("LOAD FINISHED")
                    })
                })
            )

        /*fetch("/api/getUser?name="+props.cookie.user).then(response=>
            {response.json().then(
                (data) => {

                    
                    // console.log(data)
                    setPlayer(data.turns[data.turns.length-1])
                    setHand(data.turns[data.turns.length-1].hand)
                    setDeck(data.turns[data.turns.length-1].deck)
                    setDiscard(data.turns[data.turns.length-1].discard)
                    setPlayedCards([])
                }
            )}).then(
            fetch("/api/getKingdom").then(response=>
                {response.json().then((data) => 
                    {
                        data.kingdomCards = data.kingdomCards.sort((a,b) => prices[a]-prices[b])
                        setKingdom(data.kingdomCards)
                        dispatch([{...state, kingdom: data.kingdomCards}])
                        let arr = []
                        sidecards.forEach((card) => arr.push(bigcards.indexOf(card)))
                        setSupply([...data.kingdomCards, ...arr])
                        let tcs = ['mill','duke','harem','nobles','gardens']

                        for(var i=0; i<10; i++) if(tcs.includes(bigcards[data.kingdomCards[i]])) nextState.supply[i] = 8;
                    })
                }
            )).then(
                fetch("/api/getUsers").then(response=>
                    {
                        response.json().then((data) =>
                        {
                            data.users = data.users.sort((a,b) => a.localeCompare(b))
                            if(data.users.length>2)
                                for(var i=0; i<nextState.supply.length; i++) nextState.supply[i] = 12;
                            nextState.supply[16]=(data.users.length-1)*10;
                            nextState.waiting = nextState.turn = data.users[0]
                            if(data.users[0] == props.cookie.user) socket.emit("log", {player: props.cookie.user, newTurn: true})
                            dispatch([nextState])
                            
                            setPlayers(data.users)
                            setNextPlayer(data.users[(data.users.indexOf(props.cookie.user)+1)%data.users.length])
                        })
                    })
            )*/
    }, [refetch])

    const [gameOver, setGameOver] = useState(false)

    const [allMessages, dispatchMessages] = useReducer(handleMessage, []);
    const [allLogs, dispatchLogs] = useReducer(handleLogs, []);
    const [gameState, dispatchGameState] = useReducer(handleGameState, []);
    function handleGameState(gameState, newGameState) {
        console.log("Updating game state")
        console.log(newGameState)
        if(newGameState && newGameState.refetch)
        {
            console.log("Refetch!")
            setRefetch(true);
            return gameState;
        }
        else if(newGameState && newGameState.user)
        {
            console.log("Adding");
            var shouldBeAdded = true;
            gameState.forEach((gs) => {
                if(gs.user == newGameState.user) shouldBeAdded = false;
            })
            if(shouldBeAdded) return [...gameState, newGameState];
            else return gameState;
        }
        else if(!newGameState.user && !newGameState.refetch)
        {
            console.log("EMISSION")
            socket.emit('my-stats', {user: props.cookie.user, 
                cards: (state.turn == props.cookie.user ? [...deck, ...discard, ...hand, ...state.playedCards] 
                : [...deck, ...discard, ...hand])})
            return gameState;
        }
    }
    useEffect(()=>{
        if(gameState.length == players.length && gameState.length>0) setGameOver(true);
    }, [gameState])

    function handleMessage(allMessages, newMessage) {
        return [...allMessages, newMessage];
    }
    function handleLogs(allLogs, newLog) {
        if(newLog.length > 1) return [...newLog]
        else return [...allLogs, ...newLog];
    }

    const postData = (stateToPost={...state}) => {
        console.log(" p o s t d a t a ")
        let op = {record: {name: props.cookie.user, state: stateToPost, hand: hand, discard: discard, deck: deck, phase: phase, select: select, logs: allLogs}}
        const requestOptions = {
            method:'POST',
            headers:{'Content-Type': 'application/json'},
            body: JSON.stringify(op)
        }
        socket.emit("/api/update", op);
    }

    const getUndo = () => {
        // console.log(" u n d o ")
        const requestOptions = {
            method:'POST',
            headers:{'Content-Type': 'application/json'},
            body: JSON.stringify({user: props.cookie.user, undesLen: (anyChanges ? -1 : state.playedCards.length)})
        }
        fetch("/api/undo", requestOptions).then(()=>{
            socket.emit("refetch", {});
        });
    }

    const getEnd = () => {
        fetch("/delete");
    }

    useEffect(() => {
        socket = io()

        socket.on('otherstate', function(data) {
            // console.log("RECEIVED")
            dispatch([data])
        })

        socket.on('message', function(data) {
            dispatchMessages(data)
        })

        socket.on('log', function(data) {
            // if(data.player == props.cookie.user) postData();
            dispatchLogs([data])
        })

        socket.on('gg', function(data) {
            console.log("GG")
            console.log(data);
            dispatchGameState({})
        })

        socket.on('my-stats', function(data) {
            console.log("Stats")
            console.log(data)
            dispatchGameState(data);
        })

        socket.on('refetch', function(data) {
            dispatchGameState({refetch: true})
        })
    }, [])
    useEffect(()=>{
        if(state.waiting == props.cookie.user) 
        {
            // console.log("I'm king.")
            socket.emit("otherstate", state)
        }
    },[state])

    // useEffect(()=>{
    //     if(state.waiting !=)
    //     socket.emit("otherstate", state)
    // },[state.waiting])

    const removeFromHand = (cards) => 
    {
        let arr = [...hand]
        for(var i=0; i<cards.length; i++)
        {
            arr.splice(arr.indexOf(cards[i]), 1)
        }
        setHand(arr)
    }

    const trashCards = (cards) => 
    {
        dispatch([{...state,
            trash: [...state.trash, ...cards]}])
    }

    const discardCards = (cards) =>
    {
        setDiscard([...discard, ...cards])
    }

    const [cellarTracker, setCellarTracker] = useState(-1)
    useEffect(()=> {
        if(cellarTracker!=-1)
        {
            draw(cellarTracker)
            setCellarTracker(-1)
            setLoading(false)
            setSelect(initialSelect)
        }

    }, [cellarTracker])

    const playCellar=(nextState={...state, actions: state.actions-1})=>{
        // console.log("cellar played")
        nextState.actions += 1
        dispatch([nextState])
        setSelect({type: "hand", number: 1000, msg:"Discard, then draw", upTo: true, selected: [], confirmed: false})
        setLiveActions(0)
    }
    const cellarSelector = (nextState={...state}) => {
        setLoading(true)
        removeFromHand(select.selected)
        discardCards(select.selected)
        socket.emit("log", {player: props.cookie.user, type:"discards "+getAs(select.selected)})
        setCellarTracker(select.selected.length)
    }

    const playChapel=(nextState={...state, actions: state.actions-1})=>{
        // console.log("chapel played")
        dispatch([nextState])
        setSelect({type: "hand", number: 4, msg:"Trash up to 4 cards", upTo: true, selected: [], confirmed: false})
        setLiveActions(0)
    }
    const chapelSelector = (nextState={...state}) => {
        removeFromHand(select.selected)
        socket.emit("log", {player: props.cookie.user, type:"trashes "+getAs(select.selected)})
        trashCards(select.selected)
        setSelect(initialSelect)        
    }
    const playMoat=(nextState={...state, actions: state.actions-1})=>{
        dispatch([nextState])
        draw(2)
        setSelect(initialSelect)
        setLiveActions(0)
    }

    const [harbingerTracker, setHarbingerTracker] = useState(-1)
    useEffect(()=>{
        if(harbingerTracker!=-1)
        {
            if(discard.length > 0)
            {
                setSelect({type: "display", msg:"Topdeck a card", number: 1, upTo: true, selected: [], confirmed: false})        
                setDisplay([...discard])
            }
            else setSelect(initialSelect)
            setLiveActions(0)
            setHarbingerTracker(-1)
        }
    },[harbingerTracker])
    const playHarbinger=(nextState={...state, actions: state.actions-1})=>{
        nextState.actions += 1
        dispatch([nextState])
        draw(1)
        setHarbingerTracker(0)
    }
    const harbingerSelector = (nextState={...state}) => {
        // console.log("Harbingered "+select.selected)
        if(select.selected.length > 0) 
        {
            socket.emit("log", {player: props.cookie.user, type:"topdecks a card"})
            setDeck([...deck, select.selected[0]])
            let arr = [...discard]
            arr.splice(arr.indexOf(select.selected[0]),1)
            setDiscard(arr)
        }
        setSelect(initialSelect)
    }
    const playMerchant=(nextState={...state, actions: state.actions-1})=>{
        nextState.numMerchants += 1
        nextState.actions += 1
        dispatch([nextState])
        draw(1)
        setSelect({...select, confirmed: true})        
        setLiveActions(0)
    }
    const [vassTracker, setVassTracker] = useState(-1)
    useEffect(()=>{
        if(vassTracker!=-1)
        {
            socket.emit("log", {player: props.cookie.user, type:"picks up "+getA(vassTracker)})
            playAction(vassTracker, true);
            setVassTracker(-1)
        }
    }, [vassTracker])
    const playVassal=(nextState={...state, actions: state.actions-1})=>{
        nextState.coins += 2
        dispatch([nextState])
        // console.log("vassal played").
        let arr = [...deck];
        let dar = [...discard];
        if(arr.length == 0)
        {
            // console.log("SHUFFLING DISCARD "+discard)
            arr = (shuffle([...dar]))
            dar = [];
        }
        if(arr.length > 0)
        {
            // console.log("arr here")
            // console.log(arr)
            let topcard = arr.pop();
            // console.log(arr);
            setDeck(arr);
            // console.log("top card "+bigcards[topcard])

            if(arr.length == 0)
            {
                // console.log("futsal shuffle")
                let arr = [...dar];
                setDeck(shuffle(arr))
                dar = [];
            }

            if(actions.includes(bigcards[topcard]))
            {
                setChoiceModal([
                            {message: "Play "+bigcards[topcard]+"", callback: ()=>{
                                setLiveActions(liveActions+1); 
                                setChoiceModal([]);
                                setDiscard(dar);
                                // if(state.throneMe.length!=0)
                                // {
                                    if(state.throneMe.length!=0)
                                        dispatch([{...state,
                                            playedCards: [...state.playedCards, topcard]}]);
                                    setVassTracker(topcard);
                                    // console.log("throney")
                                // }
                                // else {
                                    // socket.emit("log", {player: props.cookie.user, type:"picks up "+getA(topcard)})
                                    // playAction(topcard, true); setChoiceModal([])
                                    // console.log("nothroney")
                                // }
                            }},
                            {message: "Discard", callback: ()=>{
                                setDiscard([...dar,topcard]); setChoiceModal([])
                                // console.log("throwey")
                                socket.emit("log", {player: props.cookie.user, type:"discards "+getA(topcard)})
                                setLiveActions(0)
                            }}
                    ])
            }
            else {
                // console.log(" the card is "+topcard)
                setDiscard([...dar, topcard])
                socket.emit("log", {player: props.cookie.user, type:"discards "+getA(topcard)})
                setLiveActions(0)
            }
        }   
        else {
            setLiveActions(0)
        }
        setSelect(initialSelect)
    }
    const playVillage=(nextState={...state, actions: state.actions-1})=>{
        nextState.actions += 2
        dispatch([nextState])
        draw(1)
        setSelect({...select, confirmed: true})        
        setLiveActions(0)
    }
    const playWorkshop=(nextState={...state, actions: state.actions-1})=>{
        dispatch([nextState])
        setSelect({type: "purchase", priceCap: 4, upTo: true, selected: [], confirmed: false})
        setLiveActions(0)
    }
    const workshopSelector = (nextState={...state}) => {
        setDiscard([...discard, select.selected[0]])
        socket.emit("log", {player: props.cookie.user, type:"gains "+getAs(select.selected)})
        setSelect(initialSelect)
    }
    const playBureaucrat=(nextState={...state, actions: state.actions-1})=>{
        // dispatch([nextState])
        let success = gain('silver', true, nextState)
        if(success) socket.emit("log", {player: props.cookie.user, type:"gains and topdecks a silver"})
        // attack
        goToNextPlayerInAttack(nextState)
        setSelect(initialSelect)
        setLiveActions(0)
    }
    const bureaucratSelector=(nextState={...state})=>{
        removeFromHand(select.selected)
        setDeck([...deck, ...select.selected])
        socket.emit("log", {player: props.cookie.user, type:"topdecks "+getAs(select.selected)})

        goToNextPlayerInAttack()
        setSelect(initialSelect)
    }
    const playMilitia=(nextState={...state, actions: state.actions-1})=>{
        // console.log("playing militia")
        nextState.coins += 2;
        // attack
        goToNextPlayerInAttack(nextState)
        setSelect(initialSelect)
        setLiveActions(0)
    }
    const militiaSelector=(nextState={...state})=>{
        removeFromHand(select.selected)
        discardCards(select.selected)
        socket.emit("log", {player: props.cookie.user, type:"discards "+getAs(select.selected, true)})

        goToNextPlayerInAttack()
        setSelect(initialSelect)
    }
    const playMoneylender=(nextState={...state, actions: state.actions-1})=>{
        dispatch([nextState])
        if(hand.includes(bigcards.indexOf('copper')))
        {
            setChoiceModal([
                {message: "Trash copper for 3 coins", callback: ()=>{ 
                    let arr = hand;
                    arr.splice(arr.indexOf(bigcards.indexOf('copper')), 1)
                    setHand(arr)
                    nextState.coins += 3
                    nextState.trash.push(bigcards.indexOf('copper'))
                    dispatch([nextState])
                    setChoiceModal([])
                    socket.emit("log", {player: props.cookie.user, type:"trashes a copper"})
                }},
                {message: "Pass", callback: ()=>{setChoiceModal([])}}
            ])
        }
        setSelect(initialSelect)
        setLiveActions(0)
    }
    const playPoacher=(nextState={...state, actions: state.actions-1})=>{
        nextState.coins +=1;
        nextState.actions +=1;
        dispatch([nextState])
        draw(1)

        let ct = 0;
        for(var i=0; i<17; i++) if(nextState.supply[i]==0) ct+=1
        if(ct>0) setSelect({type: "hand", msg:"Discard "+(ct==1?"a card":ct+" cards"), number: ct, upTo: false, selected: [], confirmed: false})   
        else setSelect({...select, confirmed: true})        
        setLiveActions(0)
    }
    const poacherSelector = (nextState={...state}) => {
        removeFromHand(select.selected)
        discardCards(select.selected)    
        socket.emit("log", {player: props.cookie.user, type:"discards "+getAs(select.selected)})                
        setSelect(initialSelect)
    }
    const playRemodel=(nextState={...state, actions: state.actions-1})=>{
        dispatch([nextState])
        setSelect({type: "hand", msg:"Trash a card", number: 1, upTo: false, selected:[], confirmed: false})   
        setLiveActions(0)
    }
    const remodelSelector = (nextState={...state}) => {
        if(select.selected.length==0)
        {
            setSelect(initialSelect)
            return
        }
        if(select.type == 'hand')
        {
            removeFromHand(select.selected)
            trashCards(select.selected)
            socket.emit("log", {player: props.cookie.user, type:"trashes "+getAs(select.selected)})
            setSelect({type: "purchase", priceCap: Math.max(0, prices[select.selected[0]]-state.numBridges)+2, upTo: true, selected: [], confirmed: false})
        }
        else if(select.type=="purchase")
        {
            setDiscard([...discard, select.selected[0]])
            socket.emit("log", {player: props.cookie.user, type:"gains "+getAs(select.selected)})
            setSelect(initialSelect)
        }
    }
    const playSmithy=(nextState={...state, actions: state.actions-1})=>{
        dispatch([nextState])
        draw(3)
        setSelect({...select, confirmed: true})
        setLiveActions(0)
    }
    const playThroneroom=(nextState={...state, actions: state.actions-1})=>{
        dispatch([nextState])
        setSelect({type: "hand-action", msg:"Throne", number: 1, upTo: true, selected:[], confirmed: false})
        setLiveActions(0)
    }
    
    const [throneTracker, setThroneTracker] = useState(-1)
    useEffect(()=> {
        if(throneTracker!=-1 && select.type == "")
        {
            playAction(throneTracker, true)
            setLoading(false)
            setThroneTracker(-1)
        }

    }, [throneTracker])
    const throneroomSelector = (nextState={...state}) => {
        if(select.selected.length == 0)
        {
            // console.log("No throning today")
            setSelect(initialSelect)
            return
        }    

        setThroned(throned+1)
        setLiveActions(liveActions+1)
        let card = select.selected[0]
        // console.log("throning "+card)
        socket.emit("log", {player: props.cookie.user, type:"thrones "+getA(card)})

        nextState.playedCards.push(card)
        nextState.throneMe.push(card)
        dispatch([nextState])

        let arr = [...hand]
        arr.splice(arr.indexOf(card),1)
        setHand(arr)
        setSelect(initialSelect)
        setThroneTracker(card)
    }

    const [attackTracker, setAttackTracker] = useState(-1)
    useEffect(()=>{
        if(attackTracker!=-1)
        {
            goToNextPlayerInAttack();
            setSelect(initialSelect)
            setLiveActions(0)
            setAttackTracker(-1)
        }
    },[attackTracker])
    const playBandit=(nextState={...state, actions: state.actions-1})=>{
        // dispatch([nextState])
        let success = gain('gold', false, nextState)
        if(success) socket.emit("log", {player: props.cookie.user, type:"gains a gold"})
        // attack
        setAttackTracker(0)
    }

    const playCouncilroom=(nextState={...state, actions: state.actions-1})=>{
        nextState.buys+=1
        dispatch([nextState])
        draw(4)
        // other ppl draw
        setAttackTracker(0)
    }
    const playFestival=(nextState={...state, actions: state.actions-1})=>{
        nextState.actions+=2
        nextState.buys+=1
        nextState.coins+=2
        dispatch([nextState])
        setSelect({...select, confirmed: true})   
        setLiveActions(0)
    }
    const playLaboratory=(nextState={...state, actions: state.actions-1})=>{
        nextState.actions+=1
        dispatch([nextState])
        draw(2)
        setSelect({...select, confirmed: true})
        setLiveActions(0)
    }
    const playMarket=(nextState={...state, actions: state.actions-1})=>{
        nextState.actions+=1
        nextState.buys+=1
        nextState.coins+=1
        dispatch([nextState])
        draw(1)
        setSelect({...select, confirmed: true})        
        setLiveActions(0)
    }
    const playMine=(nextState={...state, actions: state.actions-1})=>{
        dispatch([nextState])
        setSelect({type: "hand-treasure", msg:"Trash a treasure", number: 1, upTo: true, selected:[], confirmed: false})        
        setLiveActions(0)
    }
    const mineSelector = (nextState={...state}) => {
        if(select.selected.length==0)
        {
            setSelect(initialSelect)
            return;
        }
        if(select.type == 'hand-treasure')
        {
            removeFromHand(select.selected)
            trashCards(select.selected)
            socket.emit("log", {player: props.cookie.user, type:"trashes "+getAs(select.selected)})
            setSelect({type: "purchase-treasure", priceCap: Math.max(0, prices[select.selected[0]]-state.numBridges)+3, upTo:true, selected: [], confirmed: false})
        }
        else if(select.type=="purchase-treasure")
        {
            setHand([...hand, select.selected[0]])
            socket.emit("log", {player: props.cookie.user, type:"gains "+getAs(select.selected)+" to hand"})
            setSelect(initialSelect)
        }
    }

    const [sentryTracker, setSentryTracker] = useState([])
    const [sentryInd, setSentryInd] = useState(0)
    const [sentryActive, setSentryActive] = useState(false)
    const [sentryOptions, setSentryOptions] = useState([])
    const handleSentry = () => {
        (sentryOptions[sentryInd]).callback()
        // setDeck([...deck, ...chosenInds])
        // socket.emit("log", {player: props.cookie.user, type: "orders "+chosenInds.length+" cards"})
        setSentryInd(0)
        setSentryActive(false)

        setSentryOptions([])
        // setSentryTracker([])
        setLiveActions(0)
        // setSelect(initialSelect)
    }
    useEffect(()=> {
        // console.log("CHANGE DETECTED "+sentryTracker)
        let toptwocards = [...sentryTracker]
        if(toptwocards.length == 0) return;
        setSentryActive(true);
        if(toptwocards.length == 2)
        {
            setSentryOptions([
                {message: "Trash "+bigcards[toptwocards[0]]+" Discard "+bigcards[toptwocards[1]], callback: ()=>{
                    trashCards([toptwocards[0]]); 
                    discardCards([toptwocards[1]]); 
                    socket.emit("log", {player: props.cookie.user, type: "trashes "+getA(toptwocards[0])})                    
                    socket.emit("log", {player: props.cookie.user, type: "discards "+getA(toptwocards[1])})                    
                    setChoiceModal([]);
                }},
                {message: "Discard "+bigcards[toptwocards[0]]+" Trash "+bigcards[toptwocards[1]], callback: ()=>{
                    discardCards([toptwocards[0]]); 
                    trashCards([toptwocards[1]]);     
                    socket.emit("log", {player: props.cookie.user, type: "trashes "+getA(toptwocards[1])})                    
                    socket.emit("log", {player: props.cookie.user, type: "discards "+getA(toptwocards[0])})                    
                    setChoiceModal([]);
                }},
                {message: "Discard "+bigcards[toptwocards[0]], callback: ()=>{
                    discardCards([toptwocards[0]]); 
                    socket.emit("log", {player: props.cookie.user, type: "discards "+getA(toptwocards[0])})                    
                    setDeck([...deck, toptwocards[1]]);
                    setChoiceModal([]);
                }},
                {message: "Trash "+bigcards[toptwocards[1]], callback: ()=>{
                    trashCards([toptwocards[1]]); 
                    socket.emit("log", {player: props.cookie.user, type: "trashes "+getA(toptwocards[1])})                    
                    setDeck([...deck, toptwocards[0]])                    
                    setChoiceModal([]);
                }},
                {message: "Discard "+bigcards[toptwocards[1]], callback: ()=>{
                    discardCards([toptwocards[1]]); 
                    socket.emit("log", {player: props.cookie.user, type: "discards "+getA(toptwocards[1])})                    
                    setDeck([...deck, toptwocards[0]]);
                    setChoiceModal([]);
                }},
                {message: "Trash "+bigcards[toptwocards[0]], callback: ()=>{
                    trashCards([toptwocards[0]]);                     
                    socket.emit("log", {player: props.cookie.user, type: "trashes "+getA(toptwocards[0])})                    
                    setDeck([...deck, toptwocards[1]]);
                    setChoiceModal([]);
                }},
                {message: "Trash Both", callback: ()=>{
                    trashCards(toptwocards); setChoiceModal([]);
                    socket.emit("log", {player: props.cookie.user, type:"trashes "+getAs(toptwocards)})
                }},
                {message: "Discard Both", callback: ()=>{
                    discardCards(toptwocards); setChoiceModal([]);
                    socket.emit("log", {player: props.cookie.user, type:"discards "+getAs(toptwocards)})
                }},
                {message: "Leave Both, "+bigcards[toptwocards[1]]+" on top", callback: ()=>{
                    setDeck([...deck,...toptwocards]); setChoiceModal([]);
                }},
                {message: "Leave Both, "+bigcards[toptwocards[0]]+" on top", callback: ()=>{
                    setDeck([...deck,toptwocards[1], toptwocards[0]]); setChoiceModal([]);
                }},
            ])
        }
        else if(toptwocards.length == 1)
        {
            setSentryOptions([
                {message: "Trash "+bigcards[toptwocards[0]], callback: ()=>{
                    trashCards(toptwocards); setChoiceModal([]);
                }},
                {message: "Discard", callback: ()=>{
                    discardCards(toptwocards); setChoiceModal([]);
                }},
                {message: "Leave as is", callback: ()=>{
                    setDeck([...deck,...toptwocards]); setChoiceModal([]);
                }}
            ])
        }

        setSentryTracker([])
        setSelect(initialSelect)
        setLiveActions(0)
    }, [sentryTracker])

    const playSentry=(nextState={...state, actions: state.actions-1})=>{
        nextState.actions+=1
        dispatch([nextState])

        let toptwocards = []
        let arr = [...deck]

        if(arr.length == 0)
        {
            // console.log("SHUFFLING DISCARD "+discard)
            arr = (shuffle([...discard]))
            setDiscard([])
        }
        if(arr.length > 0)
        {
            setHand([...hand, arr.pop()])
        }
        if(arr.length == 0)
        {
            // console.log("SHUFFLING DISCARD "+discard)
            arr = (shuffle([...discard]))
            setDiscard([])
        }
        for(var i=0; i<2; i++)
        {
            if(arr.length > 0)
            {
                toptwocards.push(arr.pop())

                if(arr.length == 0)
                {
                    // console.log("SHUFFLING DISCARD "+discard)
                    arr = (shuffle([...discard]))
                    setDiscard([])
                }
            }
            else break;
        }
        setDeck(arr)
        console.log("Sentry top two")
        console.log(toptwocards)
        setSentryTracker([...toptwocards])
    }
    const playWitch=(nextState={...state, actions: state.actions-1})=>{
        dispatch([nextState])
        draw(2)
        // attack
        goToNextPlayerInAttack(nextState)
        setSelect(initialSelect)
        setLiveActions(0)
    }
    const playArtisan=(nextState={...state, actions: state.actions-1})=>{
        dispatch([nextState])
        setSelect({type: "purchase", msg: "Gain a card up to 5 coins", priceCap: 5, upTo: true, selected: [], confirmed: false})
        setLiveActions(0)
    }
    const artisanSelector = (nextState={...state}) => {
        if(select.type=="purchase")
        {
            setHand([...hand, select.selected[0]])
            socket.emit("log", {player: props.cookie.user, type: "gains "+getA(select.selected[0])})
            setSelect({type: "hand", number: 1, upTo: false, selected: [], confirmed: false})
        }                    
        else if(select.type == 'hand')
        {
            removeFromHand(select.selected)
            setDeck([...deck, select.selected[0]])
            socket.emit("log", {player: props.cookie.user, type: "topdecks a card"})
            setSelect(initialSelect)
        }
    }
    const playCourtyard=(nextState={...state, actions: state.actions-1})=>{
        dispatch([nextState])
        draw(3)
        setSelect({type: "hand", msg:"Topdeck a card", number: 1, upTo: false, selected:[], confirmed: false})
        setLiveActions(0)
    }
    const courtyardSelector = (nextState={...state}) => {
        removeFromHand(select.selected)
        setDeck([...deck, select.selected[0]])
        socket.emit("log", {player: props.cookie.user, type: "topdecks a card"})
        setSelect(initialSelect)
    }
    const playLurker=(nextState={...state, actions: state.actions-1})=>{
        nextState.actions+=1
        dispatch([nextState])
        let trashedActions = state.trash.filter((card) => {return actions.includes(bigcards[card])})
        if(trashedActions.length == 0)
        {
            setSelect({type: "purchase-action", msg: "Trash any supply action", priceCap: 1000, upTo: false, selected: [], confirmed: false})
        }
        else {
            setChoiceModal([
                {message: "Trash action from supply", callback: ()=>{ 
                    setSelect({type: "purchase-action", msg: "Trash any supply action", priceCap: 1000, upTo: false, selected: [], confirmed: false})
                    setChoiceModal([])
                }},
                {message: "Gain action from trash", callback: ()=>{
                    setSelect({type: "display", msg: "Gain Action", number: 1, upTo:false, selected:[], confirmed: false})
                    setChoiceModal([])
                    setDisplay(trashedActions)
                    }}
            ])
        }
        setLiveActions(0)
    }
    const lurkerSelector = (nextState={...state}) => {
        if(select.type=="display")
        {
            let arr = [...nextState.trash]
            arr.splice(arr.indexOf(select.selected[0]),1)
            dispatch([{...nextState,
                trash: arr}])
            setDiscard([...discard, select.selected[0]])
            socket.emit("log", {player: props.cookie.user, type: "gains "+getA(select.selected[0])})
            setSelect(initialSelect)
        }
        else if(select.type=='purchase-action')
        {
            nextState.trash = [...nextState.trash, select.selected[0]]
            socket.emit("log", {player: props.cookie.user, type: "trashes "+getA(select.selected[0])})
            dispatch([nextState])
            setSelect(initialSelect)
        }
    }
    const playPawn=(nextState={...state, actions: state.actions-1})=>{
        dispatch([nextState])
        let arr = [
            {message: "+1 Card +1 Action", callback: ()=>{ 
                socket.emit("log", {player: props.cookie.user, type: "gets an action"})
                nextState.actions+=1
                dispatch([nextState])
                draw(1)
                setChoiceModal([])
            }},
            {message: "+1 Card +1 Buy", callback: ()=>{ 
                socket.emit("log", {player: props.cookie.user, type: "gets a buy"})
                nextState.buys+=1
                dispatch([nextState])
                draw(1)
                setChoiceModal([])
            }},
            {message: "+1 Card +1 Coin", callback: ()=>{ 
                socket.emit("log", {player: props.cookie.user, type: "gets a coin"})
                nextState.coins+=1
                dispatch([nextState])
                draw(1)
                setChoiceModal([])
            }},
            {message: "+1 Action +1 Buy", callback: ()=>{ 
                socket.emit("log", {player: props.cookie.user, type: "gets an action and a buy"})
                nextState.actions+=1
                nextState.buys+=1
                dispatch([nextState])
                setChoiceModal([])
            }},
            {message: "+1 Action +1 Coin", callback: ()=>{ 
                socket.emit("log", {player: props.cookie.user, type: "gets an action and a coin"})
                nextState.actions+=1
                nextState.coins+=1
                dispatch([nextState])
                setChoiceModal([])
            }},
            {message: "+1 Buy +1 Coin", callback: ()=>{ 
                socket.emit("log", {player: props.cookie.user, type: "gets a buy and a coin"})
                nextState.coins+=1
                nextState.buys+=1
                dispatch([nextState])
                setChoiceModal([])
            }},
        ]
        setChoiceModal(arr)  
        setSelect(initialSelect)
        setLiveActions(0)
    }

    const playMasquerade = (nextState={...state, actions: state.actions-1}) => {
        dispatch([nextState])
        draw(2)
        setSelect({type: "hand", masqDone: false, msg: "Select a card to pass", number: 1, upTo: false, selected:[], confirmed: false})
        // uhhhh
        // setSelect({type: "hand", masqDone: true, msg: "Trash", number: 1, upTo: false, selected:[], confirmed: false})
        setLiveActions(0)
    }

    const [maskTracker, setMaskTracker] = useState(-1)
    useEffect(()=> {
        if(maskTracker!=-1)
        {
            setHand([...hand, maskTracker])
            setMaskTracker(-1)
        }
    },[maskTracker])
    const masqueradeSelector = (nextState={...state}) => {
        if(!select.masqDone)
        {
            // console.log("Okay mask time")

            if(select.selected.length == 0) // for now, if empty-handed, can't mask then.
            {
                setSelect(initialSelect)
            }
            // pass card
            let gainedCard = -1
            if(state.maskedCard)
            {
                gainedCard = state.maskedCard
            }
            removeFromHand(select.selected)
            let newState = {...state,
                waiting: nextPlayer,
                maskedCard: select.selected[0],
                maskInProgress: true
            }
            // console.log(nextPlayer)

            dispatch([newState])
            socket.emit("log", {player: props.cookie.user, type:"passes a card"})
            socket.emit("otherstate", newState)

            if(gainedCard>=0) setMaskTracker(gainedCard)
            setSelect(initialSelect)
        }
        else
        {
            if(select.selected.length>0)
                socket.emit("log", {player: props.cookie.user, type: "trashes "+getA(select.selected[0])})
            removeFromHand(select.selected)
            trashCards(select.selected)
            setSelect(initialSelect)
        }
    }
    const playShantytown = (nextState={...state, actions: state.actions-1}) => {
        nextState.actions+=2
        dispatch([nextState])
        // console.log("shantytown played")
        // reveal hand
        var noActions = true
        hand.forEach((card) => {if(actions.includes(bigcards[card])) noActions=false})
        // console.log(noActions+" shanty")
        if(noActions) draw(2)    
        setSelect({...select, confirmed: true})
        setLiveActions(0)
    }

    // const playSwindler = (nextState={...state, actions: state.actions-1}) => {
    //     nextState.coins += 2
    //     dispatch([nextState])
    //     // attack
    //     socket.emit("otherstate", newState)
    //     setLiveActions(0)
    // }

    const [wishingActive, setWishingActive] = useState(false)
    const [wish, setWish] = useState("")
    const playWishingwell = (nextState={...state, actions: state.actions-1}) => {
        nextState.actions += 1
        dispatch([nextState])
        draw(1)
        if(deck.length + discard.length > 0) 
            setWishingActive(true)
        setSelect(initialSelect)
        setLiveActions(0)
    }

    const handleWish = () =>
    {        
        if(deck.length > 0 && deck[deck.length-1] == bigcards.indexOf(wish))
        {
            draw(1)
        }
        else socket.emit("log", {player: props.cookie.user, type: "doesn't gain a card"})
        setWish("")
        setWishingActive(false)
    }

    const playBaron = (nextState={...state, actions: state.actions-1}) => {
        nextState.buys += 1
        dispatch([nextState])
        if(hand.includes(bigcards.indexOf('estate')))
        {
            setChoiceModal([
                {message: "Discard estate for 4 coins", callback: ()=>{ 
                    let arr = hand;
                    arr.splice(arr.indexOf(bigcards.indexOf('estate')), 1)
                    setHand(arr)
                    socket.emit("log", {player: props.cookie.user, type: "discards an estate"})
                    nextState.coins += 4
                    dispatch([nextState])
                    
                    setDiscard([...discard, bigcards.indexOf('estate')])
                    setChoiceModal([])
                }},
                {message: "Gain estate", callback: ()=>{
                    let success = gain('estate')
                    if(success) socket.emit("log", {player: props.cookie.user, type:"gains an estate"})
                    setChoiceModal([])}}
            ])
        }
        else setDiscard([...discard, bigcards.indexOf('estate')]); 
        setSelect(initialSelect)
        setLiveActions(0)
    }

    const playBridge = (nextState={...state, actions: state.actions-1}) => {
        nextState.buys += 1
        nextState.coins += 1
        nextState.numBridges += 1
        // console.log("hit the bridges "+nextState.numBridges)
        dispatch([nextState])
        setSelect({...select, confirmed: true})
        setLiveActions(0)
    }

    const playConspirator = (nextState={...state, actions: state.actions-1}, throned) => {
        nextState.coins += 2
        if(nextState.playedCards.length>=3 || throned)
        {
            nextState.actions += 1
            dispatch([nextState])
            draw(1)
        }
        else dispatch([nextState])
        setSelect({...select, confirmed: true})
        setLiveActions(0)
    }

    const playDiplomat = (nextState={...state, actions: state.actions-1}) => {
        if(hand.length <= 3) nextState.actions += 2
        dispatch([nextState])
        draw(2)
        setSelect({...select, confirmed: true})
        setLiveActions(0)
    }

    const playIronworks = (nextState={...state, actions: state.actions-1}) => {
        dispatch([nextState])
        setSelect({type: "purchase", priceCap: 4, upTo: true, selected: [], confirmed: false})
        setLiveActions(0)
    }
    const ironworksSelector = (nextState={...state}) => {
        let card = bigcards[select.selected[0]]
        socket.emit("log", {player: props.cookie.user, type: "gains "+getA(select.selected[0])})

        if(["gardens", "mill", "estate"].includes(card)) draw(1)
        if(["copper", "silver"].includes(card)) 
        {
            nextState.coins += 1
            dispatch([nextState])
        }
        else if(!["gardens", "estate"].includes(card))
        {
            nextState.actions += 1
            dispatch([nextState])
        }
        setDiscard([...discard, select.selected[0]])
        setSelect(initialSelect)
    }
    const playMill = (nextState={...state, actions: state.actions-1}) => {
        nextState.actions += 1
        dispatch([nextState])
        draw(1)
        setChoiceModal([
            {message: "Discard 2 cards for 2 coins", callback: ()=>{ 
            setSelect({type: "hand", number: 2, upTo: false, selected:[], confirmed: false})
            nextState.coins += 2
            dispatch([nextState])
            setChoiceModal([])
            }},
            {message: "Pass", callback: ()=>{
                setChoiceModal([])
                setSelect(initialSelect)
                socket.emit("log", {player: props.cookie.user, type: "doesn't discard"})
            }}
        ])
        setLiveActions(0)
    }
    const millSelector = (nextState={...state}) => {
        removeFromHand(select.selected)
        discardCards(select.selected)
        socket.emit("log", {player: props.cookie.user, type: "discards "+select.selected.length+" cards"})
        setSelect(initialSelect)
    }
    const playSteward = (nextState={...state, actions: state.actions-1}) => {
        dispatch([nextState])
        setChoiceModal([
            {message: "+2 cards", callback: ()=>{ 
            draw(2)
            setChoiceModal([])
            setSelect(initialSelect)
            }},
            {message: "+2 coins", callback: ()=>{
                socket.emit("log", {player: props.cookie.user, type: "gets 2 coins"})
                nextState.coins += 2
                dispatch([nextState])
                setChoiceModal([])
                setSelect(initialSelect)}},
            {message: "Trash 2 cards", callback: ()=>{
                setSelect({type: "hand", msg: "Trash 2 cards", number: 2, upTo: false, selected:[], confirmed: false})
                setChoiceModal([])}}
        ])
        setLiveActions(0)
    }
    const stewardSelector = (nextState={...state}) => {
        removeFromHand(select.selected)
        trashCards(select.selected)
        socket.emit("log", {player: props.cookie.user, type: "trashes "+getAs(select.selected)})

        setSelect(initialSelect)
    }
    const playMiningvillage = (nextState={...state, actions: state.actions-1}) => {
        nextState.actions += 2
        dispatch([nextState])
        draw(1)
        setChoiceModal([
            {message: "Trash mining village for 2 coins", callback: ()=>{ 
            if(nextState.playedCards[nextState.playedCards.length-1]!=bigcards.indexOf('mining-village'))
                return
            socket.emit("log", {player: props.cookie.user, type: "trashes mining village"})
            nextState.playedCards.splice(-1,1)
            nextState.trash.push(bigcards.indexOf('mining-village'))
            nextState.coins += 2
            dispatch([nextState])
            setChoiceModal([])
            }},
            {message: "Pass", callback: ()=>{
                socket.emit("log", {player: props.cookie.user, type: "doesn't trash"})
                setChoiceModal([])}}
        ])
        setSelect(initialSelect)
        setLiveActions(0)
    }

    const [passagePosition, setPassagePosition] = useState(0)
    const handlePassage = () => {

        let pos = deck.length-passagePosition
        let beg = deck.slice(0,pos)
        let end = deck.slice(pos, deck.length)
        removeFromHand(select.selected)
        socket.emit("log", {player: props.cookie.user, type: "places a card "+passagePosition+" cards down"})
        setDeck([...beg, select.selected[0], ...end])
        setPassagePosition(0)
        setNumPassages(-1)
        setSelect(initialSelect)
    }

    const playSecretpassage = (nextState={...state, actions: state.actions-1}) => {
        nextState.actions += 1
        dispatch([nextState])
        draw(2)
        setSelect({type: "hand", msg: "Place a card in your deck", number: 1, upTo: false, selected:[], confirmed: false})
        setLiveActions(0)
    }

    const [numPassages, setNumPassages] = useState(-1)
    const secretPassageSelector = () => {
        setNumPassages(deck.length+1)
    }

    const playCourtier = (nextState={...state, actions: state.actions-1}) => {
        dispatch([nextState])
        setSelect({type: "hand", msg:"Select a card to courtier", number: 1, upTo: false, selected:[], confirmed: false})
        setLiveActions(0)
    }
    const courtierSelector = (nextState={...state}) => {
        let twos = ["moat", 'bureaucrat', 'militia', 'bandit',
            'witch', 'swindler', 'diplomat', 'mill','minion',
        'replace', 'torturer', 'harem', 'nobles']
        let arr = [
            {message: "+1 action", callback: ()=>{ 
                socket.emit("log", {player: props.cookie.user, type: "gets an action"})
                nextState.actions+=1
                dispatch([nextState])
                setChoiceModal([])
            }},
            {message: "+1 buy", callback: ()=>{ 
                socket.emit("log", {player: props.cookie.user, type: "gets a buy"})
                nextState.buys+=1
                dispatch([nextState])
                setChoiceModal([])
            }},
            {message: "+3 coins", callback: ()=>{ 
                socket.emit("log", {player: props.cookie.user, type: "gets 3 coins"})
                nextState.coins+=3
                dispatch([nextState])
                setChoiceModal([])
            }},                        
            {message: "+1 gold", callback: ()=>{ 
                let success = gain("gold")
                if(success) socket.emit("log", {player: props.cookie.user, type: "gains a gold "})

                setChoiceModal([])
            }},
        ]    
        if(twos.includes(bigcards[select.selected[0]])) {
            arr = [
                {message: "+1 action +1 gold", callback: ()=>{ 
                    nextState.actions+=1
                    // dispatch([nextState])
                    let success = gain("gold", false, nextState)
                    socket.emit("log", {player: props.cookie.user, type: "gets an action "+(success?"and gains a gold ":"")})
                    setChoiceModal([])
                }},
                {message: "+1 buy +1 gold", callback: ()=>{ 
                    nextState.buys+=1
                    dispatch([nextState])
                    let success = gain("gold", false, nextState)
                    socket.emit("log", {player: props.cookie.user, type: "gets a buy "+(success?"and gains a gold ":"")})
                    setChoiceModal([])
                }},
                {message: "+3 Coins +1 gold", callback: ()=>{ 
                    nextState.coins+=3
                    // dispatch([nextState])
                    let success = gain("gold", false, nextState)
                    socket.emit("log", {player: props.cookie.user, type: "gets 3 coins "+(success?"and gains a gold ":"")})                    
                    setChoiceModal([])
                }},
                {message: "+1 Action +1 Buy", callback: ()=>{ 
                    nextState.actions+=1
                    nextState.buys+=1
                    dispatch([nextState])
                    socket.emit("log", {player: props.cookie.user, type: "gets an action and a buy"})
                    setChoiceModal([])
                }},
                {message: "+1 Action +3 Coins", callback: ()=>{ 
                    nextState.actions+=1
                    nextState.coins+=3
                    dispatch([nextState])
                    socket.emit("log", {player: props.cookie.user, type: "gets an action and 3 coins"})
                    setChoiceModal([])
                }},
                {message: "+1 Buy +3 Coins", callback: ()=>{ 
                    nextState.coins+=3
                    nextState.buys+=1
                    dispatch([nextState])
                    socket.emit("log", {player: props.cookie.user, type: "gets a buy and 3 coins"})
                    setChoiceModal([])
                }},
            ]
        }
        setChoiceModal(arr)
        setSelect(initialSelect)
    }
    const playReplace = (nextState={...state, actions: state.actions-1}) => {
        dispatch([nextState])
        setSelect({type: "hand", msg:"Trash a card", number: 1, upTo: false, selected:[], confirmed: false})
        setLiveActions(0)
    }
    const replaceSelector = (nextState={...state}) => {
        if(select.selected.length==0)
        {
            setSelect(initialSelect)
            return
        }
        if(select.type == 'hand')
        {
            socket.emit("log", {player: props.cookie.user, type: "trashes "+getA(select.selected[0])})
            removeFromHand(select.selected)
            trashCards(select.selected)
            setSelect({type: "purchase", priceCap: Math.max(0, prices[select.selected[0]]-state.numBridges)+2, upTo: true, selected: [], confirmed: false})
        }
        else if(select.type=="purchase")
        {
            socket.emit("log", {player: props.cookie.user, type: "gains "+getA(select.selected[0])})
            if(['gardens', 'duchy', 'duke', 'estate', 'province'].includes(bigcards[select.selected[0]]))
            {
                setDiscard([...discard, select.selected[0]])
                // attack
                goToNextPlayerInAttack()
            }
            else setDeck([...deck, select.selected[0]])
            setSelect(initialSelect)
        }
    }


    const [minionTracker, setMinionTracker] = useState(-1)
    useEffect(()=>{
        if(minionTracker!=-1 && hand.length == 0)
        {
            draw(4)
            setMinionTracker(-1)
            goToNextPlayerInAttack()
            setChoiceModal([])
        }
    }, [minionTracker])

    const playMinion = (nextState={...state, actions: state.actions-1}) => {
        nextState.actions += 1
        dispatch([nextState])
        setChoiceModal([
            {message: "+2 coins", callback: ()=>{ 
            socket.emit("log", {player: props.cookie.user, type: "gets 2 coins"})
            nextState.coins += 2
            dispatch([nextState])
            setChoiceModal([])
            setLiveActions(0)
            }},
            {message: "Discard hand", callback: ()=>{
                setDiscard([...discard, ...hand])
                socket.emit("log", {player: props.cookie.user, type: "discards "+getAs(hand)})
                setHand([])
                setMinionTracker(0)
            }}
        ])
        setSelect(initialSelect)
        setLiveActions(0)
    }

    const [patrolTracker, setPatrolTracker] = useState(-1)
    const [patrolInd, setPatrolInd] = useState(0)
    const [patrolActive, setPatrolActive] = useState(false)
    const [patrolOptions, setPatrolOptions] = useState([])
    const handlePatrol = () => {
        // console.log(patrolOptions)
        // console.log(patrolInd)
        let chosenInds = (patrolOptions[patrolInd]).map((card,i)=>bigcards.indexOf(card.substring(0,card.length-1)))
        // console.log(chosenInds)
        setDeck([...deck, ...chosenInds])
        socket.emit("log", {player: props.cookie.user, type: "orders "+chosenInds.length+" cards"})
        setPatrolInd(0)
        setPatrolActive(false)

        setPatrolOptions([])
        setPatrolTracker(-1)
        setLiveActions(0)
        setSelect(initialSelect)
    }
    useEffect(() => {
        if(patrolTracker == -1)
        {
            // console.log("PT 0")
            return;
        }
        else if(patrolTracker == 1)
        {
            // console.log("PT 1")
            draw(3)
            setPatrolTracker(2)
        }
        else if(patrolTracker == 2)
        {
            // console.log("PT 2")
            let choices = []

            let arr = [...deck], newCards = []
        
            for(var i=0; i<4; i++)
            {
                if(arr.length > 0)
                {
                    let card = arr.pop()
                    let tcs = ['mill','duke','harem','nobles','gardens','province','estate','duchy','curse']
                    if(tcs.includes(bigcards[card])) newCards.push(card)
                    else choices.push(card)
                }
    
                if(arr.length==0)
                {
                    arr = (shuffle(discard))
                    setDiscard([])
                }
            }

            setDeck(arr)
            setHand([...hand, ...newCards])
            socket.emit("log", {player: props.cookie.user, type: "adds "+(newCards.length)+" cards to hand"})
            var newNum = 0
            // console.log("CHOICES")
            // console.log(choices)
            for(var i=choices.length-1; i>=0; i--) newNum = 100*newNum + (choices[i]+1)
            setPatrolTracker(newNum)
        }
        else 
        {
            newNum = patrolTracker;
            let choices = []
            while(newNum > 0) 
            {
                choices.push(newNum%100 - 1);
                newNum = Math.floor(newNum/100);
            }
            // console.log("PT 3 "+choices.length)

            let four = [[0,1,2,3],[0,1,3,2],[0,2,1,3],[0,2,3,1],[0,3,1,2],[0,3,2,1],
            [1,0,2,3],[1,0,3,2],[1,2,0,3],[1,2,3,0],[1,3,0,2],[1,3,2,0],
            [2,1,0,3],[2,1,3,0],[2,0,1,3],[2,0,3,1],[2,3,1,0],[2,3,0,1],
            [3,1,2,0],[3,1,0,2],[3,2,1,0],[3,2,0,1],[3,0,1,2],[3,0,2,1]]
    
            let three = [[0,1,2],[0,2,1],[1,0,2],[1,2,0],[2,0,1],[2,1,0]]
            
            let two = [[0,1],[1,0]]
            if(choices.length == 4)
            {
                let arr = four.map((indexes, i) => (indexes.map((ind,j)=>(bigcards[choices[ind]]+" "))))
                setPatrolOptions(arr)
                setPatrolActive(true)
            }
            else if(choices.length == 3)
            {
                let arr = three.map((indexes, i) => (indexes.map((ind,j)=>(bigcards[choices[ind]]+" "))))
                setPatrolOptions(arr)
                setPatrolActive(true)
            }
            else if(choices.length == 2)
            {
                let arr = two.map((indexes, i) => (indexes.map((ind,j)=>(bigcards[choices[ind]]+" "))))
                setPatrolOptions(arr)
                setPatrolActive(true)
            }
            else 
            {
                setDeck([...deck, ...choices])
                socket.emit("log", {player: props.cookie.user, type: "orders 1 card"})

                setPatrolTracker(-1)
                setLiveActions(0)
                setSelect(initialSelect)
            }
        }
    }, [patrolTracker])
    const playPatrol = (nextState={...state, actions: state.actions-1}) => {
        dispatch([nextState])
        setPatrolTracker(1)
    }

    const playTorturer = (nextState={...state, actions: state.actions-1}) => {
        dispatch([nextState])
        draw(3)
        // attack
        goToNextPlayerInAttack(nextState)
        setSelect(initialSelect)
        setLiveActions(0)
    }

    const torturerSelector = (nextState={...state})=> {
        removeFromHand(select.selected)
        discardCards(select.selected)
        socket.emit("log", {player: props.cookie.user, type: "discards "+getAs(select.selected, true)})
        console.log("calling next player "+nextPlayer)
        goToNextPlayerInAttack()
        setSelect(initialSelect)
        setChoiceModal([])
    }

    const playTradingpost = (nextState={...state, actions: state.actions-1}) => {
        dispatch([nextState])
        if(hand.length>1) setSelect({type: "hand", msg:"Trash 2 cards", number: 2, upTo: false, selected:[], confirmed: false})
        else setSelect({type: "hand", msg:"Trash a card", number: 1, upTo: false, selected:[], confirmed: false})
        setLiveActions(0)
    }
    const [tpTracker, setTpTracker] = useState(-1)
    useEffect(()=> {
        if(tpTracker < 0) return;

        let success = gainTH('silver')
        if(success) socket.emit("log", {player: props.cookie.user, type:"gains a silver to hand"})
        setSelect(initialSelect)
        setLoading(false)
        setTpTracker(-1)
    }, [tpTracker])
    const tradingpostSelector = (nextState={...state}) => {
        setLoading(true)
        removeFromHand(select.selected)
        trashCards(select.selected)
        socket.emit("log", {player: props.cookie.user, type: "trashes "+getAs(select.selected)})
        if(select.selected.length==2) { 
            setTpTracker(0)
        }
        else {
            setSelect(initialSelect)
        }

    }
    const playUpgrade = (nextState={...state, actions: state.actions-1}) => {
        nextState.actions += 1
        dispatch([nextState])
        draw(1)
        setSelect({type: "hand", number: 1, msg: "Trash a card", upTo: false, selected:[], confirmed: false})
        setLiveActions(0)
    }

    const upgradeSelector = (nextState={...state}) => {
        if(select.selected.length==0)
        {
            setSelect(initialSelect)
            return
        }
        if(select.type == 'hand')
        {
            removeFromHand(select.selected)
            trashCards(select.selected)
            socket.emit("log", {player: props.cookie.user, type: "trashes "+getA(select.selected[0])})
            let targetPrice = Math.max(0, prices[select.selected[0]]-state.numBridges)+1
            for(var i=0; i<17; i++) 
            {
                if(Math.max(0,prices[supply[i]]-state.numBridges) == targetPrice && state.supply[i]>0) 
                {
                    setSelect({type: "purchase", priceCap: Math.max(0, prices[select.selected[0]]-state.numBridges)+1, upTo:false, selected: [], confirmed: false})
                    return;
                }
            }
            setSelect(initialSelect)
        }
        else if(select.type=="purchase")
        {
            socket.emit("log", {player: props.cookie.user, type: "gains "+getA(select.selected[0])})
            setDiscard([...discard, select.selected[0]])
            setSelect(initialSelect)
        }
    }
    const playNobles = (nextState={...state, actions: state.actions-1}) => {
        dispatch([nextState])
        setChoiceModal([
            {message: "+3 cards", callback: ()=>{ 
            draw(3)
            setChoiceModal([])
            }},
            {message: "+2 actions", callback: ()=>{
                socket.emit("log", {player: props.cookie.user, type: "gets 2 actions"})
                nextState.actions += 2
                dispatch([nextState])
                setChoiceModal([])}}
        ])
        setSelect(initialSelect)
        setLiveActions(0)
    }
 
   const libDraw = (inputArr, arr=[...deck], disc=[...discard], sp=[]) => {
        setHand(inputArr)
        
        if(inputArr.length >= 7) 
        {
            setDiscard([...disc, ...sp])
            setDeck(arr)
            setSidePile([])
            setChoiceModal([])
            setSelect(initialSelect)
            setLiveActions(0) 
            return;
        }

        if(arr.length == 0)
        {
            // console.log("SHUFFLING DISCARD "+discard)
            arr = (shuffle([...disc]))
            disc = []
        }
        if(arr.length > 0)
        {
            let topcard = arr.pop();
            // setDeck(arr);
            // console.log("drew "+bigcards[topcard])
            
            if(arr.length == 0)
            {
                arr = shuffle(disc)
                disc = []
            }

            if(actions.includes(bigcards[topcard]))
            {
                setChoiceModal([
                            {message: "Keep "+bigcards[topcard], callback: ()=>{
                                socket.emit("log", {player: props.cookie.user, type: "keeps a card"})
                                libDraw([...inputArr, topcard], arr, disc, sp)
                            }},
                            {message: "Discard", callback: ()=>{
                                socket.emit("log", {player: props.cookie.user, type: "passes up "+getA(topcard)})
                                sp = [...sp, topcard]; libDraw([...inputArr], arr, disc, sp) 
                            }}
                    ])
                setSelect(initialSelect)
            }
            else 
            {
                socket.emit("log", {player: props.cookie.user, type: "draws a card"})
                libDraw([...inputArr, topcard], arr, disc, sp)
            }
        }
        else 
        {
            setDiscard([...disc, ...sp])
            setDeck(arr)
            setChoiceModal([])
            setSelect(initialSelect)
            setLiveActions(0) 
            return;
        }
    }


    const playLibrary = (nextState={...state, actions: state.actions-1}) => {
        // console.log("Library played")
        dispatch([nextState])
        libDraw([...hand])
    }    

    
    const handleSelect = () => 
    {
        if(select.confirmed && select.type!="action" && select.type!="") {
            let nextState = state
            if(select.type=="hand-action") 
            {
                throneroomSelector()
                return
            }
            if(dipInProgress)
            {
                diplomatSelector()
                return
            }
            switch(bigcards[state.playedCards[state.playedCards.length-1]])
            {
                case "cellar":
                    cellarSelector()
                    break
                case "chapel":
                    chapelSelector()
                    break
                case "harbinger": {
                    harbingerSelector()
                    break
                } case "workshop":
                    workshopSelector()
                    break
                case "poacher":
                    poacherSelector()
                    break
                case "remodel":
                    remodelSelector()
                    break
                case "throne-room": {
                    throneroomSelector()
                    break
                } case "mine": {
                    mineSelector()
                    break
                } case "artisan":
                    artisanSelector()
                    break
                case "courtyard":
                    courtyardSelector()
                    break
                case "lurker": {
                    lurkerSelector()
                    break
                } case "masquerade":
                    masqueradeSelector()
                    break
                case "steward":
                    stewardSelector()
                    break             
                case "ironworks": {
                    ironworksSelector()
                    break
                } case "mill":
                    millSelector()
                    break
                case "courtier": {
                    courtierSelector()
                    break                    
                } case 'replace':
                    replaceSelector()
                    break
                case 'trading-post':
                    tradingpostSelector()
                    break;
                case 'upgrade':
                    upgradeSelector()
                    break
                case 'militia':
                    militiaSelector()
                    break
                case 'bureaucrat':
                    bureaucratSelector()
                    break
                case 'torturer':
                    torturerSelector()
                    break
                case 'diplomat':
                    diplomatSelector()
                    break
                case 'secret-passage':
                    secretPassageSelector()
                    break
                    
            }
        }
    }

    const goToNextPlayerInAttack = (tempState = {...state}) => {
        console.log("moving on in attack...")
        let newState = {...tempState,
            waiting: nextPlayer
        }
        dispatch([newState])
        setMoatsRevealed(0)
        setDipsRevealed(0)
        socket.emit("otherstate", newState)
    }

    const militiaAttack = () => {
        if(hand.length >3)
            setSelect({type:"hand", upTo: false, number: hand.length-3, msg: "Discard down to 3", selected: [], confirmed: false})
        else
            goToNextPlayerInAttack()
    }

    const bureaucratAttack = () => {
        let vicInHand = hand.filter(card => {return victories.includes(bigcards[card])})
        if(vicInHand.length == 0)
        {
            //reveal
            socket.emit("log", {player: props.cookie.user, type: "reveals "+getAs(hand)})

            goToNextPlayerInAttack()
        }
        else if(vicInHand.length == 1)
        {
            removeFromHand(vicInHand)
            socket.emit("log", {player: props.cookie.user, type: "topdecks "+getAs(vicInHand)})
            setDeck([...deck, vicInHand[0]])
            goToNextPlayerInAttack()
        }
        else
        {
            let buChoices = vicInHand.map((card,i) => {return {
                message: "Topdeck "+bigcards[card],
                callback: ()=>{
                    removeFromHand([card])
                    socket.emit("log", {player: props.cookie.user, type: "topdecks "+getA(card)})
                    setDeck([...deck, card])
                    setChoiceModal([])
                    goToNextPlayerInAttack()
                }
            }})
            setChoiceModal(buChoices)
        }
    }


    const banditAttack = () => {
        let arr = [...deck], toptwocards = [], disc = [...discard]
        if(arr.length == 0)
        {
            // console.log("SHUFFLING DISCARD "+discard)
            arr = (shuffle([...disc]))
            disc = []
        }
        for(var i=0; i<2; i++)
        {
            if(arr.length > 0)
            {
                toptwocards.push(arr.pop())

                if(arr.length == 0)
                {
                    // console.log("SHUFFLING DISCARD "+discard)
                    arr = (shuffle([...disc]))
                    disc = []
                }
            }
            else break;
        }
        setDeck(arr)
        // console.log(disc+" after all that and "+toptwocards+" "+disc.length+"")
        let trashable = toptwocards.filter(card => {return treasures.includes(bigcards[card]) && card!=bigcards.indexOf('copper')})
        if(trashable.length == 0)
        {
            setDiscard([...disc, ...toptwocards])
            socket.emit("log", {player: props.cookie.user, type: "discards "+getAs(toptwocards)})

            goToNextPlayerInAttack()
        }
        else if(trashable.length == 1)
        {
            trashCards([trashable[0]])
            if(toptwocards.length == 2) 
            {
                setDiscard([...disc, toptwocards[1-toptwocards.indexOf(trashable[0])]])
                socket.emit("log", {player: props.cookie.user, type: "trashes "+getA(trashable[0])+" and discards "+getA(toptwocards[1-toptwocards.indexOf(trashable[0])])})
            }
            else {
                socket.emit("log", {player: props.cookie.user, type: "trashes "+getA(trashable[0])})
            }
            goToNextPlayerInAttack()
        }
        else
        {
            let baChoices = trashable.map((card,i) => {return {
                message: "Trash "+bigcards[card],
                callback: ()=>{
                    trashCards([card])
                    setDiscard([...disc, toptwocards[1-toptwocards.indexOf(card)]])
                    socket.emit("log", {player: props.cookie.user, type: "trashes "+getA(card)+" and discards "+getA(toptwocards[1-toptwocards.indexOf(card)])})

                    goToNextPlayerInAttack()
                    setChoiceModal([])
                }
            }})
            setChoiceModal(baChoices)
        }
    }

    const witchAttack = () => {
        if(state.supply[supply.indexOf(bigcards.indexOf('curse'))]>0) {
            socket.emit("log", {player: props.cookie.user, type: "gains a curse"})
            let nextState = {...state}
            nextState.supply[supply.indexOf(bigcards.indexOf('curse'))]-=1;
            setDiscard([...discard, bigcards.indexOf('curse')])
            goToNextPlayerInAttack(nextState)
        }
        else goToNextPlayerInAttack()
    }

    const replaceAttack = () => {
        if(state.supply[supply.indexOf(bigcards.indexOf('curse'))]>0) {
            socket.emit("log", {player: props.cookie.user, type: "gains a curse"})
            let nextState = {...state}
            nextState.supply[supply.indexOf(bigcards.indexOf('curse'))]-=1;
            setDiscard([...discard, bigcards.indexOf('curse')])
            goToNextPlayerInAttack(nextState)
        }
        else goToNextPlayerInAttack()
    }
    // const swindlerAttack = () => {

    // }

    const torturerAttack = () => {
        setChoiceModal([
            {message: "Gain curse to hand", callback: ()=>{ 
                if(state.supply[supply.indexOf(bigcards.indexOf('curse'))]>0) {
                    socket.emit("log", {player: props.cookie.user, type: "gains a curse to hand"})
                    let nextState = {...state}
                    nextState.supply[supply.indexOf(bigcards.indexOf('curse'))]-=1;
                    setHand([...hand, bigcards.indexOf('curse')])
                    goToNextPlayerInAttack(nextState)
                }
                else goToNextPlayerInAttack()
                setChoiceModal([])
            }},
            {message: "Discard 2", callback: ()=>{
                setSelect({type: "hand", msg: "Discard 2 cards", number: 2, upTo:false, selected:[], confirmed: false})
                setChoiceModal([])
            }}
        ])
    }

    const minionAttack = () => {
        if(hand.length <= 4) 
        {
            goToNextPlayerInAttack();
            return;
        }
        socket.emit("log", {player: props.cookie.user, type: "discards "+getAs(hand)+" and draws 4"})
        setDiscard([...discard, ...hand])
        setHand([])
        setMinionTracker(0)
    }

    const diplomatSelector = () => {
        removeFromHand(select.selected)
        discardCards(select.selected)
        setDipInProgress(false)
        setDipsRevealed(Math.max(0, dipsRevealed-getOccurences(select.selected, bigcards.indexOf('diplomat'))))
        setSelect(initialSelect)
    }


    const [moatsRevealed, setMoatsRevealed] = useState(0)
    const [dipsRevealed, setDipsRevealed] = useState(0)
    const [dipInProgress, setDipInProgress] = useState(false)


    const [atSoTracker, setAtSoTracker] = useState("not-attacked")
    useEffect(()=>{
        if(atSoTracker === "not-attacked" || atSoTracker === "done") return;
        const Sounds = new Howl({
            src: ["/sounds/zig-zag.mp3"]
        })
        Sounds.play()
        console.log("played attack sound")
        setAtSoTracker("done");
    }, atSoTracker)

    const [plSoTracker, setPlSoTracker] = useState("not-turn")
    useEffect(()=>{
        if(plSoTracker === "not-turn" || plSoTracker === "done") return;
        const Sounds = new Howl({
            src: ["/sounds/pinwheel.mp3"]
        })
        Sounds.play()
        console.log("played sound")
        setPlSoTracker("done");
    }, plSoTracker)

    useEffect(()=> {
        if(state.waiting == props.cookie.user)
        {
            if(state.turn != props.cookie.user)
            {
                // console.log(atSoTracker+" BUT WANNA ATTACK")
                if(atSoTracker!=="done")
                    setAtSoTracker("play")
            }
            else
            {
                // console.log(plSoTracker+" "+focused+" BUT WANNA PLAY")
                if(!focused)
                {
                    if(plSoTracker!=="done")
                        setPlSoTracker("play")
                }
            }
        }
        else
        {
            setAtSoTracker("not-attacked")
            setPlSoTracker("not-turn")
        }
    })

    const handleAttack=(interactiveCard)=>{
        switch(interactiveCard)
        {
            case 'bureaucrat':
                bureaucratAttack()
                break
            case 'militia':
                militiaAttack()
                break
            case 'bandit':
                banditAttack()
                break
            case 'witch':
                witchAttack()
                break
            case 'torturer':
                torturerAttack()
                break
            case 'minion':
                minionAttack()
                break
            case 'replace':
                replaceAttack()
                break
        }
    }

    const [coinsTracker, setCoinsTracker] = useState(0)
    useEffect(()=> {
        if(coinsTracker != state.coins)
        {
            if(state.coins == 0) setCoinsTracker(0)
            else 
            {
                if(state.coins > coinsTracker) setCoinsTracker(state.coins)
            }
        }
    }, [state])

    const [anyChanges, setAnyChanges] = useState(false)
    const [safeLen, setSafeLen] = useState(-1)
    useEffect(()=> {
        if(state.playedCards.length != safeLen) 
        {
            console.log("CHANGE "+safeLen+" "+state.playedCards.length)
            setAnyChanges(true)
            setSafeLen(-1)
        }
    }, [state])

    const [postOnOff, setPostOnOff] = useState(-1)
    useEffect(()=> {
        if(state.waiting == props.cookie.user)
        {
            console.log("waiting on me - postOnOff false")
            if(postOnOff == 1 && hand.length > 0 && state.playedCards.length == 0)
            {
                console.log("CHECKPOINT")
                postData();
                setPostOnOff(0);
            }
            setPostOnOff(-1);
        }
        else
        {
            console.log("not waiting on me pOO"+postOnOff+" handlen "+hand.length+" pClen "+state.playedCards.length)
            if(postOnOff != 0 && hand.length > 0 && state.playedCards.length==0)
            {
                console.log("CHECKPOINT")
                postData();
                setPostOnOff(0);
            }
            else if(postOnOff == -1)
            {
                setPostOnOff(1);
            }
        }
    })
    useEffect(() => {
        if(props.isSpectator) return;
        if(select.type!="" && select.type!="buy" && !select.confirmed) return;
        if(choiceModal.length > 0) return;
        if(display.length > 0) return;
        if(loading) return;
        if(liveActions>0) return;
        if(numPassages>0) return;
        if(wishingActive) return;
        if(patrolActive) return;
        if(sentryActive) return;
        if(phase == 0 && state.waiting != props.cookie.user) return;
        
        if(phase == 0 && select.type!="action" && select.type!="" && select.type!="buy") 
        {
            // postData();
            handleSelect()
            return;
        }

        if(state.throneMe.length>0 && !state.maskInProgress && props.cookie.user == state.turn)
        {
            let nextState = {...state}
            let card = nextState.throneMe[nextState.throneMe.length-1]
            console.log()
            // console.log("playing again "+bigcards[card])//bigcards[state.playedCards[state.playedCards.indexOf(bigcards.indexOf('throne-room'))+1]])
            nextState.throneMe.splice(nextState.throneMe.length-1, 1)
            dispatch([nextState])
            setLiveActions(liveActions+1)
            playAction(card, true, true)
            setThroned(throned-1)
            return;
        }
        let nextState = state
        if(state.waiting == props.cookie.user)
        {
            setPostOnOff(-1);
            // return;
            if(state.turn != props.cookie.user) // react
            {
                // postData();
                let interactiveCard = bigcards[state.playedCards[state.playedCards.length-1]]
                if(interactiveCard == 'council-room')
                {
                    draw(1);
                    goToNextPlayerInAttack();
                    return;
                }
                if(interactiveCard == 'masquerade')
                {
                    if(hand.length > 0)
                    {
                        setSelect({type: "hand", masqDone: false, msg: "Select a Card to pass", number: 1, upTo: false, selected:[], confirmed: false})
                    }
                    else
                    {
                        let newState = {...state,
                            waiting: nextPlayer,
                            maskInProgress: true
                        }
                        dispatch([newState])
                        socket.emit("otherstate", newState)
                    }
                }
                else {
                    
                    if(getOccurences(hand, bigcards.indexOf('diplomat')) > dipsRevealed)
                    {
                        setChoiceModal([
                            {message: "Reveal diplomat", callback: ()=>{
                                socket.emit("log", {player: props.cookie.user, type: "reveals a diplomat"})
                                setDipInProgress(true)
                                setDipsRevealed(dipsRevealed+1)
                                draw(2)
                                setSelect({type: "hand", msg: "Discard 3 cards", number: 3, upTo:false, selected:[], confirmed: false})
                                setChoiceModal([])
                            }},
                            {message: "Pass", callback: ()=>{
                                setDipsRevealed(1000)
                                setChoiceModal([])
                            }},
                        ])
                        return;
                    }
                    if(hand.includes(bigcards.indexOf('moat')) && moatsRevealed==0)
                    {
                        setChoiceModal([
                            {message: "Reveal moat", callback: ()=>{
                                socket.emit("log", {player: props.cookie.user, type: "reveals a moat"})
                                setMoatsRevealed(1)
                                setChoiceModal([])
                                let newState = {...state,
                                    waiting: nextPlayer
                                }
                                dispatch([newState])
                                setMoatsRevealed(0)
                                setDipsRevealed(0)
                                socket.emit("otherstate", newState)
                            }},
                            {message: "Pass", callback: ()=>{
                                setMoatsRevealed(-1)
                                setChoiceModal([])
                            }},
                        ])
                        return;
                    }
                    
                    if(moatsRevealed<=0)
                        handleAttack(interactiveCard)
                }
            }
            else 
            {
                if(state.maskInProgress)
                {
                    setHand([...hand, state.maskedCard])
                    dispatch([{...state,
                        maskedCard: -1,
                        maskInProgress:false,
                    }])
                    setSelect({type: "hand", masqDone: true, msg: "Trash a card", number: 1, upTo: true, selected:[], confirmed: false})
                    return;
                }
                if(phase == 0) 
                {
                    console.log("phase 0 "+state.actions+" actions")
                    if(state.actions > 0)
                    {
                        // console.log("Phase 0")
                        var hasActions = false;
                        for(var i=0; i<hand.length; i++) if(actions.includes(bigcards[hand[i]])) hasActions=true;

                        if(!hasActions)  {
                            setPhase(1);
                            postData();
                            // console.log("No Action Cards, move on")
                        }
                        else if(select.type!="action") setSelect({type: "action", confirmed: false})
                    }
                    else {
                        setPhase(1);
                        postData();
                    }
                }
                if(phase == 1)
                {
                    console.log("phase 1 "+state.buys+" buys "+nextState.coins+" coins")
                    if(state.buys > 0)
                    {
                        // console.log("Silver played? "+nextState.playedCards.includes(bigcards.indexOf('silver')))
                        if(nextState.numMerchants > 0 && nextState.playedCards.includes(bigcards.indexOf('silver')))
                        {
                            // console.log("Updating merchants...")
                            nextState.coins += nextState.numMerchants
                            nextState.numMerchants = 0
                            dispatch([nextState])
                        }

                        if(select.priceCap != nextState.coins)
                        {
                            // console.log("Resetting buys")
                            setSelect({type: "buy", priceCap: nextState.coins})
                        }
                    }
                    else setPhase(2)
                }
                if(phase == 2)
                {
                    console.log("phase 2")
                    // setDiscard([...discard, ...hand, ...state.playedCards])
                    // setSelect(initialSelect)
                    // setHand([3])
                    // draw(5)
                    // dispatch([{...state,
                    //     turn: props.cookie.user,
                    //     waiting: props.cookie.user,
                    //     playedCards: [],
                    //     actions: 1,
                    //     buys: 1,
                    //     coins: 0
                    // }])
                    // setPhase(0)
                }
            }
        }
        else 
        {

        }
    })

    const [playedCardsLen, setPlayedCardsLen] = useState(0)
    // useEffect(() => {
    //     if(props.isSpectator) return;
    //     // if(!["action", "buy"].includes(select.type)) return;
    //     if(state.waiting != props.cookie.user) return;
    //     if(state.playedCards.length == playedCardsLen) return;

    //     setPlayedCardsLen(state.playedCards.length);
    //     console.log("CHANGE "+state.playedCards.length);
    //     postData();
    // }, [state, hand, deck, discard, phase])

    useEffect(() => {
        if(phase == 2)
        {
            let ct = 0;
            for(var i=0; i<17; i++) if(state.supply[i]==0) ct+=1
            if((ct>=3 || ct>=players.length) || state.supply[supply.indexOf(bigcards.indexOf('province'))] == 0)
            {
                //GAME OVER
                socket.emit("gg",{});
                return;
            }
        }
        if(phase == 2)
        {
            // postData();
            setLoading(true)
            setDiscard([...discard, ...hand, ...state.playedCards])
            setHand([])
            setPhase(3)
        }
    }, [phase, discard])

    useEffect(() => {
        if(phase == 3 && hand.length == 0)
        {
            draw(5);
            setPhase(4)
        }
        else if(phase == 4) {
            // console.log("Hit the 4")
            let newState = {...state,
                turn: nextPlayer,
                turnCt: state.turnCt + (players.indexOf(props.cookie.user)==players.length-1 ? 1 : 0),
                waiting: nextPlayer,
                playedCards: [],
                actions: 1,
                buys: 1,
                coins: 0,
                numBridges: 0,
                numMerchants: 0,
                throneMe: []
            }
            socket.emit("log", {player: nextPlayer, newTurn: newState.turnCt})
            socket.emit("otherstate", newState)
            dispatch([newState])
            setSelect(initialSelect)
            setLoading(false)
            setPhase(0)
            setLaggedPhase(-1);
        }
    }, [phase, hand])
    
    const shuffle = (a) => {
        var j, x, i;
        for (i = a.length - 1; i > 0; i--) {
            j = Math.floor(Math.random() * (i+1));
            x = a[i];
            a[i] = a[j];
            a[j] = x;
        }
        return a;
    }

    const getOccurences = (a, el) => {
        let ct = 0
        for(var i=0; i<a.length; i++) if(a[i]===el) ct+=1
        return ct
    }

    const playAction = (idx, freeAction=false, dontadd = false) => {
        let nextState = state
        // if(throned==0) nextState.playedCards.push(idx)
        if(state.throneMe.length == 0 && !dontadd) nextState.playedCards.push(idx)

        if(attackCards.includes(idx)) nextState.waiting = nextPlayer
        if(freeAction) nextState.actions += 1
        dispatch([nextState])
        socket.emit("log", {player: props.cookie.user, type: "plays "+getA(bigcards[idx])})

        // console.log("PLAY "+bigcards[idx])

        switch(bigcards[idx]) {
        case 'cellar':
            playCellar()
            break;
        case 'chapel':
            playChapel()
            break;
        case 'moat':
            playMoat()
            break;
        case 'harbinger':
            playHarbinger()
            break;
        case 'merchant':
            playMerchant()
            break;
        case 'vassal': {
            console.log("here vassal")
            playVassal()
            break;
        } case 'village':
            playVillage()
            break;
        case 'workshop':
            playWorkshop()
            break;
        case 'bureaucrat':
            playBureaucrat()
            break
        case 'militia':
            playMilitia()
            break
        case 'moneylender': {
            playMoneylender()
            break;
        } case 'poacher': {
            playPoacher()
            break;
        } case 'remodel':
            playRemodel()
            break;
        case 'smithy':
            playSmithy()
            break
        case 'throne-room':
            playThroneroom()
            break
        case 'bandit':
            playBandit()
            break
        case 'council-room':
            playCouncilroom()
            break
        case 'festival':
            playFestival()         
            break
        case 'laboratory':
            playLaboratory()
            break
        case 'library':
            playLibrary()
            break;
        case 'market':
            playMarket()
            break
        case 'mine':
            playMine()
            break
        case 'sentry':
            playSentry()
            break
        case 'witch':
            playWitch()
            break
        case 'artisan':
            playArtisan()
            break
        case 'courtyard':
            playCourtyard()
            break
        case 'lurker':
            playLurker()
            break
        case 'pawn': {
            playPawn()
            break
        } case 'masquerade':
            playMasquerade()
            break
        case 'shanty-town':
            playShantytown()
            break
        case 'steward':
            playSteward()
            break
        // case 'swindler':
        //     playSwindler()
        //     break
        case 'wishing-well':
            playWishingwell()
            break
        case 'baron': {
            playBaron()
            break;
        } case 'bridge':
            playBridge()
            break;
        case 'conspirator':
            playConspirator(nextState={...state, actions: state.actions-1}, dontadd)
            break;
        case 'diplomat':
            playDiplomat()
            break;
        case 'ironworks':
            playIronworks()
            break;
        case 'mill':
            playMill()
            break;
        case 'mining-village':
            playMiningvillage()
            break;
        case 'secret-passage':
            playSecretpassage()
            break
        case 'courtier':
            playCourtier()
            break            
        case 'minion':
            playMinion()
            break
        case 'patrol': {
            playPatrol()
            break
        } case 'replace':
            playReplace()
            break
        case 'torturer':
            playTorturer()
            break
        case 'trading-post':
            playTradingpost()
            break
        case 'upgrade':
            playUpgrade()
            break
        case 'nobles':
            playNobles()
            break
        }
    }
    const gainTH = (cardname, toDeck = false, curState={...state}) => {
        if(curState.supply[supply.indexOf(bigcards.indexOf(cardname))]>0) {
            // socket.emit("log", {player: props.cookie.user, type: (toDeck?"topdecks a ":"gains a ")+cardname})
            let nextState = {...curState}
            nextState.supply[supply.indexOf(bigcards.indexOf(cardname))]-=1;
            // if(!toDeck) setDiscard([...discard, bigcards.indexOf(cardname)])
            setHand([...hand, bigcards.indexOf(cardname)])
            dispatch([nextState])
            return true;
        }
        else return false;
    }
    const gain = (cardname, toDeck = false, curState={...state}) => {
        if(curState.supply[supply.indexOf(bigcards.indexOf(cardname))]>0) {
            // socket.emit("log", {player: props.cookie.user, type: (toDeck?"topdecks a ":"gains a ")+cardname})
            let nextState = {...curState}
            nextState.supply[supply.indexOf(bigcards.indexOf(cardname))]-=1;
            if(!toDeck) setDiscard([...discard, bigcards.indexOf(cardname)])
            else setDeck([...deck, bigcards.indexOf(cardname)])
            dispatch([nextState])
            return true;
        }
        else return false;
    }

    const draw = (n) => {
        socket.emit("log", {player: props.cookie.user, type: "draws "+n+" card"+(n>1?"s":"")})
        
        // console.log("DRAW "+n)
        let newCards = []
        let arr = [...deck]

        if(arr.length == 0)
        {
            // console.log("SHUFFLING DISCARD "+discard)
            arr = (shuffle([...discard]))
            setDiscard([])
        }
        for(var i=0; i<n; i++)
        {
            if(arr.length == 0)
            {
                // console.log("SHUFFLING DISCARD "+discard)
                arr = (shuffle([...discard]))
                setDiscard([])
            }
            if(arr.length > 0)
            {
                newCards.push(arr.pop())
            }
            else break;
        }
        // console.log("DECK "+arr)
        // console.log("ADDED TO HAND "+newCards)
        setDeck(arr)
        setHand([...hand, ...newCards])
    }

    const getVPs = () => {
        console.log("TURN "+state.turnCt+": Getting VPs hand "+hashCards(hand)+" deck "+hashCards(deck)+
            " discard "+hashCards(discard)+" select "+select.type+
            " "+(state.turn == props.cookie.user ? state.playedCards : "Not my turn"))
        // console.log("LAs "+liveActions)
        // console.log("numBridges "+state.numBridges)
        // if(!player.deck) return 0
        // console.log(player)
        let totVps = 0, totCards = 0, totGardens = 0, totDukes = 0, totDuchies = 0
        let arr = deck.concat(discard.concat(hand.concat( (state.turn == props.cookie.user ? state.playedCards : []) )))
        console.log("I have "+hashCards2([arr.length])+" cards "+hashCards2([getOccurences(arr, bigcards.indexOf('copper'))])+" "
            +hashCards2([getOccurences(arr, bigcards.indexOf('estate'))]))
        // console.log(arr)
        arr.forEach((card) => {
            if(bigcards[card] == 'province') totVps += 6
            if(bigcards[card] == 'duchy') {totVps += 3; totDuchies+=1}
            if(bigcards[card] == 'estate') totVps += 1
            if(bigcards[card] == 'curse') totVps -= 1
            if(bigcards[card] == 'mill') totVps += 1
            if(bigcards[card] == 'duke') totDukes += 1
            if(bigcards[card] == 'harem') totVps += 2
            if(bigcards[card] == 'nobles') totVps += 2
            if(bigcards[card] == 'gardens') totGardens += 1
            totCards += 1
        })
        
        totVps += Math.floor(totGardens*totCards/10) + totDukes*totDuchies

        if(state.vps[players.indexOf(props.cookie.user)] != totVps && phase<3)
        {
            arr = [...state.vps];
            arr[players.indexOf(props.cookie.user)] = totVps;
            dispatch([{...state,
                vps: arr
            }])
        }
        return totVps
    }

    const buyListener = (e) => {
        // console.log(bigcards[e.currentTarget.id]+" clicked")
        let cardInd = parseInt(e.currentTarget.id) 
        let nextState = {...state}
        // console.log("BUY TYPE "+select.type)
        if(select.type == 'purchase' || select.type == 'purchase-treasure' || select.type == 'purchase-action') {
            let lastCardPlayed = nextState.playedCards[nextState.playedCards.length-1]
            if(bigcards[lastCardPlayed]!='upgrade')
            { 
                // console.log("about to complete purchase")
                if(select.type == 'purchase-treasure' && !treasures.includes(bigcards[cardInd])) return;
                if(select.type == 'purchase-action' && !actions.includes(bigcards[cardInd])) return;
                if(select.priceCap >= Math.max(0, prices[cardInd]-state.numBridges))
                {
                    nextState.supply[supply.indexOf(cardInd)]-=1
                    select.selected.push(cardInd)
                    dispatch([nextState])
                    select.confirmed = true
                }  
            }
            else
            {
                // console.log("type upgrade")
                if(select.priceCap == Math.max(0, prices[cardInd]-state.numBridges))
                {
                    nextState.supply[supply.indexOf(cardInd)]-=1
                    select.selected.push(cardInd)
                    dispatch([nextState])
                    select.confirmed = true
                }
            }
        }
        if(select.type == 'buy') {
            if(coinsTracker == state.coins)
            {
                socket.emit("log", {player: props.cookie.user, type: "possesses "+(coinsTracker)+"$"})
            } 
            if(select.priceCap >= Math.max(0, prices[cardInd]-state.numBridges))
            {
                socket.emit("log", {player: props.cookie.user, type: "buys and gains "+getA(bigcards[cardInd])})
                nextState.supply[supply.indexOf(cardInd)]-=1
                nextState.coins -= Math.max(0, prices[cardInd]-state.numBridges)
                nextState.buys -= 1
                setDiscard([...discard, cardInd])
                dispatch([nextState])
            }
        }
    }

    const getAs = (words, protect=false) => {
        if(words.length==0) return getA(words[0], protect)
        if(Number.isInteger(words[0])) 
        {
            let arr = []
            words.forEach((idx) => arr.push(bigcards[idx]))
            return getAs(arr, protect)
        }
        
        let ret = "";
        supply.forEach((cardInd)=> {
            let card = bigcards[cardInd]
            if(!sidecards.includes(card) && protect) return;
            if(getOccurences(words, card) > 0)
            {
                if(getOccurences(words, card)==1) ret+=getA(card)+", "
                else ret += getOccurences(words, card)+" "+card+(card.endsWith("s")?", ":"s, ")
                // console.log("RET NOW "+ret)
            } 
        })

        if(protect)
        {
            let numActions = 0
            words.forEach((word)=>{
                if(!sidecards.includes(word)) 
                    numActions+=1
            })
            ret += (numActions == 1 ? "a card, " : numActions+" cards, ")
        }

        // console.log(words+" **  "+ret)
        ret = ret.substring(0, ret.length-2)
        let ind = ret.lastIndexOf(",")
        if(ind < 0) return ret;

        ret = ret.substring(0,ind)+" and"+ret.substring(ind+1)
        return ret
    }

    const getA = (word, protect=false) => {
        if(Number.isInteger(word)) return getA(bigcards[word], protect)
        return (protect && !sidecards.includes(word)) ? "a card" : "a"+('aeiou'.includes(word.charAt(0)) ? 'n':'')+" "+word
    }

    useEffect(() => {
        // console.log("pct")
        if(playCardTracker !=-1)
        {
            playAction(playCardTracker)
            setPlayCardTracker(-1)
        }
    }, [playCardTracker])

    const displayClickListener = (e) => {
        // console.log(bigcards[e.currentTarget.id]+" card clicked")
        // console.log("SELECT TYPE "+select.type) 
        
        let cardInd = parseInt(e.currentTarget.id) 

        if(select.type == 'display')
        {
            if(select.selected.length < select.number && getOccurences(select.selected, cardInd) < getOccurences(display, cardInd))
            {
                // console.log("selecting "+cardInd)
                // console.log(selectedCards.length+" is length of selectedCards")
                setSelect({...select,
                    selected: [...select.selected, cardInd]})
                
                let arr = [...selectedCards]
                if(arr.length != stackCards(display).length)
                {
                   for(var i=0; i<stackCards(display).length; i++) arr.push(0) 
                }
                arr[parseInt(e.currentTarget.getAttribute('handind'))] += 1;
                setSelectedCards(arr)
            }
        }
    }

    const hashOn = false;
    const hashCards = (cards) =>
    {
        let ret = []
        if(!hashOn) cards.forEach(card => ret.push(bigcards[card].substring(0,2)))
        else cards.forEach(card => ret.push(Math.floor(Math.random() * (27))*173+card))
        return ret
    }
    const hashCards2 = (cards) =>
    {
        let ret = []
        if(!hashOn) cards.forEach(card => ret.push(card))
        else cards.forEach(card => ret.push(Math.floor(Math.random() * (27))*173+card))
        return ret        
    }

    const [laggedPhase, setLaggedPhase] = useState(-1);
    const cardClickListener = (e) => {
        // console.log(bigcards[e.currentTarget.id]+" card clicked")
        // console.log("SELECT TYPE "+select.type)
        // console.log("PHASE "+phase)
        let cardInd = parseInt(e.currentTarget.id) 

        if(select.type == 'action')
        {
            if(!actions.includes(bigcards[cardInd])) return;
            if(laggedPhase < phase)
            {
                // postData();
                setLaggedPhase(laggedPhase+1);
            }
            setLiveActions(liveActions+1)
            let arr = [...hand]
            arr.splice(arr.indexOf(cardInd),1)
            setHand(arr)
            setPlayCardTracker(cardInd)
            // let nextState = state
            // nextState.playedCards.push(cardInd)
            // dispatch([nextState])
            // socket.emit("turnstatus", nextState)
            // playAction(cardInd)
        }
        if(select.type == 'hand' || select.type=='hand-treasure' || select.type=='hand-action')
        {
            if(select.type=='hand-treasure' && !treasures.includes(bigcards[cardInd])) return;
            if(select.type=='hand-action' && !actions.includes(bigcards[cardInd])) return;

            if(select.selected.length < select.number && getOccurences(select.selected, cardInd) < getOccurences(hand, cardInd))
            {
                setSelect({...select,
                    selected: [...select.selected, cardInd]})
                // console.log(e.currentTarget)
                // console.log(e.currentTarget.getAttribute('handind'))
                // console.log(selectedCards+" & "+e.currentTarget.getAttribute('handind'))
                let arr = [...selectedCards]
                if(arr.length != stackCards(hand).length)
                {
                   for(var i=0; i<stackCards(hand).length; i++) arr.push(0) 
                }
                arr[parseInt(e.currentTarget.getAttribute('handind'))] += 1;
                setSelectedCards(arr)            
            }
        }
        
        if(phase == 1)
        {
            if(!['copper', 'silver', 'gold', 'harem'].includes(bigcards[cardInd])) return;
            if(laggedPhase < phase)
            {
                setLaggedPhase(laggedPhase+1);
            }

            let arr = [...hand]
            arr.splice(arr.indexOf(cardInd),1)
            setHand(arr)

            let nextState = {...state}
            if(bigcards[cardInd] === 'copper') nextState.coins += 1
            if(bigcards[cardInd] === 'silver') nextState.coins += 2
            if(bigcards[cardInd] === 'harem') nextState.coins += 2
            if(bigcards[cardInd] === 'gold') nextState.coins += 3

            nextState.playedCards.push(cardInd)
            console.log("argggg")
            dispatch([nextState])
            // socket.emit("turnstatus", nextState)
        }
    }

    const [autoplayed, setAutoplayed] = useState(false)
    useEffect(()=>{
        if(autoplayed && phase == 1)
        {
            let newHand = []
            let nextState = {...state}
            
            let newCards = []
            hand.forEach((cardInd) => {
                if(!['copper', 'silver', 'gold', 'harem'].includes(bigcards[cardInd])) newHand.push(cardInd)
                else {
                    if(bigcards[cardInd] === 'copper') nextState.coins += 1
                    if(bigcards[cardInd] === 'silver') nextState.coins += 2
                    if(bigcards[cardInd] === 'harem') nextState.coins += 2
                    if(bigcards[cardInd] === 'gold') nextState.coins += 3
                    newCards.push(cardInd)
                }
            })
            newCards.sort()
            nextState.playedCards = [...nextState.playedCards, ...newCards]
            setHand(newHand)
            dispatch([nextState])
        }
        else if(phase!=1) setAutoplayed(false)
    },[autoplayed,phase])

    const undoSelect = () => {
        setSelectedCards([])
        if(select.type != "")
        {
            setSelect({...select,
                selected: []})
        }
    }

    const confirmSelect = () => {
        // console.log("CONFIRMED")
        setSelectedCards([])
        setDisplay([])
        if(select.type != "") 
        {
            setSelect({...select, 
                confirmed: true})
        }
    }

    const stackCards = (cards, preserveOrder=false) => {
        if(!preserveOrder)
        {
            let ret = []
            loop: for(var i=0; i<cards.length; i++)
            {
                for(var j=0; j<ret.length; j++)
                {
                    if(ret[j][0] == cards[i]) {
                        ret[j][1]+=1;
                        continue loop;
                    }
                }
                ret.push([cards[i],1])
            }
            ret.sort((miniA1, miniA2)=>(Math.min(miniA1[0],52)-Math.min(miniA2[0],52) == 0 ? 
                (miniA2[0]%2 - miniA1[0]%2 == 0 ? 
                        miniA1[0]-miniA2[0] 
                        : 
                        miniA2[0]%2-miniA1[0]%2)
                :
                miniA1[0]-miniA2[0])
            )
            return ret;
        }
        else
        {
            let ret=[]
            for(var i=0; i<cards.length; i++)
            {
                if(ret.length>0 && cards[i]==ret[ret.length-1][0]) ret[ret.length-1][1]+=1
                else ret.push([cards[i],1])
            }
            return ret;
        }
    }

    const [message, setMessage] = useState("")
    const [filterOn, setFilterOn] = useState(false)
    const filter = (input) => {
        if(!filterOn) return input;
        let newMessage = input.replace(/\ba\w{2}\b/i, 'a**').replace(/\bd\w{3}\b/i, 'd***')
        // console.log(newMessage)
        newMessage = newMessage.replace(/\bf\w{3}\b/i,'f***').replace(/\c\w{3}\c/i,'c***').replace(/\bb\w{4}\b/i,'b****')
        // console.log(newMessage)
        newMessage = newMessage.replace(/\bs\w{3}\b/i,'s***')
        // console.log(newMessage)
        return newMessage
    }

    const getClassName=(word)=>
    {
        if(word.includes("curse")) return "curse";

        let cn = "normal"
        victories.forEach((card)=>{
            if(word.includes(card)) cn= "green"
        })
        actions.forEach((card)=>{
            if(word.includes(card)) cn= "white"
        })
        treasures.forEach((card)=>{
            if(word.includes(card)) cn= "gold"
        })
        return cn
    }
    const fakeSplit=(sentence)=>
    {
        let ret = [""]
        let arr = sentence.split(" ")
        arr.forEach((word)=>{
            if(word == 'a' || word=='an' || word=='and' || !isNaN(word))
                ret.push(word+" ");
            else
                ret[ret.length-1] += word+" "
        })
        return ret;
    }

    return <>
    {gameOver ? 
    <div className="backdrop">
        <div className="endgame-container">
            <h1 class="big">Game Over</h1>
            {gameState.map((gs,i)=><>
                <h1> {gs.user+": "+state.vps[players.indexOf(gs.user)]+"VP"}</h1>
                <div>
                    {supply.map((card,i)=> (getOccurences(gs.cards, card) > 0 ? 
                        <span
                        class = {victories.includes(bigcards[card]) ? "green" : (treasures.includes(bigcards[card]) ? "gold" : 
                            actions.includes(bigcards[card]) ? "white" : "curse")}>
                            {(getOccurences(gs.cards, card)==1 ? getA(bigcards[card])+", " : 
                            getOccurences(gs.cards, card)+" "+bigcards[card]+(bigcards[card].endsWith("s")?", ":"s, "))}
                        </span> 
                        : <></>))}
                </div>
            
            </>)}
        </div>

    </div>
    :
    <div className="backdrop">
        {(choiceModal.length > 0 ? 
            <div className="modal">
                {choiceModal.map((obj, i) => 
                    <button onClick={obj.callback}>
                        {obj.message}
                    </button>
                )}
            </div>
        : <></>) }

        {(numPassages >= 0 ? 
            <div className="passage">
                <select onChange={(e)=>{
                    setPassagePosition(parseInt(e.target.value))
                }}>
                    {Array.apply(null, Array(numPassages)).map((_, i)=>
                        <option value={i}>{i+(i==0?"(Topdeck)":"")}</option>
                    )}
                </select>
                <button onClick={handlePassage}>Place</button>
            </div>
        :<></>)}

        {wishingActive ? 
        <div className="wish">
            <select onChange={(e)=>{
                setWish(e.target.value)
            }}>
                {supply.map((card, i)=>
                    <option key={i} value={bigcards[card]}>{bigcards[card]}</option>
                )}
            </select>
            <button onClick={handleWish}>Wish</button>
        </div>
        :
        <></>}

        {patrolActive ? 
        <div className="patrol">
            <select onChange={(e)=>{
                // console.log(e.target.value+" VALUE")
                setPatrolInd(parseInt(e.target.value))
            }}>
                {patrolOptions.map((poss, i)=>
                    <option key={i} value={i}>{poss}</option>
                )}
            </select>
            <button onClick={handlePatrol}>Topdeck (first on bottom)</button>            
        </div>
        :
        <></>}

        {sentryActive ? 
        <div className="sentry">
            <select onChange={(e)=>{
                // console.log(e.target.value+" VALUE")
                setSentryInd(parseInt(e.target.value))
            }}>
                {sentryOptions.map((poss, i)=>
                    <option key={i} value={i}>{poss.message}</option>
                )}
            </select>
            <button onClick={handleSentry}>Confirm</button>            
        </div>
        :
        <></>}
        {display.length==0?<></> :
            <div className="display-container">
                <div className={stackCards(display).length > 5 ? "display hand c"+Math.min(stackCards(display).length,13) : "display hand"}>
                    {stackCards(display).map((miniarr, i) => <Card size="big" key={i} highlighted={select.type=="display" ? (selectedCards.length>i?selectedCards[i]:0) : 0} handInd={i} ind={miniarr[0]>=0 ? miniarr[0] : 43} name={bigcards[miniarr[0]]} cardcount={miniarr[1]} condition={select} clicked={displayClickListener}></Card>)}
                </div>
                {!["action", "buy", ""].includes(select.type) ? 
                    <div className="display-buttons">
                        {!select.upTo && select.selected.length < select.number && hand.length >= select.number ? 
                            <button onClick={confirmSelect} disabled>{select.msg}</button>
                        :
                            <button onClick={confirmSelect}>{(select.upTo && select.selected.length==0 ? "Don't ":"")+select.msg}</button>
                        }
                        <button onClick={undoSelect}> Undo selection</button>
                    </div>
                :<></>}
            </div>
        }
        <div className = "game-container">
            <div class="col-left">
                <div className="sidecards">
                    {sidecards.map((name, i) => <Tile size="small" key={i} ind={bigcards.indexOf(name)} name={name} condition={select} numBridges={state.numBridges} clicked={buyListener} price={sidecardPrices[i]} qt={state.supply[i+10]}></Tile>)}
                </div>
                {props.isSpectator ? <></> :
                    <div className="deck">
                        <div className="numVPs">
                            {props.cookie.user.substring(0,5)} 
                            <span>
                                {getVPs()}VP
                            </span>
                        </div>
                        <div className="cards">
                            <Card size="small" 
                                name={discard && discard.length>0 ? bigcards[discard[discard.length-1]] : ""}
                                ind={discard && discard.length>0 ? discard[discard.length-1] : 43}>
                            </Card> 
                            <Card size="small" name="back" cardcount={deck.length}></Card>
                        </div>
                    </div>
                }
            </div>
            <div class="col-center">
                <div className="opponents">
                {state.vps.map((numVp, i)=> (players[i]!=props.cookie.user?
                    <div className="numOVPs">
                        {players[i] ? <>
                            {players[i].substring(0,5)+" "} 
                            <span>
                                {numVp}VP
                            </span>
                        </> : <>
                        {"Undefined "} 
                            <span>
                                {numVp}VP
                            </span>
                        </>}
                    </div>
                :<></>))}
                </div>                

                {kingdomToggle ? 
                <div className="kingdom-display">
                    {kingdom.map((ind,i) => <Card size="big" disp={true} key={i} name={bigcards[ind]}></Card>)}
                </div>
                :<>
                <div className="kingdom">
                    {kingdom.map((ind, i) => <Tile size="big" key={i} ind={ind} name={bigcards[ind]} condition={select} numBridges={state.numBridges} clicked={buyListener} price={prices[ind]} qt={state.supply[i]}></Tile>)}
                </div>
                

                <div className="stats">
                    <div className="lines">
                        <div className="line1">
                            {state.actions+" Actions | "+state.buys+" Buys | "}
                            <img src={"/images/elements/"+state.coins+".png"} class="coin"></img>
                        </div>
                        <div className="line2">
                            {state.waiting != props.cookie.user ? 
                                <div className="line2">Waiting on 
                                    <span className={"color"+players.indexOf(state.waiting)}>
                                        {state.waiting}
                                    </span>
                                </div>
                                :
                                <div className="line2">
                                    {select.type=="purchase" ? <>Gain a card {select.upTo ? "up to ":"costing "} {select.priceCap+" coins"}</> :
                                    (select.type=="purchase-action" ? <> {select.msg} </> :
                                    (select.type=="purchase-treasure" ? <>Gain a treasure {select.upTo ? "up to ":"costing "} {select.priceCap+" coins"}</> :
                                    (select.type=="action" ? <>You may play actions</> :
                                    (select.type=="buy" ? <>You may buy cards</>:
                                    (select.type!="" && select.msg!="" ? <>{select.msg}</>:
                                    <></>
                                    )))))}
                                </div>
                            }
                        </div>
                    </div>
                    <div className="right">
                        {!["purchase", "purchase-action", "purchase-treasure","action", "buy", "", "display"].includes(select.type) ? <>
                            {!select.upTo && select.selected.length < select.number && hand.length >= select.number ? 
                            // <button onClick={confirmSelect} disabled>Confirm</button>
                            <></>
                            :
                            <button onClick={confirmSelect}>{(select.upTo && select.selected.length==0 ? "Skip":"Confirm")}</button>
                            }
                            <button onClick={undoSelect}> Undo selection</button>
                        </>:<>
                        {state.waiting==props.cookie.user && state.turn == props.cookie.user ? 
                            <>
                            {phase == 1 && !autoplayed? <button onClick={()=>setAutoplayed(true)}>Autoplay</button> : <></>}
                            <button onClick={()=> {setPhase((phase+1)%4); setSelect(initialSelect);}}>End {phase==0?" Actions":(phase==1?" Buys":" Phase")}</button>
                            </>
                        :
                        <></>}
                        </>}
                    </div>
                </div>
                {props.isSpectator ? <></>:<>
                    <div className={stackCards(state.playedCards,true).length > 5 ? "played hand c"+Math.min(stackCards(state.playedCards,true).length,13) : "played hand"}>
                        {stackCards(state.playedCards,true).map((miniarr, i) => <Card size="medium" key={i} ind={miniarr[0]>=0 ? miniarr[0]: 43} name={bigcards[miniarr[0]]} cardcount={miniarr[1]}></Card>)}
                    </div>

                    <div className={stackCards(hand).length > 5 ? "hand c"+Math.min(stackCards(hand).length,13) : "hand"}>
                    {stackCards(hand).map((miniarr, i) => <Card size="big" key={i} highlighted={select.type=="display" ? 0 : (selectedCards.length>i?selectedCards[i]:0)} handInd={i} ind={miniarr[0]>=0 ? miniarr[0] : 43} name={bigcards[miniarr[0]]} condition={select} clicked={cardClickListener} cardcount={miniarr[1]}></Card>)}
                </div>
                </>}
                </>
                }
                {/* {selectedCards.map((card,i) => <h1>{card}</h1>)} */}

                

            </div>
            <div class="col-right">
                <div className="top-options">
                    <p class="tab" onClick={()=>setKingdomToggle(!kingdomToggle)}>{kingdomToggle?"Play Area":"Kingdom"}</p>
                    <p class="tab" onClick={()=>setTrashToggle(!trashToggle)}>{trashToggle?"Log":"Trash"}</p>
                    {props.isSpectator?<></>:<>
                    <p class="tab" onClick={getUndo}>Undo</p>
                    <p class="tab" onClick={getEnd}>Resign</p>
                    </>}
                </div>
                <div className="logtrash">
                    {trashToggle ? <>
                        <ul>
                            {state.trash.map((card,i)=><li>{bigcards[card]}</li>)}
                        </ul>
                    </> : <>
                        <div className="logs">
                        {[...allLogs].reverse().map((log, i) => 
                            (log.newTurn ? 
                            <p className="log"><b>{"\nTurn "+log.newTurn+" - "+log.player}</b></p> 
                            :
                            <p className={"log"+(!(log.type.includes("play") || log.type.includes("buy") || log.type.includes("possesses") || log.type.includes("draws 5"))? " indent" : "")}>
                                <span className={"color"+players.indexOf(log.player)}>{log.player.substring(0,2)+" "}</span>
                                {fakeSplit(log.type).map((word,i)=>
                                    <span className={getClassName(word)}>{word}</span>
                                )}
                            </p>)
                        )}
                        </div>
                    </>}
                </div>
                <div className="chat">
                    {filterOn ? 
                        <p class="filter-toggle" onClick={()=>setFilterOn(false)}>Filter - on</p> 
                        : <p class="filter-toggle" onClick={()=>setFilterOn(true)}>Filter - off</p>
                    }
                    <div className="messages">
                    {[...allMessages].reverse().map((msg, i) => 
                        <p className="message"><span className={"color"+players.indexOf(msg.user)}>{msg.user+": "}</span>{filter(msg.message)}</p>
                    )}
                    </div>
                    <input className="inp" placeholder="message" onChange={(e)=>setMessage(e.target.value)} value={message}
                        onKeyDown={(e)=>{
                            if(e.key==='Enter') {
                                socket.emit('message', {user: props.cookie.user, message: (message)}); 
                                setMessage("")
                            }
                        }}
                    ></input>
                </div>
            </div>

        </div>
    </div>
    }
    </>


}