// NOTE: MUST INSTALL
// npm install node-cloud-vision-api --save
// npm install @google/maps --save
// npm install tedious --save 
// npm install firebase --save 
// npm install @google-cloud/storage --save

// TODO DELETE
// npm install xmlhttprequest --save
// npm install uuid-v4 --save
// npm install firebase-admin --save
// npm install xhr2 --save 

module.exports = {    
  retrieveResults,
  locationObject
};

// Server : http://snapmap.azurewebsites.net/

//////////////////
// Dependencies //
//////////////////
const vision = require('node-cloud-vision-api'); // Node-Cloud-Vision API Key 
vision.init({auth: 'AIzaSyB8sAy4-cHcVb0MZoWdnEli7fUoeP-quzs'}); // Init node-cloud-vision-api
const googleMapsClientKey = 'AIzaSyBhGfxxUvFuqP-o-SMez1E580NQp1F2MeY'; // Node.js Client API Key 
const googleMapsClient = require('@google/maps').createClient({
  key: googleMapsClientKey,
  Promise: Promise
}); // Node.js Client for Google Maps Service
var Connection = require('tedious').Connection; // Azure Database Connection object
var Request = require('tedious').Request; // Azure Database Request object
var db_conn_info = { 
  userName: 'snapmapadmin', 
  password: 'Password1!', 
  server: 'snapmap.database.windows.net',
  options: {
    database: 'SnapMap Database', 
    encrypt: true,
    rowCollectionOnRequestCompletion: true
  }
}; // Set database connection info details
// const firebase = require('firebase'); //firebase 
// const storage = require('firebase/storage');
var firebase = require("firebase");
var storage = require('firebase/storage');
// Google Cloud Storage 
const gcs = require('@google-cloud/storage')({keyFilename: 'My Project-0cbc36640d86.json'});
const bucket = gcs.bucket('gs://my-project-1520881457378.appspot.com');

// XML 
// const XMLHttpRequest = require("xmlhttprequest").XMLHttpRequest;
// const requestsss = require("xmlhttprequest");
//const xmlhttprequest = require('xmlhttprequest').XMLHttpRequest;
// UUID
// const UUID = require("uuid-v4");
// var admin = require('firebase-admin');

var XMLHttpRequest = require('xhr2');
var xhr = new XMLHttpRequest();

// Global vars 
var visionRequest = '';
var filePath = '';

// Firebase 
{/* <script src="https://www.gstatic.com/firebasejs/4.12.1/firebase.js"></script> */}
  // Initialize Firebase
  var config = {
    apiKey: "AIzaSyDyybe2M22LRFshLKUXTvE7gEkrGdXBOTw",
    authDomain: "my-project-1520881457378.firebaseapp.com",
    databaseURL: "https://my-project-1520881457378.firebaseio.com",
    projectId: "my-project-1520881457378",
    storageBucket: "gs://my-project-1520881457378.appspot.com",
    messagingSenderId: "148791964048"
  };
  firebase.initializeApp(config);

// Get Key
// Check Azure dB to see if Key is in ImageKeys 

// If there
  // Retrieve all rows from Results where ID = ImageKey ID 
  // Modify object 
  // Return object 

// Else
  // Download image from FB Database 
  // Pass as file to Cloud Vision 
  // Get Results 
  // Modify object 

  // Post into Azure:
    // ImageKey and ID
    // Corresponding ID and Results 
  // Return object 

// CREATE TABLE ImageKeys (
// ID INT IDENTITY(1,1) PRIMARY KEY,
// ImageKey VARCHAR(255)
// );
// Insert INTO ImageKeys (ImageKey) VALUES  ('b9j4AAQSkZJRgABAQAAAQABAAD2wBDAAIBAQEBAQIBAQECAgICAgQDAgICAgUEBAMEBgUGBgYFBgYGBwkIBgcJBwYGCAsICQoK33');

//CREATE TABLE Results (
//  ID INT, 
//  Description VARCHAR(255),
//  Score NUMERIC(10,5),
//  Lat NUMERIC(15,10),
//  Lng NUMERIC(15,10)    
//);
// INSERT INTO Results VALUES (1, 'Eiffel', 3.7568, 48.59776799999999, 2.386897);


