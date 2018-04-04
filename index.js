// Express
var express = require('express');
var app = express();
var bodyParser = require('body-parser');
app.use(bodyParser({limit: '50mb'}));
app.use( bodyParser.json() );       // to support JSON-encoded bodies
app.use(bodyParser.urlencoded({     // to support URL-encoded bodies
  extended: true
})); 

var util = require('util');
var spawn = require("child_process").spawn;
var PythonShell = require('python-shell');
var Base64 = require('compact-base64');

var cvs = require('./cloud-vision-server.js');

var port = process.env.PORT || 3000; //8080; 

// Pre-process module sending data to Cloud-Vision-Server to clasisfy
// Posts back results of classification
// Request looks like this: 
//data = {"postProcessedImage": [
//	{
//		"pp_ID": encoded_key, 
//		"pp_IMG": encoded_img
//	}
//]}
app.post('/imgData', (req, res) => {
    console.log("Post request sent!");
    console.log(req);
    var key = req.body.postProcessedImage[0].pp_ID.toString();
    var encoder = req.body.postProcessedImage[0].pp_IMG.toString(); 

    console.log(key);
    console.log(encoder);

//     //TODO: Figure out 
//     var options = {
//    //     args = [encoder]
//     }
//     PythonShell.run('preProcessImage.py', options, function (err, data) {
//         if (err) res.send(err);
//         res.send(data.toString())
//     });

    var results = cvs.retrieveResults(key, encoder).then(function(x) {
        res.status(200).json(x);
    });       
});

app.get('/', (req, res) => {
    res.send("heyoo");
});

// //Set up a server listener on port 8080
app.listen(port);