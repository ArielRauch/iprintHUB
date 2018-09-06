// [START app]
'use strict';

// [START setup]
const express = require('express');
const bodyParser = require('body-parser');
const Buffer = require('safe-buffer').Buffer;
const querystring = require('querystring');
const convert = require('xml-js');
const fs = require('fs');
const Json2csvParser = require('json2csv').Parser;


//const parseString = require('xml2js').parseString;


const _ = require('lodash');
const priorityHost = process.env.PRIORITYHOST || "31.154.74.138:20443";

const priorityURL = "https://" + priorityHost + "/odata/Priority/tabula.ini/iprint1";
const priorityUser = "priority";
const priorityPass = "Priority18";
const priorityAuth = 'Basic ' + new Buffer(priorityUser + ':' +  priorityPass).toString('base64');



const PCHost = "172.16.0.7";
const PCUrl = `http://${PCHost}/rest`;

const baldarHost = "172.16.0.31";
const baldarURL = `http://${baldarHost}/BaldarWebService/service.asmx`;

const leadSourceList = {
    "face": "Facebook",
    "google": "Google",
    "Face": "Facebook",
    "Google": "Google"
};
const deviceList = {
    "desktop": "Desktop",
    "Desktop": "Desktop",
    "mobile": "Mobile",
    "Mobile": "Mobile"
};

console.log("PRIORITYURL: " + priorityURL);



const rp = require('request-promise');

const orderDetails = [
                        "ORDNAME",
                        "ORDSTATUSDES",
                        "CURDATE",
                        "REFERENCE",
                        "YOURDEALNAME",
                        "DETAILS",
                        "STATUSDATE",
                        "AGENTNAME",
                        "STCODE",
                        "ESHK_ADDRESS",
                        "ESHK_ADDRESS2",
                        "ESHK_STATE",
                        "IPRI_AGENTSCELLPHONE",
                        "IPRI_AGENTSEMAIL"
];
const deliverySource = {
    //vehicleTypeId
    6469: {
        "name":"איסוף מפתח תקווה",
        "branch": "סניף פתח תקווה",
        "vehicleTypeId": "2",
        "custID": "6469",
        "street": "הסיבים",
        "houseNo": "43",
        "city": "פתח תקווה",
        "selfpickup": "65"
    },
    6470: {
        "name":"איסוף מבאר שבע",
        "branch": "סניף באר שבע",
        "vehicleTypeId":"2",
        "custID": "6470",
        "street": "יהודה הנחתום",
        "houseNo": "4",
        "city": "באר שבע",
        "selfpickup": "64"
    },
    6471: {
        "name":"משלוח ללקוח מסניף פת",
        "branch": "סניף פתח תקווה",
        "vehicleTypeId":"1",
        "custID": "6471",
        "street": "הסיבים",
        "houseNo": "43",
        "city": "פתח תקווה",
        "selfpickup": ""
    },
    6473: {
        "name":"משלוח ללקוח מסניף בש",
        "branch": "סניף באר שבע",
        "vehicleTypeId": "1",
        "custID": "6473",
        "street": "יהודה הנחתום",
        "houseNo": "4",
        "city": "באר שבע",
        "selfpickup": ""
    },
    6474: {
        "name":"דואר שליחים מבש",
        "branch": "סניף באר שבע",
        "vehicleTypeId":"3",
        "custID": "6474",
        "street": "יהודה הנחתום",
        "houseNo": "4",
        "city": "באר שבע",
        "selfpickup": ""
    },
    6476: {
        "name":"דואר שליחים מפת",
        "branch": "סניף פתח תקווה",
        "vehicleTypeId":"3",
        "custID": "6476",
        "street": "הסיבים",
        "houseNo": "43",
        "city": "פתח תקווה",
        "selfpickup": ""
    },
    6477: {
        "name":"דואר רשום מפת",
        "branch": "סניף פתח תקווה",
        "vehicleTypeId":"4",
        "custID": "6477",
        "street": "הסיבים",
        "houseNo": "43",
        "city": "פתח תקווה",
        "selfpickup": ""
    },
    6475: {
        "name":"דואר רשום מבש",
        "branch": "סניף באר שבע",
        "vehicleTypeId":"4",
        "custID": "6475",
        "street": "יהודה הנחתום",
        "houseNo": "4",
        "city": "באר שבע",
        "selfpickup": ""
    }
};

