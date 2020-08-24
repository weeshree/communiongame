import React, {useState, useEffect} from 'react'

import './Tile.scss';
import Coin from './Coin.js';
import {victories,treasures,actions,bigcards,prices,sidecards,sidecardPrices,attackCards,reactCards,descriptions} from "../constants/constants"
export default function Tile(props) {

    const [type, setType] = useState("mini-action");



    const minime = ['estate', 'duchy', 'province', 'copper', 'silver', 'gold', 'curse']
    useEffect(() => {
        if(sidecards.includes(props.name))
        {
            if(victories.includes(props.name)) setType("mini-victory")
            if(treasures.includes(props.name)) setType("mini-treasure")
            if(props.name==='curse') setType("mini-curse")
        }
        else if(reactCards.includes(props.name)) setType("mini-action-reaction")
        else if(victories.includes(props.name) && actions.includes(props.name)) setType("mini-action-victory")
        else if(victories.includes(props.name) && treasures.includes(props.name)) setType("mini-treasure-victory")
        else if(victories.includes(props.name)) setType("mini-victory")
        else if(actions.includes(props.name)) setType("mini-action")
    })

    const formatTitle = (title) => {
        try {
            return title.replace("-", " ").toUpperCase();
        }
        catch(e)
        {
            console.log(e)
            return "Undefined"
        }
    }

    const clickable = () => {
        if(!props.condition) return false;
        let curPrice = Math.max(0,prices[bigcards.indexOf(props.name)]-props.numBridges)
        let curPriceCap = props.condition.priceCap
        let curType = props.condition.type
        // console.log(props.name+" "+curPrice+" "+curPriceCap+" "+curType)
        if((curType == 'purchase' || curType == 'buy') && props.qt == 0) return false;
        if(curType=='purchase' && !props.condition.upTo && curPriceCap != curPrice) return false;
        if(curPriceCap >= curPrice)
        {
            if((curType=='purchase' || curType=='buy')) return true;
            if(curType.includes('action')) return actions.includes(props.name);
            if(curType.includes('treasure')) return treasures.includes(props.name);
        }

        return false;
    }

    return <>
        {props.qt > 0 ? 

        <div id={props.ind} className={"tile-container "+props.size+"-tile "+(clickable() ? "clickable":"")} onClick={clickable() ? props.clicked : (()=>{}) }>
            <img src={"/images/cards/"+(minime.includes(props.name)?'mini-'+props.name:props.name)+".jpg"} class="picture"></img>
            <div class="content-container">
                <img src={"/images/template/"+type+".png"} class="template"></img>
            </div>
            <div class="content-container">
                <p class="card-title">{formatTitle(props.name)}</p>
            </div>
            <div class="content-container">
                <p class="card-count">{props.qt>=0 ? props.qt : 69}</p>
            </div>
            <div class="coin-container">
                <Coin value={props.price}></Coin>
            </div>
        </div>

        :

        <div className={"tile-container "+props.size+"-tile done"}>
            <img src={"/images/elements/red_cross.png"} class="picture"></img>
            <div class="content-container">
                <img src={"/images/template/"+type+".png"} class="template"></img>
            </div>
            <div class="content-container">
                <p class="card-title">{formatTitle(props.name)}</p>
            </div>
            <div class="content-container">
                <p class="card-count">{props.qt>=0 ? props.qt : 69}</p>
            </div>
            <div class="coin-container">
                <Coin value={props.price}></Coin>
            </div>
        </div>}
    </>
}