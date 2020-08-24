import React, {useState, useEffect} from 'react'

import './Card.scss';
import Coin from './Coin.js';
import {victories,treasures,actions,bigcards,prices,sidecards,sidecardPrices,attackCards,reactCards,descriptions} from "../constants/constants"


export default function Card(props) {


    const [type, setType] = useState("action")
    const formatTitle = (title) => {
        if(!title) console.log(props.ind+" has undefined title")
        return title.replace("-", " ").toUpperCase();
    }

    useEffect(() => {
        if(sidecards.includes(props.name))
        {
            if(victories.includes(props.name)) setType("victory-basic")
            if(treasures.includes(props.name)) setType("treasure-basic")
            if(props.name==='curse') setType("curse-basic")
        }
        else if(reactCards.includes(props.name)) setType("action-reaction")
        else if(victories.includes(props.name) && actions.includes(props.name)) setType("action-victory")
        else if(victories.includes(props.name) && treasures.includes(props.name)) setType("treasure-victory")
        else if(victories.includes(props.name)) setType("victory")
        else if(actions.includes(props.name)) setType("action")
        else if(props.name==='curse') setType("curse-basic")
    })

    const clickable = () => {
        // console.log(props.handInd+"_"+props.highlighted+"_"+props.name)
        if(props.condition && props.condition.type=='display') return true;
        if(props.condition && props.condition.type=='hand') return true;
        if(props.condition && props.condition.type.includes('action')) return actions.includes(props.name);
        if(props.condition && props.condition.type.includes('treasure')) return treasures.includes(props.name);
        if(props.condition && props.condition.type=='buy') return treasures.includes(props.name);
        return false;
    }

    const getTags = () => {
        if(actions.includes(props.name)&&victories.includes(props.name)) return "Action-victory"
        if(treasures.includes(props.name) && victories.includes(props.name)) return "Treasure-victory"
        if(attackCards.includes(props.name)) return "Action-attack"
        if(props.name=="moat" || props.name == "diplomat") return "Action-reaction"
        if(props.name == "curse") return "curse"
        if(actions.includes(props.name)) return "Action"
        if(treasures.includes(props.name)) return "Treasure"
        if(victories.includes(props.name)) return "Victory"
    }
    const getDescription = () => {
        for(var i=0; i<descriptions.length; i++)
        {
            if(descriptions[i].name == props.name)
            {
                return descriptions[i];
            }
        }
        return {}
    }
    const getBolds = () => {
        if(sidecards.includes(props.name)) return;

        let ret = []
        let desc = getDescription()
        if(desc.c > 0) ret.push("+"+desc.c+" Card"+(desc.c>1?"s":""))
        if(desc.a > 0) ret.push("+"+desc.a+" Action"+(desc.a>1?"s":""))
        if(desc.b > 0) ret.push("+"+desc.b+" Buy"+(desc.b>1?"s":""))
        return ret;
    }
    const getPlusCoins = () => {
        if(sidecards.includes(props.name)) return;
        
        let desc = getDescription()
        if(desc.o > 0) return desc.o; 
        else return 0;
    }
    const getPlusVPs = () => {
        if(!victories.includes(props.name)) return "";
        if(props.name == "gardens") return "For every 10 cards, worth 1"
        if(props.name == "duke") return "For every duchy, worth 1"
        if(props.name == "province") return "6"
        if(props.name == "duchy") return "3"
        if(props.name == "harem" || props.name == "nobles") return "2"
        return "1"
    }
    if(props.name === 'back') {
        return <>
            <div class={"card-container "+props.size+"-card back"}>
                <img src={"/images/cards/"+props.name+".jpg"} class="picture"></img>
                {props.cardcount > 0 ? 
                    <div class="content-container cardcount-container">
                        <p class="card-count">{props.cardcount}</p>
                    </div>
                    :
                    <></>} 
            </div>
        </>
    }
    if(props.name === '') {
        return <div class={"card-container "+props.size+"-card empty"}></div>
    }
    return <>
        <div class={"card-container "+props.size+"-card "+(clickable() ? "clickable ":"")+(props.highlighted > 0 ? "highlighted ":"")
            +(props.disp?"relative ":"")} 
         handind={props.handInd} id={props.ind} onClick={clickable() ? props.clicked : (()=>{}) }>
            <img src={"/images/cards/"+props.name+".jpg"} class="picture"></img>
            {props.cardcount && props.cardcount>1 ? 
                    <div class="content-container cardcount-container">
                        <p class="card-count">{props.cardcount}</p>
                    </div>
                    :
                    <></>}            
            {props.condition && props.condition.number && props.condition.number>1 && props.highlighted>0 ?
            <div class="clickcount"> 
                {props.highlighted}
            </div>:<></>}
            <div class="content-container">
                <img src={"/images/template/"+type+".png"} class="template"></img>
            </div>
            <div class="content-container">
                <p class="card-title">{formatTitle(props.name)}</p>
            </div>
            {sidecards.includes(props.name)?<></> :
                <div class="desc-container">
                    {getBolds().map((words,i)=>
                    <p class="bolded" key={i}>{words}</p>)}
                    {getPlusCoins()>0 ? 
                        <p class="bolded">+<span class="coin-span"><img src={"/images/elements/"+getPlusCoins()+".png"}></img></span></p>
                        :<></>
                    }
                    {getPlusVPs().length>0 ? 
                        <p class="big-bolded">{getPlusVPs()+" "}<span class="vic-span"><img src={"/images/elements/victory-symbol.png"}></img></span></p>
                        :<></>
                    }
                    <p>{getDescription().desc}</p>
                </div>
            }
            <div class="bottom-container">
                <p class="card-type">{getTags()}</p>
            </div>
            <div class="coin-container">
                <Coin value={prices[bigcards.indexOf(props.name)]}></Coin>
            </div>
        </div>
    </>
}