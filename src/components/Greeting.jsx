

export default function Greeting(){

    const greetings = ["Hey there.", "Hello there.", "Hello, friend.", "Ciao.", "Welcome.", "<TBD> INVENT A CAPTION"]
    var greet = ""
    greet = greetings[Math.floor(Math.random()*(greetings.length))]

    return(
        <div className="pl-5 text-4xl font-extrabold pb-8 text-ebony-clay-200 animate-fall transition-all duration-300 tracking-[-0.075em]">
            {greet}
        </div>
    )
}