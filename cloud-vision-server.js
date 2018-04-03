// NOTE: MUST INSTALL
// npm install node-cloud-vision-api --save
// npm install @google/maps --save
// npm install tedious --save 

//TODO: Once fix, delete 
// npm install fs --save

module.exports = {    
  retrieveResults,
  locationObject,
  test
};

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
var db_conn_info = { // Set database connection info details
  userName: 'snapmapadmin', 
  password: 'Password1!', 
  server: 'snapmap.database.windows.net',
  options: {
    database: 'SnapMap Database', 
    encrypt: true,
    rowCollectionOnRequestCompletion: true
  }
};


// TODO: Delete once not reaidng base64 
var fs = require('fs');

// Global vars 
let base64encoder = '';
let locationResults = [];

// Location Object
function locationObject(desc, score, lat, lng) {
  this.description = desc;
  this.score = score;
  this.lat = lat;
  this.lng = lng; 
}

// Only function that is exposed to server
async function retrieveResults(key, encoder) {
  var obj = await new Promise(function(resolve, reject){
    // Set global object as the base64 (so not pass around) 
    var imageFile = fs.readFileSync(encoder);
    base64encoder = new Buffer(imageFile).toString('base64');

    // Check Azure if ImageKey is in database 
    queryStr = "SELECT ID from dbo.ImageKeys WHERE ImageKey = '" + key + "'";
    var ans = retrieveId(queryStr, key, encoder);
    resolve(ans);  
    console.log(ans);  
  });
  return obj;
}

async function retrieveId(queryStr, key) {
  var obj = new Promise(function(resolve, reject){
  // Connect to a database
  var connection = new Connection(db_conn_info);
  connection.on('connect', function(err) {
      if (err) {
        console.log(err)
      } else {
        var ans = returnIdEntries(queryStr, key, connection);
        resolve(ans);
      }
  });
});
return obj;
}

// execute input query and iterate through the results set
async function returnIdEntries(input, key, connection) { 
  var obj = await new Promise(function(resolve, reject) { 
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
        // Not in Azure database - Send base64 code to Cloud Vision
        // Retrieve Cloud Vision results and save to Azure database
        var req = createBase64LandmarkRequest(base64encoder);        
        var ans = annotateRequest(req, key, connection);    
        resolve(ans);   
      } else {
        // Inside Azure database - retrieve results and send to Client
        var queryStr = "SELECT Description, Score, Lat, Lng FROM dbo.Results WHERE ID = " + id;
        var ans = retrieveAzureResults(queryStr, connection);
        resolve(ans);
      }
    }
  );
  // run the query request
  connection.execSql(request);
});
return obj;
}

async function retrieveAzureResults(input,connection) { 
  var obj = new Promise(function(resolve, reject){
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

        console.log(locationObjects); // HERE 
        resolve(locationObjects);      
        //process.exit();    
      });

  // run the query request
  connection.execSql(request);
  });
  return obj;
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

// Create Request for URL's
function createBase64LandmarkRequest(encoder) {
  var req = new vision.Request({
    image: new vision.Image({      
      base64: encoder
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
async function annotateRequest(req, key, connection) {
  var obj = await new Promise(function(resolve, reject) {
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
          var ans = formatResults(webDetection, id, connection);          
          resolve(ans);
        });    
        connection.execSql(request);
      });
  }, (e) => {
    console.log('Error: ', e)
  });   
});
return obj;
}

async function formatResults(webEntities, id, connection) {
  var results = [];
  var length = webEntities.length;

  // for each Web Entity, must find a lat/lng 
  var obj = await new Promise(function(resolve, reject){
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
          console.log(results); // HERE
          resolve(results);
          
        }
      })
      .catch((err) => {
        console.log(err);
      });
    }
  });
});
return obj;
}

function insertIntoAzure(queryStr, connection) {
 // return new Promise(resolve => {
    let request = new Request(queryStr, function(err, rowCount, rows) {
      console.log(rowCount + ' row(s) returned');
    });
    // run the query request
    connection.execSql(request); 
//  });   
}

async function test(str) {
  var object = new Promise(function(resolve, reject){
  var connection = new Connection(db_conn_info);
  connection.on('connect', function(err) {
      if (err) {
        console.log(err)
      } else {
        var imageFile = fs.readFileSync(str);
        // Covert the image data to a Buffer and base64 encode it.
        var base64key = new Buffer(imageFile).toString('base64');
        var req = createBase64LandmarkRequest(base64key);
        vision.annotate(req)
        .then((res) => {    
            console.log('result is: ');  
            console.log(res);
            resolve(res);
            // Instead of sending back, post onto the database, then send?
          }, (e) => {
            console.log('Error: ', e)
          });              
      }
  });
});
return object;
}

// TODO: Remove, just for test 
//retrieveResults("Hey");
//test('./1.jpg');