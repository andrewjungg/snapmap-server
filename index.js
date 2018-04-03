// Express
var express = require('express');
var app = express();
var bodyParser = require('body-parser');
app.use(bodyParser({limit: '50mb'}));
app.use( bodyParser.json() );       // to support JSON-encoded bodies
app.use(bodyParser.urlencoded({     // to support URL-encoded bodies
  extended: true
})); 
  
var cvs = require('./cloud-vision-server.js');

var port = process.env.PORT || 3000; //8080; 

// Client sending base64 encoded data to server to pre-process
// Request looks like this: 
//    {
//       "preprocessedImage": [{
//            "pp_IMG": "(base64 encoded key)"
//        }]
//   }
app.post('/preprocessImage', (req, res) => {
    console.log('Post to Pre-Process module');
    var base64encoder = req.body.preprocessedImage[0].pp_IMG.toString();

    // TODO: Call the python script 
    res.status(200).json('Yay good job Andrew, it worked!');
});

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
    var encoder = req.body.postProcessedImage[0].pp_IMG.toString(); // TODO: Fix as will be passing base64, not image 

    console.log(key);
    console.log(encoder);

    var results = cvs.retrieveResults(key, encoder).then(function(x) {
        res.status(200).json(x);
    });   
});

app.get('/', (req, res) => {
    res.send("heyoo");
});

// //Set up a server listener on port 8080
app.listen(port);

// function test(callback) {
//     var req = './1.jpg';
//     var results = cvs.test(req);
//     console.log('tim');
//     console.log(results);
// }
//test();