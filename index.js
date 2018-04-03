// Express
var express = require('express');
var app = express();
const bodyParser = require('body-parser');
//var axios = require('axios');

var cvs = require('./cloud-vision-server.js');

var port = process.env.PORT || 3000;

//access control for port for frontend
// app.use(bodyParser.json(), function(req, res, next) {
// 	//allow multiple origins
// 	var allowedOrigins = [apiURL, 'http://localhost:8080', 'http://localhost:3000'];
// 	var origin = req.headers.origin;
//   	if(allowedOrigins.indexOf(origin) > -1){
//         res.header('Access-Control-Allow-Origin', origin);
//   	}
//     res.header("Access-Control-Allow-Credentials", 'true');
//     res.header(
//       "Access-Control-Allow-Headers",
//       "Origin, X-Requested-With, Content-Type, Accept, Authorization"
//     );
//     next();
// });

app.post('/imgData', (req, res) => {
    console.log("GOT request sent!");
    console.log(req);
    //cvs.retrieveResults(req);
   // var req = './1.jpg';
    //var results = cvs.test(req.body);
    

    res.status(200).json({"message": req.body});
});

app.get('/', (req, res) => {
    res.send("heyoo");
});


// //Set up a server listener on port 8080
app.listen(port);

function test() {
    var req = './1.jpg';
    var results = cvs.test(req, function(res){
        console.log("My result is: " + res);
    });
}
//test();