const app = express();

const campaignList = getCampaigns();

const parseString = require('xml2js').parseString;
//let xml = getBaldarDeliveries (6471);


app.set('case sensitive routing', true);
// Add headers
app.use(function (req, res, next) {
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Credentials", "true");
    res.setHeader("Access-Control-Allow-Methods", "GET,HEAD,OPTIONS,POST,PUT");
    res.setHeader("Access-Control-Allow-Headers", "Access-Control-Allow-Headers, Origin,Accept, X-Requested-With, Content-Type, Access-Control-Request-Method, Access-Control-Request-Headers");
    next();
});

app.use(bodyParser.json());
// [END setup]

app.post('/chatBot/:action/:order', (req, res) => {
    var action = req.params["action"];
    var orderID;
    if (req.body.value.string && action === "getCustomerOrders") {
        action = "getOrderStatus";
        let retStr = req.body.value.string;
        orderID = retStr.split(" # ")[1];
    } else {
        orderID = req.params["order"];
    }
    console.log(req.body);
    switch(action) {
        case "getOrderStatus":
            getOrderStatus(orderID.toUpperCase())
                .then(responseJSON => {
                    // use the count result in here
                    //console.log(responseJSON);
                    var respActions = {actions: []};
                    var respObj = {};
                    if (responseJSON["ORDNAME"]) {
                        for (var i = 0; i < orderDetails.length; i++) {
                            let val = responseJSON[orderDetails[i]] || null;
                            if (orderDetails[i] === "REFERENCE" && (typeof responseJSON[orderDetails[i]] === undefined  || responseJSON[orderDetails[i]]===null)) {
                                val = "אין ערך";
                            }
                            respObj = {
                                type: "SetParameter",
                                name: orderDetails[i],
                                value: val
                            };
                            respActions.actions.push(respObj);
                        }
                        respObj = {type: "Return",  value: responseJSON["ORDSTATUSDES"]};
                        respActions.actions.push(respObj);
                    } else {
                        respObj = {type: "Return",  value: "Failed"};
                        respActions.actions.push(respObj)
                    }
                    res.status(200).json(respActions).end();
                }).catch(err => {
                    console.log('Got error from getOrderStatus ', err);
                }
            );
            break;
        case "getCustomerOrders":
            getCustomerOrders(req.params)
                .then(responseJSON => {
                    // use the count result in here
                    console.log(responseJSON);
                    var respOptionArr = responseJSON.value;
                    var respActions = {actions: []};
                    var respObj = {};
                    if (respOptionArr.length > 0) {
                        respObj = {type: "InputText", options: []};
                        for (var i = 0; i < respOptionArr.length; i++) {
                            let dtStr = respOptionArr[i]["CURDATE"];
                            let newDt = dtStr.substr(8,2) + "-" + dtStr.substr(6,2) + "-" + dtStr.substr(0,4);
                            respObj.options.push(newDt + " # " + respOptionArr[i]["ORDNAME"]);
                        }
                    } else { //No rows returned
                        respObj = {type: "Return", value: "Failed"};
                    }
                    respActions.actions.push(respObj)
                    res.status(200).json(respActions).end();
                }).catch(err => {
                    console.log('Got error from getCustomerOrders ');
                    res.status(400).json("Something went wrong").end();
                });
            break;
        default:
            res.status(400).json("Something went wrong").end();
    }
});

