const express = require('express');
const bodyParser = require('body-parser');
const app = express();
const port = 3000;
const db = require('./queries');

app.use(bodyParser.json())
app.use(
  bodyParser.urlencoded({
    extended: true,
  })
)

// serve up static content with express
app.use(express.static(__dirname + '/../'));

//request for html page view
app.get('/', (req, res) => {
 res.sendFile("../index.html");
});

//administration requests
app.post('/createDb', db.createDb);
app.post('/insert', db.insert);
app.get('/getFormular', db.getFormular);
app.get('/getAttributes', db.getAttributes);
app.get('/getFields', db.getFields);
app.post('/changeFormular', db.changeFormular);

//formular requests
app.get('/getFormularNames', db.getFormularNames);
app.get('/loadFormular', db.loadFormular);
app.post("/insertData", db.insertData);

//set server to listen on port
app.listen(port, () => {
  console.log(`App running on port ${port}.`)
})