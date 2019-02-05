//counter for element label
var counter = 1;

//sending POST request to server for create db tables
function createDb() {
    $.ajax({
        url: 'http://localhost:3000/createDb',
        type: 'POST',
        success :function (result){
            insert();
        }
    })

}

///sending POST request for insert data in field and attribute tables
function insert() {
    $.ajax({
        url: 'http://localhost:3000/insert',
        type: 'POST',
        success :function (result){
            getFields();
            getAttributes();
        }
    });
}
//request to get data from attribute table
function getAttributes() {
    $.ajax({
        url: 'http://localhost:3000/getAttributes',
        type: 'GET',
        statusCode: {
            404: function () {
                console.log("error");
            },
            200: function (data) {
                displayDropdown(data, document.getElementById("attributes"));
            }
        }
    }
    );
}

//request to get data from field table
function getFields() {
    $.ajax({
        url: 'http://localhost:3000/getFields',
        type: 'GET',
        statusCode: {
            404: function () {
                console.log("error");
            },
            200: function (data) {
                displayDropdown(data, document.getElementById("fields"));
            }
        }
    });
}

//display new element on add button event
function displayElement() {
    counter++;
    //clone hidden template element for new element
    var newElement = document.getElementById("elementRow").cloneNode("true");
    // displaying new element and changing attributes
    newElement.style.display = "flex";
    newElement.style.flexDirection = "column";
    // set first input to require
    newElement.firstElementChild.children[1].required = true;
    newElement.firstElementChild.firstElementChild.innerHTML = "Element " + counter.toString();
    // remove add button from last element
    document.getElementById("elements").lastElementChild.firstElementChild.lastElementChild.style.display = "none";
    document.getElementById("elements").appendChild(newElement);
}

//display dropdown with data
function displayDropdown(result, select) {
    for (var i = 0; i < result.length; i++) {
        var option = document.createElement('OPTION');
        option.innerHTML = result[i].name;
        option.value = result[i].id;
        select.appendChild(option);
    }
}

//delete all childrens in elements div
function reset() {
    var elements = document.getElementById("elements");
    while (elements.hasChildNodes()) {
        elements.removeChild(elements.lastChild);
    }
    counter = 1;
}

// search formular event
function search() {
    //remove previous displayed formular
    reset();
    var formularName = document.getElementById("filter").value;

    //if input is not empty
    document.getElementById("elements").style.display = "block";
    document.getElementById("save-div").style.display = "block";

    $.ajax({
        url: 'http://localhost:3000/getFormular',
        type: 'GET',
        data: { name: formularName },
        success: function (result) {

            //if formular not exists,create only one element
            var newElement = document.getElementById("elementRow").cloneNode("true");
            newElement.style.display = "flex";
            newElement.style.flexDirection = "column";
            document.getElementById("elements").appendChild(newElement);
            newElement.firstElementChild.children[1].required = true;

            //if formular exists,display all elements with data
            if (result.length != 0) {
                var values = newElement.firstElementChild.children;
                //set data for first element
                setElements(values, result[0]);
                //creating and fill elements with data
                for (var i = 1; i < result.length; i++) {
                    displayElement();
                    setElements(document.getElementById("elements").lastElementChild.firstElementChild.children, result[i]);
                }
            }
        },
        error: function (err) {
            console.log('error');
        }
    });
}

//set data for element
function setElements(elements, values) {
    elements[1].value = values.label; // fill textbox
    elements[2].value = values.fieldId; // set value for field dropdown
    elements[4].value = values.attributeId; // set value for attribute dropdown
    if(elements[4].options[elements[4].selectedIndex].innerHTML=="Numeric")
    elements[2].disabled=true;
    if (values.radioLabels.length != 0)  // radioLabels
    {
        //fill and display radioLabels counter field
        elements[3].style.display = "block";
        elements[3].value = values.radioLabels.length;
        // display first radio filed
        var radioLabels = elements[0].parentNode.parentNode.lastElementChild;
        radioLabels.style.display = "flex";
        radioLabels.style.flexDirection = "column";
        radioLabels.firstElementChild.required = true;
        addRadioLabels(elements[3]); //create and display other radioLabels
        var childrens = radioLabels.children;
        for (var i = 0; i < childrens.length; i++) { // fill data in radio inputs
            childrens[i].value = values.radioLabels[i];
        }
    }
}

