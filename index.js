import express from "express";
import axios from "axios";
import {load} from "cheerio";
import http from "http";
import {Server} from "socket.io";
import bodyParser from "body-parser";
import path from "path";

const dir = path.resolve()
const app = express();
const server = http.createServer(app);
const io = new Server(server);
const port = process.env.PORT || 3000 || 3001;

app.set('json spaces', 2);
app.use(bodyParser.urlencoded({
    extended: true
}));

server.listen(port, () => {
    console.clear();
    console.log(`Server is online.\nWelcome to Hangama web scraper\nURLs:`);
    console.log(
        {
            local: `http://localhost:${port}`,
            local_IPv4: `http://127.0.0.1:${port}`,
            local_network: `http://192.168.1.108:${port}`,
        }
    )
});

app.get('/', (req, res) => {
    connection(req, '/', res);
    res.sendFile(dir + "/Public/home.html");
});

app.post('/waltuh', (req, res) => {
    res.redirect(`/${req.body.show.replaceAll(" ", "-")}/${req.body.season}`)
})

app.get("/script.js", (req, res) => {
    res.sendFile(dir + "/Public/script.js")
});

app.get("/style.css", (req, res) => {
    res.sendFile(dir + "/Public/style.css")
})

app.get("/:name/:season/", async (req, res) => {
    
    connection(req, "/pretty/"+Object.values(req.params).join('/'), res)

    res.sendFile(dir + "/Public/download.html");

});

app.get("/:type/:name/:season/", async (req, res) => {
    
    connection(req, "/"+Object.values(req.params).join('/'), res)

    let t;

    if (req.params.type.toLowerCase() === "tv") t = "episodes"
    else if (req.params.type.toLowerCase() === "movie" || req.params.type.toLowerCase() === "movies") t = "movies"
    else return res.sendStatus(400);

    const response = await scrapeTv(req.params.name, req.params.season);

    res.send(response);

});

// socket

io.on('connection', (socket) => {

    socket.on("get_episodes", async (data) => {
        const response = await scrapeTvRaw(data.name, data.season);

        io.to(socket.id).emit("get_episodes", response)
    })
});

// functions

async function scrapeTvRaw(name, s) {

    const url = `http://hangama.pk/episodes/${name}-${s}x1/`;

    const response = await axios(url).catch(e => console.log(e.toString()))
    if (!response) return 500;
    const html = response.data;
    const $ = load(html);

    const arr = []

    let server = $("span.server", html).text();
    if (!server) server = "data.hagama.pk"
    
    $('.episodiotitle', html)
    .each(function(i) {
        const epName = $(this).find('a').text()
        arr.push(
            {
                season: `${s}`,
                episode: (i+1).toString(),
                name: epName,
                full_name: `${titleCase(name.replaceAll("-", " "))} S${s} E${i+1} - ${epName}`,
                watch: `http://hangama.pk/episodes/${name.replaceAll(" ", "-")}-${s}x${i+1}`,
                download: `http://${server}/tv/Eng/${titleCase(name, "-", "-")}/S${s}/E${('0'+(i+1).toString()).slice(-2)}-${epName.replaceAll(" ", "-").replaceAll('%60', '')}.mp4`,
            }
        )
    });

    return arr;

}

async function scrapeTvHTML(name, season) {
    const response = await scrapeTvRaw(name, season);

    if (response === 500) return 500

    const arr = [
        `<head><style>
        table {
          font-family: arial, sans-serif;
          border-collapse: collapse;
          width: 100%;
        }
        
        td, th {
          border: 1px solid #dddddd;
          text-align: left;
          padding: 8px;
        }
        
        tr:nth-child(even) {
          background-color: #dddddd;
        }
        </style></head>`,
        `<body><h1>Download ${titleCase(name.replaceAll("-", " "))} season ${season} episodes</h1>`,
        `<table>
        <tr>
            <th>Episode</th>
            <th>Watch</th>
            <th>Download</th>
        </tr>
        `
    ];

    response.forEach(episode => {

        arr.push(
            `
                <tr>
                    <td>${episode.full_name}</td>
                    <td><a href="${episode.watch}">Watch</a></td>
                    <td><a href="${episode.download}">Download</a></td>
                </tr>
            `
        )
        // arr.push(
        //     `${episode.full_name}: <a href="${episode.watch}">Watch</a> or <a href="${episode.download}">Download</a><br>`
        // );
    });

    arr.push("</table></body>");
    return arr.join("")
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

function connection(req, route, res) {

    console.log(`Connection at ${req.headers['x-forwarded-for'] || req.socket.remoteAddress } at ${Date().split(' ').splice(0, 5).join(' ')} (${route}).`);

    if (req.headers['x-forwarded-for'] === "::ffff:192.168.1.101" || req.socket.remoteAddress === "::ffff:192.168.1.101") {
        console.log("Black listed IP blocked.")
        return res.sendStatus(402)
    }
}