app.post('/ak/:action', (req, res) => {
    leadValidation(req.body)

            .then(responseJSON => {
            // use the count result in here
            console.log(responseJSON);
            res.status(200).json("Lead Created Succesfully").end();
        }).catch(err => {
        console.log(err + 'Got error from createLead ');
        res.status(400).json("Something went wrong: " + err).end();
    });
});



function getBaldarDeliveries (branch) {
   let urlQueryString = "";
    const queryObj = { 'pCustomer': branch };
    urlQueryString = "?" + querystring.stringify(queryObj);
    console.log(`branch: ${ branch }`);
    var  options = {
        url: baldarURL  + urlQueryString,
        method: 'GET',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
        },
        strictSSL: false
    };
    console.log(`options: ${ options.url }`);
    return rp(options)
        .then(body => {
            // make the count be the resolved value of the promise

            let responseXML = body;
            parseString(responseXML, function (err, result) {
                console.log(result);
                let responseJSON = result;
                console.log(responseJSON.records[0].record);
                //let filteredJSON = responseJSON.find(function(el){
                //    return  el === 'number';
                //});
            });


            //console.log(responseJSON);
            return responseJSON;
        })
        .catch(function (err) {
            //console.log(err);
            return err;
        });

}



app.get('/db/erp/:object', (req, res) => {
    let tabEntity = req.params["object"];
    getPriorityQuery(tabEntity,req.query)
        .then(responseJSON => {
            // use the count result in here
            //console.log(req);
            res.status(200).json(responseJSON).end();
        }).catch(err => {
        console.log(err + 'Got error from getNewLeads ');
        res.status(400).json("Something went wrong: " + err).end();
    });

});


function getPriorityQuery (tab, queryDef) {
    let filter;
    let expand;
    for (let key in queryDef){
        if (key === "$filter") {
            filter = queryDef["$filter"];
        }
        if (key === "$expand") {
            expand = queryDef["$expand"];
        }
    }
    let urlQueryString = "";
    if (filter) {
        let queryObj = { '$filter': filter };
        urlQueryString = "?" + querystring.stringify(queryObj);
        console.log(`filter: ${ filter }`);
    }
    if (expand) {
        let queryObj = { '$expand': expand };
        urlQueryString += "&" + querystring.stringify(queryObj);
        console.log(`expand: ${ expand }`);

    }
    var  options = {
        url: priorityURL + "/" + tab + urlQueryString,
        method: 'GET',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': priorityAuth
        },
        strictSSL: false
    };
    console.log(`options: ${ options.url }`);
    return rp(options)
        .then(body => {
            // make the count be the resolved value of the promise
            let responseJSON = JSON.parse(body);
            //console.log(responseJSON);
            return responseJSON["value"];
        })
        .catch(function (err) {
            //console.log(err);
            return err;
        });

}

app.get('/db/pc/jobs', (req, res) => {
    //console.log(req);
    getPCJobs(req.query)
        .then(responseJSON => {
            // use the count result in here
            //console.log(req);
            res.status(200).json(responseJSON).end();
        }).catch(err => {
        console.log(err + 'Got error from Production Center ');
        res.status(400).json("Something went wrong: " + err).end();
    });
});


function getPCJobs (queryDef) {
    console.log("I am in getPCJobs");
    let q;
    for (let key in queryDef){
        if (key === "q") {
            q = queryDef["q"];
        }
    }
    let urlQueryString = "";
    if (q) {
        const queryObj = { 'q': q };
        urlQueryString = "?" + querystring.stringify(queryObj);
        console.log(`q: ${ q }`);
    }
    let options = {
        url: PCUrl + "/jobs" + urlQueryString + "&count=-1",
        method: 'GET',
        headers: {
            'Content-Type': 'application/json',
        },
        strictSSL: false
    };
    console.log(`options: ${ options.url }`);
    return rp(options)
        .then(body => {
            // make the count be the resolved value of the promise
            let responseJSON = JSON.parse(body);
            //console.log(responseJSON);
            return responseJSON["job"];
        })
        .catch(function (err) {
            //console.log(err);
            return err;
        });

}