// Location Object
function locationObject(desc, score, lat, lng) {
  this.description = desc;
  this.score = score;
  this.lat = lat;
  this.lng = lng; 
}

// Only function that is exposed to server
function retrieveResults(imageKey) {
  // Check Azure if ImageKey is in the database

  // Test to see already in DB
  //imageKey = "b9j4AAQSkZJRgABAQAAAQABAAD2wBDAAIBAQEBAQIBAQECAgICAgQDAgICAgUEBAMEBgUGBgYFBgYGBwkIBgcJBwYGCAsICQoK33";
  imageKey = "b9j4AAQSkZJRgABAQAAAQABAAD2wBDAAIBAQEBAQIBAQECAgICAgQDAgICAgUEBAMEBgUGBgYFBgYGBwkIBgcJBwYGCAsICQoK";
  // Test to see if not in DB
  //imageKey = "sdf";

  queryStr = "SELECT ID from dbo.ImageKeys WHERE ImageKey = '" + imageKey + "'";
  retrieveId(queryStr, imageKey);
}

function retrieveId(queryStr, key) {
  // Connect to a database
  var connection = new Connection(db_conn_info);
  connection.on('connect', function(err) {
      if (err) {
        console.log(err)
      } else {
        returnIdEntries(queryStr, key, connection);
      }
  });
}

// execute input query and iterate through the results set
function returnIdEntries(input, key, connection) { 
  var id = 0;
  // setup a query request
  var request = new Request(input, function(err, rowCount, rows) {
      console.log(rowCount + ' row(s) returned');
        rows.forEach(function(row) {
          row.forEach(function(column) {
            if (column.metadata.colName == 'ID' && column.value != "") {
              id = column.value;
            }
          });          
        });  
      //process.exit();   
      
      if (id == 0) {
        // Not in Azure database - Download file from FB and send to Cloud Vision
        // Download FirBase image and Retrieve Cloud Vision results
        retrieveCloudVisionResults(key, connection);
      } else {
        // Inside Azure database - retrieve results and send to Client
        var queryStr = "SELECT Description, Score, Lat, Lng FROM dbo.Results WHERE ID = " + id;
        retrieveAzureResults(queryStr, connection);
      }
    }
  );
  // run the query request
  connection.execSql(request);
}

function retrieveCloudVisionResults(key, connection) {
  // TODO: Figure out how to get url from Firebase
  //var url = "https://firebasestorage.googleapis.com/v0/b/my-project-1520881457378.appspot.com/o/dataSet%2F1.jpg?alt=media&token=db05e973-07ce-415f-9000-f6866bea5987";
  var url = "https://firebasestorage.googleapis.com/v0/b/my-project-1520881457378.appspot.com/o/dataSet%2Fb'9j4AAQSkZJRgABAQAAAQABAAD2wBDAAIBAQEBAQIBAQECAgICAgQDAgICAgUEBAMEBgUGBgYFBgYGBwkIBgcJBwYGCAsICQoK'?alt=media&token=7f7e5270-f0eb-4eda-bd1f-0deebbfa61a6";
  //var url = "https://firebasestorage.googleapis.com/v0/b/my-project-1520881457378.appspot.com/o/dataSet%2Fb9j4AAQSkZJRgABAQAAAQABAAD2wBDAAIBAQEBAQIBAQECAgICAgQDAgICAgUEBAMEBgUGBgYFBgYGBwkIBgcJBwYGCAsICQoK33.jpg?alt=media&token=6d6124da-99dc-41ad-a929-a84d2e99f8e2";
  //var url = "https://firebasestorage.googleapis.com/v0/b/my-project-1520881457378.appspot.com/o/dataSet%2Fb'9j4AAQSkZJRgABAQAAAQABAAD2wBDAAIBAQEBAQIBAQECAgICAgQDAgICAgUEBAMEBgUGBgYFBgYGBwkIBgcJBwYGCAsICQoK'?alt=media&token=7f7e5270-f0eb-4eda-bd1f-0deebbfa61a6";
  var request = createUrlLandmarkRequest(url);
  annotateRequest(request, key, connection);
}

