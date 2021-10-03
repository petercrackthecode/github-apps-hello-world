#!/usr/bin/env node
// const logger = require('pino')({ level: process.env.LOG_LEVEL || 'info' });

// const { Octokit } = require('@octokit/core');
// const { createAppAuth } = require('@octokit/auth-app');

// const appCredentials = require('./lib/app-credentials');

// async function main() {
//   try {
//     // Instantiate new Octokit client
//     const octokit = new Octokit({
//       baseUrl: `https://${process.env.GHE_HOST}/api/v3`,
//       authStrategy: createAppAuth,
//       auth: {
//         ...appCredentials
//       }
//     });

//     // Create issue in demo-days/Spoon-Knife
//     // https://docs.github.com/en/rest/reference/issues#create-an-issue
//     const issue = await octokit.request('POST /repos/:owner/:repo/issues', {
//       owner: 'demo-days',
//       repo: 'Spoon-Knife',
//       title: 'Hello world',
//       body:
//         ':wave: :earth_americas:\n\n![fellowshipoftheclaps](https://user-images.githubusercontent.com/27806/91333726-91c46f00-e793-11ea-9724-dc2e18ca28d0.gif)'
//     });
//     logger.trace(issue);

//     process.stdout.write(`${issue.data.html_url} 🚀\n`);
//   } catch (e) {
//     logger.error(e);
//     process.exit(1);
//   }
// }

// main();
const express = require(`express`);
const path = require(`path`);
const cors = require(`cors`);
const SmeeClient = require(`smee-client`);
const axios = require(`axios`);

require("dotenv").config();

const smee = new SmeeClient({
    source: "https://smee.io/pQlQXdWuaNoGhrB4",
    target: `${process.env.MAIN_URL}:${process.env.PORT}/events`,
    logger: console,
});

const events = smee.start();

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const GITHUB_ACCESS_TOKEN_ENDPOINT =
    "https://github.com/login/oauth/access_token";

const stringToResponseObj = (str) => {
	const obj = {};

	for (let ele of str.split("&")) {
		const [key, value] = ele.split("=");
		(value !== undefined && value !== null) && (obj[key] = value);
	}

	return obj;
};

let responseObj = null;

const auth = async (req, res, next) => {
	res.setHeader('Content-Type', 'text/html');

    if (req && req.query) {
        console.log(req.query);

		let config = {
			method: "post",
			url: `${GITHUB_ACCESS_TOKEN_ENDPOINT}?client_id=${process.env.CLIENT_ID}&client_secret=${process.env.CLIENT_SECRET}&code=${req.query.code}`,
			headers: {
				Cookie: "_device_id=cc8bff1e24c6ba9515fb70faad263763; _octo=GH1.1.1257953934.1625946966; logged_in=no",
			},
		};

        await axios(config)
			.then(response => {
				responseObj = stringToResponseObj(response.data);
			})
            .catch(function (error) {
                console.log(error);
				console.log(`{message: "Unknown error in query parsing"}`);
				const requestError = new Error("Unable to send POST requests to Github");
				next(requestError);
            });

       	console.log(`{ message: "Received the query" }`);
		next();
    } else {
		console.log(`{ message: "No query given" }`);
		const error = new Error("No access token");
		next(error);
	}
}

app.all('*', auth);

app.get(`/`, (req, res, next) => {
	res.sendFile(path.join(__dirname, `views/success.html`));
});

app.post('/create-team', (req, res, next) => {
	if (!responseObj) {
		const error = new Error("No access token");
		next(error);
	}
	

});

app.post("/events", (req, res, next) => {
    events.close();
    res.status(200).json({
        message: "received the event from webhook",
    });
});

app.use((error, req, res, next) => {
	res.sendFile(path.join(__dirname, 'views/404.html'));
});

app.listen(process.env.PORT || 5000, () => {
    console.log(`App is running at port ${process.env.PORT || 5000}`);
});
