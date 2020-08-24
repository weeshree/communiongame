import React, { useState} from "react";

export default function useCookie()
{
    console.log(document)
    let strin = document.cookie
    let ind = strin.indexOf("user=")
    let initValue = ""
    console.log("GETTING COOKIES")
    console.log(strin)
    if(ind>=0)
    {
        ind+=5
        while(ind>=0 && ind<strin.length && strin.charAt(ind)!=';')
        {
            initValue = initValue + strin.charAt(ind)
            ind+=1;
        }
    }

    const [user, setUser] = useState(initValue)    

    const updateUser = (name) => {
        // console.log("Opening "+e.currentTarget.id)
        // console.log(e.currentTarget)
        document.cookie = "user="+name+"; expires=Tue, 5 Sep 2021 12:00:00 UTC";
        console.log("UPDATING USER")
        setUser(name)
    }

    return {
        user:user,
        updateUser: updateUser
    }
}