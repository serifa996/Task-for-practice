const Pool = require('pg').Pool

//create pool with informations about db
const pool = new Pool({
  user: 'postgres',
  host: 'localhost',
  database: 'myDb',
  password: 'user',
  port: 5432,
})

// ******** Administration ***********

//create tables in db
async function createDb(req, res) {
  try {
    res.header("Access-Control-Allow-Origin", "*");

    // create formular table
    await pool.query("CREATE TABLE IF NOT EXISTS  formular(id SERIAL PRIMARY KEY, name VARCHAR(100) NOT NULL)")
      .catch(err => console.log('error1', err));

    // create attribute table
    await pool.query("CREATE TABLE IF NOT EXISTS attribute(id SERIAL PRIMARY KEY, name VARCHAR(100) NOT NULL)")
      .catch(err => console.log('error2', err));

    // create fields table
    await pool.query("CREATE TABLE IF NOT EXISTS field(id SERIAL PRIMARY KEY,name VARCHAR(100) NOT NULL)")
      .catch((err) => console.log('error3', err));

    // create element table
    await pool.query("CREATE TABLE IF NOT EXISTS element(id SERIAL PRIMARY KEY,name VARCHAR(100) NOT NULL,label VARCHAR(100), fieldId INTEGER REFERENCES field, attributeId INTEGER REFERENCES attribute,formularId INTEGER REFERENCES formular)")
      .catch(err => console.log('error4', err));

    //create radioButton table
    await pool.query("CREATE TABLE IF NOT EXISTS radioButton(id SERIAL PRIMARY KEY,label VARCHAR(100),elementId INTEGER REFERENCES element)")
      .catch(err => console.log('error5', err));

    //create version table
    await pool.query("CREATE TABLE IF NOT EXISTS version(id SERIAL PRIMARY KEY,number INTEGER NOT NULL,formularId INTEGER REFERENCES formular)")
      .catch(err => console.log('error6', err));

    //create data table
    await pool.query("CREATE TABLE IF NOT EXISTS  data(id SERIAL PRIMARY KEY,input VARCHAR(100),versionId INTEGER REFERENCES version,elementId INTEGER REFERENCES element)")
      .catch(err => console.log('error7', err));

      return res.status(200).send({ message: 'Created db' });
    }
  catch (err) { console.log("Error while creating Db"); }

}

async function insert(req, res) {

  //insert data into field table
  var data = await pool.query("select * from field");
  if (data.rows.length == 0) {
    await pool.query("insert into field(name) values('Textbox')").catch(err =>
      console.log(err));
    await pool.query("insert into field(name) values('Checkbox')").catch(err =>
      console.log(err));
    await pool.query("insert into field(name) values('Radio buttons')").catch(err =>
      console.log(err));
  }

  //insert data into attribute table
  var attributes = await pool.query("select * from attribute");
  if (attributes.rows.length == 0) {
    await pool.query("insert into attribute(name) values('Mandatory')").catch(err =>
      console.log(err));
    await pool.query("insert into attribute(name) values('None')").catch(err =>
      console.log(err));
    await pool.query("insert into attribute(name) values('Numeric')").catch(err =>
      console.log(err));
  }
  return res.status(200).send({ message: 'Inserted data' });
}

//send all elements from db for entered formular in administration
async function getFormular(req, res) {
  var name = req.query.name;
  var formular = await pool.query("select * from formular where name='" + name + "'"); // get filtered formular
  var data = [];
  if (formular.rows[0]) {
    // get formular elements
    var elements = await pool.query("select * from element where formularId='" + formular.rows[0].id + "'");

    var radioId = await pool.query("select id from field where name='Radio buttons'");
    for (var i = 0; i < elements.rows.length; i++) {
      var radioLabels = [];

      // get data from radioButton table for element and push in array
      if (elements.rows[i].fieldid == radioId.rows[0].id) {
        var rLabels = await pool.query("select *from radioButton where elementId='" + elements.rows[i].id + "'");

        for (var j = 0; j < rLabels.rows.length; j++) {
          radioLabels.push(rLabels.rows[j].label);
        }
      }
      // push all element data in array
      data.push({ label: elements.rows[i].label, fieldId: elements.rows[i].fieldid, attributeId: elements.rows[i].attributeid, radioLabels: radioLabels });
    }
  }
  res.header("Access-Control-Allow-Origin", "*");
  return res.status(200).send(data);
}

//send data from table attribute
async function getAttributes(req, res) {
  await pool.query('select * from attribute').then(data => {
    res.header("Access-Control-Allow-Origin", "*");
    return res.status(200).send(data.rows);
  })
}

//send data from table field
async function getFields(req, res) {
  await pool.query('select * from field').then(data => {
    res.header("Access-Control-Allow-Origin", "*");
    return res.status(200).send(data.rows);
  }
  )
}

