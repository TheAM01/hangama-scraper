function getEpisodes(socket) {
    
    const urx = window.location.pathname.toLowerCase().split("/");
    
    document.title = `Fetching ${titleCase(urx[1], " ", "-")} Season ${urx[2]}`;

    socket.emit("get_episodes", 
        {
            name: urx[1],
            season: urx[2],
        }
    );

    socket.on("get_episodes", data => {

        document.getElementById("loading-bar-spinner").style.display = "none";
        document.getElementById("processing").style.display = "none";

        console.log(data);
        const table = document.getElementById("downloads_table")

        if (data === 500) {

            table.style.display = "none";
            const title = document.getElementById("title")

            title.setAttribute("class", "error_heading");
            title.innerHTML = "We ran into an error :(<br>Please try again or check your query";

            return table.innerHTML = "error... please try again";

        }

        document.getElementById("title").innerText = `Download ${titleCase(urx[1], " ", "-")} Season ${urx[2]}`;
        document.title = `${titleCase(urx[1], " ", "-")} Season ${urx[2]}`
        
        const headings = element("tr");

        const ep = element("th", "th", null, "Episode");
        const watch = element("th", "th", null, "Watch");
        const download = element("th", "th", null, "Download");

        const tr = element("tr", "tr");

        appendChildren(
            tr,
            [
                ep,
                watch,
                download
            ]
        )

        table.appendChild(tr)

        
        data.forEach(episode => {

            let wrapper = element("tr", "tr")

            let th_epName = element("td", "td")
            th_epName.innerText = episode.full_name;

            let th_epWatch = element("td", "td");
            let watchLink = element("a", "watch_link", {"href": episode.watch, "target": "_blank", "rel": "noopener noreferrer"})
            watchLink.innerText = "Watch";
            th_epWatch.appendChild(watchLink);

            let thepDownload = element("td", "td")
            let downloadLink = element("a", "download_link", {"href": episode.download, "target": "_blank", "rel": "noopener noreferrer"});
            downloadLink.innerText = "Download";
            thepDownload.appendChild(downloadLink);

            appendChildren(
                wrapper,
                [
                    th_epName,
                    th_epWatch,
                    thepDownload
                ]
            );
            
            document.getElementById("return_button").style.display = "flex";
            document.getElementById("processing").style.display = "none";
            table.appendChild(wrapper);
        })
    })
};

function processingAnimation() {

    const e = document.getElementById("processing");

    if (e.style.display === "none") return;

    const processes = [
        "Fetching...",
        "Processing...",
        "Organizing...",
        "Thinking...",
        "Parsing...",
        "Prettifying...",
        "Almost completed..."
    ]

    setTimeout(change, 200)

    function change() {
        if (e.style.display === "none") return console.log("stopped anim")
        e.innerHTML = processes[Math.floor(Math.random()*processes.length)]
        setTimeout(change, 1000)
    }

}


function element(name, className, attributes, innerText) {

    const element = document.createElement(name);
    element.setAttribute("class", className);

    if (attributes) {

        Object.keys(attributes).forEach(attr => {
            element.setAttribute(attr, attributes[attr]);
        })
    }

    if (innerText) element.innerText = innerText;

    return element;

}

function appendChildren(element, children) {

    children.forEach(c => {
        element.appendChild(c);
    });

}

function titleCase(str, join, breaker) {
    var splitStr = str.toLowerCase().split(breaker || ' ');
    for (var i = 0; i < splitStr.length; i++) {
        // You do not need to check if i is larger than splitStr length, as your for does that for you
        // Assign it back to the array
        splitStr[i] = splitStr[i].charAt(0).toUpperCase() + splitStr[i].substring(1);     
    }
    // Directly return the joined string
    return splitStr.join(join || " "); 
}