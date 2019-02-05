// display formular names in dropdown depending on result from db
function getFormularNames() {
    $.ajax({
        url: 'http://localhost:3000/getFormularNames',
        type: 'GET',
        statusCode: {
            404: function () {
                console.log("error");
            },
            200: function (result) {
                var formulars = document.getElementById("formular-names");
                while(formulars.hasChildNodes())
                formulars.remove(formulars.lastElementChild);

                for (var i = 0; i < result.length; i++) {
                    var option = document.createElement("OPTION");
                    option.innerHTML = result[i].name;
                    option.value = result[i].id;
                    formulars.appendChild(option);
                }
            }

        }
    });
}

//delete all formular data on selecting other formular
function resetFormular() {
    var elements = document.getElementById("formular-data");
    while (elements.hasChildNodes()) {
        elements.removeChild(elements.lastChild);
    }
}

// get all elements for selected formular and version
function load() {
    resetFormular();
    var select = document.getElementById("formular-names");
    // get formular id and version
    var formularId = select.options[select.selectedIndex].value;
    var version = document.getElementById("version").value;
    document.getElementById("load-div").style.display = "block"; /// display load-div

  //send request to get data for entered formular and version
    $.ajax({
        url: 'http://localhost:3000/loadFormular',
        type: 'GET',
        data: { formularId: formularId, version: version },

        statusCode: {
            404: function () {
                console.log("error");
            },
            200: function (result) {
                for (var i = 0; i < result.length; i++) {
                    displayFormular(result[i]);
                }
            }
        }
    });
}

//display formular view for entered version and selected formular
function displayFormular(elements) {
    // create div for element
    var elementDiv = document.createElement("DIV");
    elementDiv.style.display = "flex";
    elementDiv.flexDirection = "row";

    //set hidden elementId
    var elementId = document.createElement("SPAN");
    elementId.innerHTML = elements.id;
    elementId.style.display = "none";
    elementDiv.appendChild(elementId);

    //create and fill element label
    var label = document.createElement("SPAN");
    label.innerHTML = elements.label + ":";
    label.style.width = "100px";
    elementDiv.appendChild(label);

    if (elements.attribute == "Mandatory" || elements.attribute == "None") {
       //add star for Mandatory attribute
        if (elements.attribute == "Mandatory") {
            var mandatory = document.createElement("SPAN");
            mandatory.innerHTML = "*";
            label.appendChild(mandatory);
        }
        //display textbox
        if (elements.field == "Textbox") {
            var textbox = document.createElement("INPUT");
            textbox.setAttribute("class", "form-control");
            textbox.style.marginLeft = "30px";
            textbox.setAttribute("id", "textbox");
            if (elements.elementsData.input) { // fill textbox if exists in db
                textbox.value = elements.elementsData.input;
            }
            elementDiv.appendChild(textbox);
            if(elements.attribute=="Mandatory") // set required textbox if attribute is Mandatory
             textbox.required=true;
        }
         //display checkbox
        else if (elements.field == "Checkbox") {
            var checkboxDiv = document.createElement("DIV");
            var checkbox = document.createElement("INPUT");
            checkbox.type = "checkbox";
            if (elements.elementsData.input) { // set checked if stored value is true
                if (elements.elementsData.input == "true")
                    checkbox.checked = "true";
            }
            checkboxDiv.appendChild(checkbox);
            checkboxDiv.style.marginLeft = "31px";
            checkboxDiv.setAttribute("id", "checkboxDiv");
            elementDiv.appendChild(checkboxDiv);
            if(elements.attribute=="Mandatory") // set required if attribute is Mandatory
              checkbox.required=true;
        }
        else if (elements.field == "Radio buttons") {
            var radioDivs = document.createElement("FORM");
            radioDivs.style.display = "flex";
            radioDivs.style.flexDirection = "column";
            radioDivs.setAttribute("id", "radioDiv");

            // display radiobuttons
            for (var i = 0; i < elements.radioLabels.length; i++) {
                var radioDiv = document.createElement("DIV");
                radioDiv.style.display = "flex";
                radioDiv.style.flexDirection = "row";
                var radioButton = document.createElement("INPUT");
                var radioName = document.createElement("SPAN");
                radioName.innerHTML = elements.radioLabels[i].label;
                radioName.style.marginLeft = " 10px";
                radioButton.type = "radio";
                radioButton.name = "radioLabel";
                if (elements.elementsData.input) { // set checked depending on db data
                    if (radioName.innerHTML == elements.elementsData.input)
                        radioButton.checked = "true";
                }
                radioDiv.appendChild(radioButton);
                radioDiv.appendChild(radioName);
                radioDivs.appendChild(radioDiv);
                radioDivs.style.marginLeft = "31px";
                if(elements.attribute=="Mandatory" && i==0){ // check first radioButton for Mandatory attribute
                    radioButton.checked=true;
                }

            }
            elementDiv.appendChild(radioDivs);

        }
    }

    // creating numeric textbox and fill
    else if (elements.attribute == "Numeric") {
            var textbox = document.createElement("INPUT");
            textbox.setAttribute("class", "form-control");
            textbox.setAttribute("id", "textbox");
            textbox.style.marginLeft = "30px";
            textbox.type = "number";
            if (elements.elementsData.input) {
                textbox.value = elements.elementsData.input;
            }
            elementDiv.appendChild(textbox);
    }
    elementDiv.style.margin = "15px";
    document.getElementById("formular-data").appendChild(elementDiv);
}


// save data for loaded formular
function saveData() {
    var elements = document.getElementById("formular-data").children;
    var data = [];
    //push formular data in array
    for (var i = 0; i < elements.length; i++) {
        //push textbox data
        if (elements[i].lastElementChild.id == "textbox") {
            data.push({ id: elements[i].firstElementChild.innerHTML, data: elements[i].lastElementChild.value });
        }
        //push checkbox data
        else if (elements[i].lastElementChild.id == "checkboxDiv") {
            data.push({
                id: elements[i].firstElementChild.innerHTML,
                data: elements[i].lastElementChild.children[0].checked
            });
        }
       //push radio data
        else if (elements[i].lastElementChild.id == "radioDiv") {
            var radioButtonDivs = elements[i].lastElementChild.children;
            for (var j = 0; j < radioButtonDivs.length; j++) {
                if (radioButtonDivs[j].firstElementChild.checked)
                    data.push({
                        id: elements[i].firstElementChild.innerHTML,
                        data: radioButtonDivs[j].lastElementChild.innerHTML
                    });
            }
        }
    }
    var select = document.getElementById("formular-names");
    var formularId = select.options[select.selectedIndex].value;
    var version = document.getElementById("version").value;
    var inputData = { formular: formularId, version: version, data: data };

   // send formular data to server
    $.ajax({
        url: "http://localhost:3000/insertData",
        type: "POST",
        data: { data: inputData }
    });
}