//send request with all filled data to save formular
function save() {

    var formularName = document.getElementById("filter").value;
    var selectedElements = [];
    var elements = document.getElementById("elements").children;

    for (var i = 0; i < elements.length; i++) {
        var name = elements[i].firstElementChild.children[0].innerHTML;
        var label = elements[i].firstElementChild.children[1].value;
        var select1 = elements[i].firstElementChild.children[2];
        var select2 = elements[i].firstElementChild.children[4];
        var field = parseInt(select1.options[select1.selectedIndex].value);
        var attribute = parseInt(select2.options[select2.selectedIndex].value);
        var radioLabels = [];
        if (select1.options[select1.selectedIndex].text == "Radio buttons") {
            var labels = elements[i].lastElementChild.children;
            for (var j = 0; j < labels.length; j++) {
                radioLabels.push(labels[j].value);
            }
        }
        //push all entered data in array
        selectedElements.push({ name: name, label: label, field: field, attribute: attribute, radioLabels: radioLabels });
    }

    //send request for insert data in db
    $.ajax({
        url: 'http://localhost:3000/changeFormular',
        type: 'POST',
        data: { name: formularName, elements: selectedElements }
    });
}


function onChangeAttribute(e) {
    var select = e.parentNode.children[2];

    // if Numeric attribute is selected,set field to Textbox and disable dropdown field
    if (e.options[e.selectedIndex].text == "Numeric") {
        select.selectedIndex = 0;
        select.disabled = true;
        onChangeField(select.parentNode.children[2]);
    }
    // if attribute is Mandatory or None,enable dropdown
    else {
        select.disabled = false;
    }
}

// remove radioLabels if selected field is Checkbox,Textbox or if attribute is Numeric
function removeRadioLabels(e) {
    for (var i = 1; i < e.children.length; i++)
        e.removeChild(e.lastElementChild);

    e.firstElementChild.value = "";
    e.firstElementChild.required = false;
}

function onChangeField(e) {
    var radioLabelDiv = e.parentNode.parentNode.lastElementChild;
    // if selected field is 'Radio buttons',display numeric input and div with radio inputs
    if (e.options[e.selectedIndex].text == "Radio buttons") {
        e.nextElementSibling.style.display = "block";
        radioLabelDiv.style.display = "flex";
        radioLabelDiv.style.flexDirection = "column";
        radioLabelDiv.firstElementChild.required = true;
    }
    // remove all radioLabels and reset numeric input
    else {
        e.nextElementSibling.value = "1";
        e.nextElementSibling.style.display = "none";
        removeRadioLabels(radioLabelDiv);
        radioLabelDiv.style.display = "none";
    }
}

// create and display all radioLabels depending on db data
function addRadioLabels(input) {
    for (var i = 1; i < input.value; i++) {
        var newRadioLabel = document.getElementById("radioLabel").cloneNode(true);
        newRadioLabel.value = "";
        input.parentNode.parentNode.lastElementChild.appendChild(newRadioLabel);
        newRadioLabel.required = true;
    }
}
// add or remove radioLabels on change radio counter
function displayRadioLabels(input) {
    var children = input.parentNode.parentNode.lastElementChild.children;
    //add radioLabel
    if (input.value > children.length) {
        var newRadioLabel = document.getElementById("radioLabel").cloneNode(true);
        newRadioLabel.value = "";
        input.parentNode.parentNode.lastElementChild.appendChild(newRadioLabel);
        newRadioLabel.required = true;

    }
    //remove radioLabel
    else {
        input.parentNode.parentNode.lastElementChild.lastElementChild.remove();

    }
}

// hide formular data if filter is empty
function validation() {
    if (document.getElementById("filter").value == "") {
        document.getElementById("elements").style.display = "none";
        document.getElementById("save-div").style.display = "none";
    }
}