//insert into db all entered data for entered formular
async function changeFormular(req, res) {
  var formulars = await pool.query("select * from formular where name='" + req.body.name + "'");

  // if formular not exists insert it
  if (formulars.rows.length == 0) {
    await pool.query("insert into formular(name) values('" + req.body.name + "')");
  }
  // if formular exists update data (delete and then insert new data)
  else {
    var radioLabels = await pool.query("select r.id from radioButton r inner join element e on r.elementId=e.id where e.formularId='" + formulars.rows[0].id + "'");
    var formularElements = await pool.query("select e.id from element e where e.formularId='" + formulars.rows[0].id + "'")

    // delete all data from radioButton table for searched formular
    for (var i = 0; i < radioLabels.rows.length; i++) {
      await pool.query("delete from radioButton where id='" + radioLabels.rows[i].id + "'");
    }

    // delete all from data table for searched formular
    for (var i = 0; i < formularElements.rows.length; i++) {
      var elementId = formularElements.rows[i].id;
      await pool.query("delete from data d where d.elementId='" + elementId + "'");
    }

    // delete all elements
    await pool.query("delete from element where formularId='" + formulars.rows[0].id + "'");
  }
  // insert data for non existing and existing formular
  var id = await pool.query("select id from formular where name='" + req.body.name + "'");
  var elements = req.body.elements;
  var radioButtonId = await pool.query("select id from field where name='Radio buttons'");
  // insert all data in element table
  for (var i = 0; i < elements.length; i++) {
    await pool.query("insert into element(name,label,fieldId,attributeId,formularId) values('" + elements[i].name + "','" + elements[i].label + "','" + parseInt(elements[i].field) + "','" + parseInt(elements[i].attribute) + "','" + id.rows[0].id + "')");

    // insert data into radioButton table for element
    if (elements[i].field == radioButtonId.rows[0].id) {
      var elementId = await pool.query("select id from element where name='" + elements[i].name + "' and formularId='" + id.rows[0].id + "'");
      for (var j = 0; j < elements[i].radioLabels.length; j++) {
        await pool.query("insert into radioButton(label,elementId) values('" + elements[i].radioLabels[j] + "','" + elementId.rows[0].id + "')");
      }
    }
  }
  res.header("Access-Control-Allow-Origin", "*");
  return res.status(200);
}

// ****************  Formular *************

// get all existing formular names from db for formular filter
async function getFormularNames(req, res) {
  var formulars = await pool.query("select * from formular");
  res.header("Access-Control-Allow-Origin", "*");
  return res.status(200).send(formulars.rows);
}

// get data for selected formular and version
async function loadFormular(req, res) {
  var allElements = [];
  var version = await pool.query("select id from version where formularId='" + req.query.formularId + "' and number='" + req.query.version + "'");
  var elements = await pool.query("select id,label from element where formularId='" + req.query.formularId + "'");
  for (var i = 0; i < elements.rows.length; i++) {
    var elementsData = {};
    // push all data in elementsData array for existing formular version and elements
    if (version.rows.length != 0) {
      await pool.query("select input from data where versionId='" + version.rows[0].id + "' and elementId='" + elements.rows[i].id + "'").then(data => {
        if (data.rows.length != 0)
          elementsData = data.rows[0];
      })
    }
    // get stored data from administration(field, attribute and radio labels) and push in array
    var field = await pool.query("select f.name from element e inner join field f on f.id=e.fieldId  where e.id='" + elements.rows[i].id + "'");
    var attribute = await pool.query("select a.name from element e inner join attribute a on a.id=e.attributeId  where e.id='" + elements.rows[i].id + "'");
    var radioLabels = await pool.query("select label from radioButton where elementId='" + elements.rows[i].id + "'");
    allElements.push({ id: elements.rows[i].id, label: elements.rows[i].label, field: field.rows[0].name, attribute: attribute.rows[0].name, radioLabels: radioLabels.rows, elementsData: elementsData });
  }
  res.header("Access-Control-Allow-Origin", "*");
  return res.status(200).send(allElements);
}

//insert input data in db for selected formular and version
async function insertData(req, res) {
  var versionId = await pool.query("select id from version where number='" + req.body.data.version + "' and formularId='" + req.body.data.formular + "'");

  // update data for existing version. First delete last data and then insert new data
  if (versionId.rows.length != 0) {
    await pool.query("delete from data where versionId='" + versionId.rows[0].id + "'");
    await pool.query("delete from version where id='" + versionId.rows[0].id + "'");
  }

  // insert into version and data tables for existing and non existing version
  await pool.query("INSERT INTO version(number, formularId) VALUES('" + req.body.data.version + "','" + parseInt(req.body.data.formular) + "')")
  var version = await pool.query("select id from version where number='" + req.body.data.version + "' and formularId='" + req.body.data.formular + "'")
  for (var i = 0; i < req.body.data.data.length; i++) {
    var data = req.body.data.data[i];
    await pool.query("INSERT INTO data(input, versionId, elementId) VALUES('" + data.data + "','" + version.rows[0].id + "', '" + data.id + "')");
  }
}

module.exports = {
  getFormular,
  createDb,
  insert,
  getAttributes,
  getFields,
  changeFormular,
  getFormularNames,
  loadFormular,
  insertData
}