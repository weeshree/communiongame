import React, {useState, useEffect} from 'react'
import './Landing.scss';

export default function Landing(props) {
    

    const [curUser, setCurUser] = useState("")
    const [curPass, setCurPass] = useState("")
    const clicked = (e) => {
        if(curPass != "") return;
        
        props.cookie.updateUser(curUser)
        // fetch("/api/add?name="+curUser).then(response => {
        //     response.json().then(data => {
        //     })
        // })
    }

    // useEffect(() => {
    //     props.cookie.updateUser("");
    // }, [])


    return <>
        <div class="backdrop-waiting">
            <div class="container-waiting">
                <div class="container">
                <label>Secret Key</label>
                <input onChange={(e)=>{setCurPass(e.target.value)}}/>
                <label>Username</label>
                <input onChange={(e)=>{setCurUser(e.target.value)}}/>
                <button onClick={clicked}>
                    Go!
                </button>
                </div>
            </div>
        </div>
    </>
}