function retrieveAzureResults(input,connection) { 
  var locationObjects = [];

  // setup a query request
  var request = new Request(input, function(err, rowCount, rows) {
      console.log(rowCount + ' row(s) returned');
      rows.forEach(function(row) {
        var desc, score, lat, lng;
        row.forEach(function(column) {          
          if (column.metadata.colName == 'Description' && column.value != "") {
            desc = column.value; 
          } else if (column.metadata.colName == 'Score' && column.value != "") {
            score = column.value; 
          } else if (column.metadata.colName == 'Lat' && column.value != "") {
            lat = column.value; 
          } else if (column.metadata.colName == 'Lng' && column.value != "") {
            lng = column.value; 
          }
        });   
        // Create location object     
        locationObjects.push(new locationObject(desc, score, lat, lng));          
      });

      console.log(locationObjects);
      //process.exit();    
    }
  );

  // run the query request
  connection.execSql(request);
}

// Create Requests for Local Files 
function createFileLandmarkRequest(filePath) {
    var req = new vision.Request({
        image: new vision.Image(filePath),
        features: [
            new vision.Feature('LANDMARK_DETECTION', 5),
            new vision.Feature('WEB_DETECTION', 5)
        ]
      });
      console.log(req);
    return req;
}

// Create Request for URL's
function createUrlLandmarkRequest(urlPath) {
  var req = new vision.Request({
    image: new vision.Image({
      url: urlPath
    }),
    features: [
          new vision.Feature('LANDMARK_DETECTION', 5),
          new vision.Feature('WEB_DETECTION', 5)
      ]
    });
    console.log(req);
  return req;
}

// Annotate Request, send request to Cloud Vision API 
function annotateRequest(req, key, connection) {
vision.annotate(req)
  .then((res) => {    
      res.responses.forEach(function(response) {
        var landmark = response.landmarkAnnotations;
        var webDetection = response.webDetection.webEntities;

        console.log("Landmarks: ");
        console.log(JSON.stringify(landmark));
        console.log('');
        console.log("Web Detections: ");
        webDetection.forEach(function(label) {
          console.log(JSON.stringify(label));
        });

        // Insert into ImageKey Table in the database 
        var input = "Insert INTO ImageKeys (ImageKey) VALUES ('" + key + "'); SELECT ID FROM ImageKeys WHERE ImageKey = '" + key + "';";
        var request = new Request(input, function(err, rowCount, rows) {
          var id = rows[0][0].value;

          // Process results into format to return to SnapMapServer and Client 
          formatResults(webDetection, id, connection);
        });    
        connection.execSql(request);
      });
  }, (e) => {
    console.log('Error: ', e)
  });    
}

function formatResults(webEntities, id, connection) {
  var results = [];
  var length = webEntities.length;

  // for each Web Entity, must find a lat/lng 
  webEntities.forEach(function(label) {
    if (label.description) {
      googleMapsClient.geocode({
        address: label.description
      })
      .asPromise()
      .then((response) => {
        var location = response.json.results[0].geometry.location;
        var lat = location.lat;
        var lng = location.lng;
        result = new locationObject(label.description, label.score, lat, lng);
        results.push(result);
      })
      .then((response) => {
        // Foreach result from Cloud Vision, store into Azure Database - Results table 
        if (results.length == webEntities.length-1) {
          var queryStr = "";
          results.forEach(function(result) {
            // SQL statements 
            let input = "Insert INTO Results (ID, Description, Score, Lat, Lng) VALUES  (" + id + ", '" + result.description+ "', " + result.score +", " + result.lat + ", " + result.lng + ");";
            queryStr = queryStr + input;
          });          
          insertIntoAzure(queryStr, connection);
          console.log(results);
        }
      })
      .catch((err) => {
        console.log(err);
      });
    }
  });
}

function insertIntoAzure(queryStr, connection) {
  let request = new Request(queryStr, function(err, rowCount, rows) {
    console.log(rowCount + ' row(s) returned');
  });
  // run the query request
  connection.execSql(request);    
}

// TODO: Remove, just for test 
retrieveResults("Hey");