app.post('/baldar/newDelivery',
    (req,res) => {
        console.log(req.body);
        saveDelivery(req.body)
            .then (resp => {
            //    console.log(resp);
                let retVal = parseInt(resp);
                if (retVal < 0) {
                    res.status(400).json({"error code": retVal}).end()

                } else {
                    res.status(200).json({"DeliveryNum": retVal}).end();
                    createCSVFile();
                }
            });
    });

function saveDelivery(deliveryJSON) {
    console.log("Starting saveDelivery ...");
    console.log(deliveryJSON);
    let  options = {
        url: baldarURL + "/SaveData",
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: "pParam=" + JSON.stringify(deliveryJSON),
        strictSSL: false
    };
    return rp(options)
        .then(body => {
            //let responseJSON = JSON.parse(body);
            console.log(body);
            let deliveryNumber =  JSON.parse(convert.xml2json(body, {compact: true, spaces: 4})).int._text;
            deliveryJSON["DeliveryNumber"] = deliveryNumber;
            deliveryJSON["DeliveryStatus"] = "1";
            let selfPickup = deliverySource[deliveryJSON["CustomerID"]].selfpickup;
            if (selfPickup) {
                deliveryJSON["EmployeeID"] = selfPickup;
                deliveryJSON["EmployeeIDSec"] = selfPickup;
                deliveryJSON["DeliveryStatus"] = "4";
            };
            options.body = "pParam=" + JSON.stringify(deliveryJSON);
            return rp(options)
                .then(body => {
                    console.log(body);
                    return deliveryNumber;
                })
                .catch(error => {
                    console.log(error)
                })
         })
        .catch (error => {
            console.log(error);
        });
}


function createCSVFile () {
    let csvFields = {
        "DeliverNumber": '["ESHK_DELIVNO"]',
        "TypeOfDelivery": '["STDES"]',
        "OrderID": '["ORDNAME"]',
        "CustomerName": '["CDES"]',
        "ContactPerson": '["SHIPTO2_SUBFORM"]["NAME"]',
        "ContactTel": '["SHIPTO2_SUBFORM"]["PHONENUM"]',
        "Street": '["SHIPTO2_SUBFORM"]["ADDRESS"]',
        "HouseNo": '["SHIPTO2_SUBFORM"]["ADDRESS2"]',
        "City": '["SHIPTO2_SUBFORM"]["STATE"]',
        "RemarkForShipping": '["SHIPREMARK"]'
    };



//    const fields = ['field1', 'field2', 'field3'];
//    const opts = { fields };
    let csv = "";
    try {
        const parser = new Json2csvParser();
        csv = parser.parse(csvFields);
        console.log(csv);
    } catch (err) {
        console.error(err);
    }

    fs.writeFile("/tmp/test", csv, function (err) {
        if (err) {
            return console.log(err);
        }

        console.log("The file was saved!");
    });
}


app.get('/db/pc/wc/:wc', (req, res) => {
    getPCJobsAtWC(req.params["wc"])
        .then(responseJSON => {
            // use the count result in here
            //console.log(req);


            res.status(200).json(responseJSON).end();
        }).catch(err => {
        console.log(err + 'Got error from Production Center ');
        res.status(400).json("Something went wrong: " + err).end();
    });
});

function getPCJobsAtWC (wc) {
    let q = "(joblet_status!=\"not queued\" and joblet_status!=\"aborted\" and joblet_status!=\"suspended\" and joblet_status!=\"ready for next processor\")";
    const queryObj = { 'q': q };
    let urlQueryString = "?" + querystring.stringify(queryObj);
    console.log(`q: ${ q }`);
    let options = {
        url: PCUrl + "/processors/" + wc + "/queue" + urlQueryString + "&count=-1",
        method: 'GET',
        headers: {
            'Content-Type': 'application/json',
        },
        strictSSL: false
    };
    console.log(`options: ${ options.url }`);
    return rp(options)
        .then(body => {
            // make the count be the resolved value of the promise
            let responseJSON = JSON.parse(body);
            //console.log(responseJSON);
            return responseJSON["Jobs"]["job"];
        })
        .catch(function (err) {
            //console.log(err);
            return err;
        });

}




