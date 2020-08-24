import React, {useState, useEffect} from 'react'

// import './Coin.scss';

export default function Coin(props) {
    return <>
            <div class="coin-subcontainer">
                <img src={"/images/elements/"+props.value+".png"} class="coin"></img>
            </div>
    </>
}