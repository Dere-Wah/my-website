import { useState, useEffect } from 'react';

export default function AgeDisplay(){
    const [type, setType] = useState("years");
    const [unixTime, setUnixTime] = useState(Date.now() / 1000);

    /**
     * Set up an interval to update the time every second
     * 
     * Returns a function to clear the interval when the component unmounts
     */
    useEffect(() => {
        const intervalId = setInterval(() => {
            setUnixTime(Date.now() / 1000);
        }, 1000);

        return () => {
            clearInterval(intervalId);
        };
    // Only run this effect once, on mount
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);


    let types = ["seconds", "mcdays", "years"];

    function handleClick() {
        let curr = type;
        while(curr == type){
            curr = types[Math.floor(Math.random()*(types.length))]
        }
        setType(curr);
    }

    const birthDateUnix = new Date('2003-08-29').getTime() / 1000;
    const currentUnix = unixTime;
    const age = Math.floor(currentUnix - birthDateUnix);

    let display_number = null;
    let display_unit = null;
    let display_icon = null;

    switch(type){
        case "seconds":
            display_number = age.toString();
            display_unit = " seconds";
            display_icon = "../NotoHourglassNotDone.svg";
            break;
        case "mcdays":
            display_number = Math.floor(age*1000 / 1200.0)/1000 ;
            display_unit = " Minecraft days"
            display_icon = "../NotoPick.svg"
            break;
        case "years":
            display_number = Math.floor((age / (24 * 60 * 60 * 365.25)));
            display_unit = " years"
            display_icon = "../NotoBirthdayCake.svg";
            break;           
    }

    return(
        <button onClick={handleClick} className="inline-flex w-fit items-center border border-ebony-clay-100/20 bg-ebony-clay-950/50 rounded-md px-1 h-6 font-semibold hover:underline hover:cursor-pointer">
            {display_icon != null && <img src={display_icon} className="h-2/3 pe-1"></img>}
            <span>{display_number.toString() + display_unit}</span>
        </button>
    )
}