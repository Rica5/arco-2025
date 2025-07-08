const express = require("express");
const app = express();
const path = require("path")
const fs = require('fs');
const cookieSession = require('cookie-session');
const { fetchData, restartBrowser } = require('./scpraping/mockScrapper');
const sleep = require("./scpraping/helper");   // async sleep method
const cors = require("cors");
require('dotenv').config()
const bodyParser = require("body-parser");
const accounts = [
    {
        email: "mdg.patricia@gmail.com",
        password: "Pa!2025@MdG_7xK#"
    },
    {
        email: "mdg.ovamampianina@gmail.com",
        password: "Ov!2025@MdG_Xz9#"
    },
    {
        email: "m.nir.niry.optimumsolutions@gmail.com",
        password: "Ni!2025@Opti_N6!r"
    },
    {
        email: "m.ate.tafita.optimumsolutions@gmail.com",
        password: "Ta!2025@Opti_A3!t"
    },
    {
        email: "m.tsi.tsiory.optimumsolutions@gmail.com",
        password: "Ts!2025@Opti_L8!t"
    },
    {
        email: "m.saf.safidy.optimumsolutions@gmail.com",
        password: "Sa!2025@Opti_K4!s"
    },
    {
        email: "niven@optimumsolutions.eu",
        password: "Ni!2025@Opti_U7!v"
    },
    {
        email: "mdg.sehenoemma@gmail.com",
        password: "Se!2025@MdG_M5!e"
    }
];



const PORT = process.env.PORT || 8080;

var scapStatus = {
    data: false,
    onScrap: false,
}

var data = {
    rows: []
}

app.use(cookieSession({
    name: 'session',
    secure: true,
    httpOnly: true,
    keys: [process.env.SESSION_SECRET || 'M0YkLbI^#ej4g5@V&8rTzXmA$Jp!2nWsQ#uC^HT*v7KpZxF&b!NhqRgM$DLvYX9c'],
    maxAge: 12 * 60 * 60 * 1000 // 24h
}));

async function setScrapOn() {
    return new Promise((resolve) => {
        console.log("!! Scrap status ON")
        scapStatus.onScrap = true
        resolve(true)
    })
}

function requireAuth(req, res, next) {
    if (req.session.loggedIn) {
        next();
    } else {
        res.redirect('/');
    }
}

async function setScrapOff() {
    return new Promise((resolve) => {
        console.log("!! Scrap status Off")
        scapStatus.onScrap = false
        resolve(false)
    })
}

async function waitForScrap(scapStatus) {       // wait scraping to be done
    (function listen() {
        setTimeout(
            () => {
                if (scapStatus.status === true) listen
                else return
            }
            , 2000)
    })
}

// start the browser
async function handleBrowser() {
    console.log("[browser] first init, onScrap == true")
    await setScrapOn()
    await restartBrowser()
    await setScrapOff()
    console.log("[browser] first Browser ready, onScrap == false")

    setInterval(async () => {      // auto restart browser
        if (scapStatus.onScrap === false) {
            await setScrapOn()
            console.log(">>> Restarting browser ... scraStatusOn")
            await restartBrowser()
                .then(async () => {
                    await setScrapOff()
                    console.log(">>> Browser ok, scrap status off")
                })
        }
        else {
            await waitForScrap(scapStatus)
                .then(async () => {
                    await setScrapOn()
                    console.log(">>> Restarting browser ... scraStatusOn")
                    await restartBrowser()
                        .then(async () => {
                            await setScrapOff()
                            console.log(">>> Browser ok, scrap status off")
                        })
                })
        }
    }, 1020000)
}




async function handleScraping(req, res, status) {
    if (status.onScrap === false) {   // no scraping on, so start it
        status.onScrap = true;
        console.log('>> Scrap on <<')

        let data = await fetchData()
        console.log('<< Scrap end >>')

        return data
    }
    if (status.onScrap === true) {         // wait for scraping to be done
        await waitForScrap(scapStatus)
        await sleep(10000)
        return data.rows
    }
    else
        res.send('ERROR : handling event scrap && data')
}

app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');
app.use(express.static('public'));
app.use(cors());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

app.get('/', (req, res) => {
    console.log('Login after', req.session.loggedIn);
    if (req.session.loggedIn) {
        if (data.rows.length > 0)
            res.render('data', { rows: data.rows });
        else
            res.render('index');
    }
    else {
        res.render('login', { err: "" })
    }
});
app.post('/start', (req, res) => {
    const { user, password } = req.body;

    const matchedAccount = accounts.find(account =>
        account.email.trim() === user && account.password.trim() === password
    );

    if (matchedAccount) {
        req.session.loggedIn = true;
        console.log('Login success', req.session.loggedIn);

        if (data.rows.length > 0)
            res.render('data', { rows: data.rows });
        else
            res.render('index');
    } else {
        res.render("login", { err: "Nom d'utilisateur ou mot de passe incorrect" });
    }
});

app.get('/data', requireAuth, async (req, res) => {
    data.rows = await handleScraping(req, res, scapStatus)
    res.render('data', { rows: data.rows })
    scapStatus.status = false   // okkk simultanee
    await setScrapOff()
    console.log('Scrap off :: data rendered')
})

app.get('/download', requireAuth, async (req, res) => {
    await waitForScrap(scapStatus)
    try { res.download('./public/assets/batch.xls'); }
    catch (e) { console.log('Download error ::' + e) }
})

const server = app.listen(process.env.PORT || PORT, async () => {
    const port = server.address().port;
    await handleBrowser()
    console.log(`Express is working on port ${port}`);
});

app.get('/logout', (req, res) => {
    req.session.loggedIn = false;
    res.render('login', { err: "" })
});


// node.js version with stable puppeeter

// Lambda runtime Node.js 14.x
// Puppeteer-core version 10.1.0