function getNewLeads (queryParams) {
   const queryStat = "חדש";
   const queryObj = { '$filter': "STATDES eq '" + queryStat + "'" };
    console.log(queryParams);
    const urlQueryString = querystring.stringify(queryObj);
    var  options = {
        url: priorityURL + "/LEADS?" + urlQueryString,
        method: 'GET',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': priorityAuth
        },
        strictSSL: false
    };
    return rp(options)
        .then(body => {
            // make the count be the resolved value of the promise
            let responseJSON = JSON.parse(body);
            console.log(responseJSON);
            return responseJSON["value"];
        })
        .catch(function (err) {
            //console.log(err);
            return err;
        });

}

function leadValidation(leadObj) {
    let campaignID = "99999";
    let leadSource = "Unknown";

    let campaignIDArr  = leadObj["CampaignID"].split("_");
    let campaignIDArrLen = campaignIDArr.length;
    if (campaignIDArrLen && campaignIDArrLen >= 2) {
        if (campaignIDArr[0] in leadSourceList) {
            leadSource = leadSourceList[campaignIDArr[0]];
        }
        campaignID = campaignIDArr[1];
    }
    let device = deviceList[leadObj["Device"]];
    let newLead = {
        "NAME" : leadObj["Name"],
        "FIRM": leadObj["Name"] +"-" +  leadObj["Phone"],
        "CELLPHONE": leadObj["Phone"],
        "EMAIL": leadObj["EMail"],
        "CAMPAIGNCODE": campaignID,
        "LEADSOURCENAME": leadSource,
        "LEADTYPEDES": device
    };


    if (campaignID in campaignList) {
        //do something
        console.log("The campaignID exists " + campaignID);
        return createLead(newLead);
    } else {
        //do something else
        console.log("The campaignID DOES NOT exist " + campaignID);
        return createCampaign(campaignID).then(createLead(newLead));
    }
}


function createLead (newLead) {
    // Expecting to receive:
    // 	"Name": "Name of the LEAD",
    // 	"Phone": "Phone of the LEAD",
    // 	"EMail": "Email of the LEAD",
    // 	"CampaignID": "Identifier of the Campaign",
    // 	"Device": "Mobile/Desktop", //LEADTYPE
    //  "LeadSource": "Google
    // 	"PageSource": "The URL of the banner",
    // 	"Custom1": "TBD",
    // 	"Custom2": "TBD"
/*    console.log(leadObj);
    let campaignID = "99999";
    let leadSource = "Unknown";

    let campaignIDArr  = leadObj["CampaignID"].split("_");
    let campaignIDArrLen = campaignIDArr.length;
    if (campaignIDArrLen && campaignIDArrLen >= 2) {
        if (campaignIDArr[0] in leadSourceList) {
            leadSource = leadSourceList[campaignIDArr[0]];
        }
        campaignID = campaignIDArr[1];
    }
    let device = deviceList[leadObj["Device"]];
    let newLead = {
        "NAME" : leadObj["Name"],
        "FIRM": leadObj["Name"] +"-" +  leadObj["Phone"],
        "CELLPHONE": leadObj["Phone"],
        "EMAIL": leadObj["EMail"],
        "CAMPAIGNCODE": campaignID,
        "LEADSOURCENAME": leadSource,
        "LEADTYPEDES": device
    };*/
        let options = {
            url: priorityURL + "/LEADS",
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': priorityAuth
            },
            body: JSON.stringify(newLead),
            strictSSL: false
        };
        return rp(options).then(body => {
            let responseJSON = JSON.parse(body);
            //console.log(responseJSON);
            return JSON.parse(body);
        });
}

