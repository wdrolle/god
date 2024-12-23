// ngrok/index.js
// This is the main file for the ngrok project
// It is used to create a web server and get an ngrok endpoint
// run: NGROK_AUTHTOKEN=2qbOrhTxhKmVGywo5qJQwnqj94B_7Vfq7En8CbMi9wfDTPuyk node index.js

const http = require('http');
const ngrok = require('@ngrok/ngrok');

// Create webserver
http.createServer((req, res) => {
	res.writeHead(200, { 'Content-Type': 'text/html' });
	res.end('Congrats you have created an ngrok web server');
}).listen(8080, () => console.log('Node.js web server at 8080 is running...'));

// Get your endpoint online
ngrok.connect({ addr: 8080, authtoken_from_env: true })
	.then(listener => console.log(`Ingress established at: ${listener.url()}`));