function createCampaign(campaignCode) {
    console.log("Ariel");
    let newCampaign = {
        "CAMPAIGNCODE": campaignCode,
        "CAMPAIGNDES": campaignCode
    };
    let  options = {
        url: priorityURL + "/CAMPAIGNS",
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': priorityAuth
        },
        body: JSON.stringify(newCampaign),
        strictSSL: false
    };
    return rp(options).then(body => {
        let responseJSON = JSON.parse(body);
        campaignList[campaignCode] = {};
        //console.log(responseJSON);
        return JSON.parse(body);
    });
}

function getOrderStatus(orderID) {
   //orderID = params["order"].toUpperCase();
   var  options = {  
        url: "https://31.154.74.138:20443/odata/Priority/tabula.ini/iprint1/ORDERS('" + orderID + "')",
        method: 'GET',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Basic ' + new Buffer("priority" + ':' +  "Priority18").toString('base64') 
        },
        strictSSL: false
    }; 
    return rp(options).then(body => {
        // make the count be the resolved value of the promise
        let responseJSON = JSON.parse(body);
        //console.log(responseJSON);
        return responseJSON;
    });
  }

function getCustomerOrders(params) {
  var contactPhone = validatePhoneNumber(params["order"]);

  const queryObj = { '$filter': "Y_9121_0_ESHB eq '" + contactPhone + "'", 
                    '$orderby': 'ORDNAME desc',
                    '$top': 10 
                  };
  const urlQueryString = querystring.stringify(queryObj);
  var  options = {  
          url: "https://31.154.74.138:20443/odata/Priority/tabula.ini/iprint1/ORDERS?" + urlQueryString,
          method: 'GET',
          headers: {
              'Content-Type': 'application/json',
              'Authorization': 'Basic ' + new Buffer("priority" + ':' +  "Priority18").toString('base64') 
          },
          strictSSL: false
  }; 
    return rp(options)
      .then(body => {
        // make the count be the resolved value of the promise
        let responseJSON = JSON.parse(body);
        console.log(responseJSON);
        return responseJSON;
    })
      .catch(function (err) {
        //console.log(err);
        return err;
    });
;
  }



function validatePhoneNumber(phoneNumber) {
  var res = phoneNumber.replace("*","").replace("-","");
  if (res.length<9)  {
    res = "None";
  } else {
    res = res.substr(0,3) + "*" + res.substr(3,) + "*";
    console.log("This is res: " + res);
  }
  return res;
}


function authInfoHandler (req, res) {
  let authUser = { id: 'anonymous' };
  const encodedInfo = req.get('X-Endpoint-API-UserInfo');
  if (encodedInfo) {
    authUser = JSON.parse(Buffer.from(encodedInfo, 'base64'));
  }
  res.status(200).json(authUser).end();
}

function getCampaigns() {
    var  options = {
        url: priorityURL + "/CAMPAIGNS",
        method: 'GET',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': priorityAuth
        },
        strictSSL: false
    };
    return rp(options).then(body => {
        // make the count be the resolved value of the promise
        let campaignArr = JSON.parse(body).value;
        let responseJSON = {};
        for (let i=0; i<campaignArr.length; i++) {
            responseJSON[campaignArr[i].CAMPAIGNCODE] = campaignArr[i];
        }
//        console.log(responseJSON);
        return responseJSON;
    });
}


app.get('/auth/info/googlejwt', authInfoHandler);
app.get('/auth/info/googleidtoken', authInfoHandler);

if (module === require.main) {
  // [START listen]
  const PORT = process.env.PORT || 8080;
  app.listen(PORT, () => {
    console.log(`App listening on port ${PORT}`);
    console.log('Press Ctrl+C to quit.');
  });
  // [END listen]
}
// [END app]

module.exports = app;