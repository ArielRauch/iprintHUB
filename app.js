// [START app]
'use strict';

// [START setup]
const express = require('express');
const util = require('util');
const bodyParser = require('body-parser');
const Buffer = require('safe-buffer').Buffer;
const querystring = require('querystring');
const convert = require('xml-js');
const fs = require('fs');
const Json2csvParser = require('json2csv').Parser;
const date = require('date-and-time');

const pdf = require('html-pdf');
const Mustache = require("mustache");
const JsBarcode = require('jsbarcode');
const Canvas = require("canvas");


const parseString = require('xml2js').parseString;


const _ = require('lodash');
const priorityHost = process.env.PRIORITYHOST || "31.154.74.138:20443";

const priorityURL = "https://" + priorityHost + "/odata/Priority/tabula.ini/iprint1";
const priorityUser = "priority";
const priorityPass = "Priority18";
const priorityAuth = 'Basic ' + Buffer.from(priorityUser + ':' +  priorityPass).toString('base64');

const stickerDir = "/media/stickers";
const templateDir ="./templates";
const jmfDir = "/media/JMF";



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
        "engBranch": "PetahTikva",
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
        "engBranch": "BeerSheva",
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
        "engBranch": "PetahTikva",
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
        "engBranch": "BeerSheva",
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
        "engBranch": "BeerSheva",
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
        "engBranch": "PetahTikva",
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
        "engBranch": "PetahTikva",
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
        "engBranch": "BeerSheva",
        "vehicleTypeId":"4",
        "custID": "6475",
        "street": "יהודה הנחתום",
        "houseNo": "4",
        "city": "באר שבע",
        "selfpickup": ""
    },
    6486: {
        "name": "איסוף מהלקוח\\ספק באר שבע",
        "branch": "סניף באר שבע",
        "vehicleTypeId": "4",
        "custID": "6486",
        "street": "יהודה הנחתום",
        "houseNo": "5",
        "city": "באר שבע",
        "selfpickup": ""
    },
    6484: {
        "name": "איסוף מהלקוח\\ספק לפתח תקווה",
        "branch": "סניף פתח תקווה",
        "vehicleTypeId": "5",
        "custID": "6384",
        "street": "הסיבים",
        "houseNo": "43",
        "city": "פתח תקווה",
        "selfpickup": ""
    }

};

const app = express();

const campaignList = getCampaigns();

//const parseString = require('xml2js').parseString;
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


// parse application/x-www-form-urlencoded;
app.use(bodyParser.urlencoded({ extended: true }));

// parse application/json
app.use(bodyParser.json());

// parse some custom thing into a Buffer
app.use(bodyParser.raw({ type: 'application/vnd.cip4-jmf+xml' }));


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



var sql = require("mssql");

// config for your database
const config = {
    user: 'tabula',
    password: 'Priority18',
    server: '172.16.0.33',
    port: 1433,
    database: 'iprint1',
    connectionTimeout: 300000,
    requestTimeout: 300000,
    pool: {
        max: 10,
        min: 0,
        idleTimeoutMillis: 30000
    }
};

const baldarConfig = {
    user: 'iprintAPI',
    password: 'HPdfeHPdfe#1',
    server: "172.16.0.31",
    port: 1433,
    database: 'BaldarSQL',
    connectionTimeout: 300000,
    requestTimeout: 300000,
    pool: {
        max: 10,
        min: 0,
        idleTimeoutMillis: 30000
    }
};
const baldarPool =  new sql.ConnectionPool(baldarConfig);
const pool = new sql.ConnectionPool(config);
var conn = pool;
var baldarConn = baldarPool;


app.get('/baldar/dbquery',(req,res) => {
    console.log("U am in");

    // connect to your database
    baldarConn.connect().then (function () {
        // create Request object
        var request = new sql.Request(baldarConn);

        // query to the database and get the records
        let queryStr = "select\
                            (case \
			                    when lcStatus.StatusName = 'משלוח בהמתנה'\
			                    then 'בייצור'\
			                    when  lcStatus.StatusName = 'פתוח'\
                                then 'מוכן להפצה'\
                                when  lcStatus.StatusName = 'בוצע'\
                                then 'נמסר'\
                                when  lcStatus.StatusName = 'נאסף'\
                                then case \
                                        when vt.VehicleTypeName like 'איסוף%'\
                                        then 'מחכה לאיסוף עצמי'\
                                        else 'בדרך ללקוח'\
                                     end\
                            end) as 'StatusName',\
                            vt.VehicleTypeName,\
                            d.DeliveryNumber,\
                            d.DeliveryTime,\
                            d.CustomerDeliveryNo,\
                            d.CompanyNameLet as 'FromCompany',\
                            cd.EmployeeName as 'CollectDriver',		\
                            dd.EmployeeName as 'DeliverDriver',\
                            d.ContactManName as 'ToName', \
                            lcFromStreet.StreetName as 'FromStreetName',\
                            d.StreetNumOut as 'FromStreetNum',\
                            lcFromCity.CityName as 'FromCityName',\
                            d.CompanyNameGet as 'ToCompany',\
                            lcToStreet.StreetName as 'ToStreetName',\
                            d.StreetNumDes as 'ToStreetNum',\
                            d.KnisaDes as 'ToEntrance',\
                            lcToCity.CityName as 'ToCityName',\
                            d.ExeTime as 'Delivered',\
                            d.Receiver as 'Receiver',\
                            d.Comment2\
                    from dbo.DeliveryNote d\
                            LEFT JOIN dbo.Lkup_street lcToStreet ON d.StreetDes = lcToStreet.StreetID\
                            LEFT JOIN dbo.Lkup_street lcFromStreet ON d.StreetOut = lcFromStreet.StreetID\
                            LEFT JOIN dbo.Lkup_city lcToCity ON d.CityDes = lcToCity.CityID\
                            LEFT JOIN dbo.Lkup_city lcFromCity ON d.CityOut = lcFromCity.CityID\
                            LEFT JOIN dbo.Employee cd ON d.EmployeeID = cd.EmployeeID\
                            LEFT JOIN dbo.Employee dd ON d.EmployeeIDSec = dd.EmployeeID\
                            LEFT JOIN dbo.Lkup_VehicleType vt ON d.VehicleTypeID = vt.VehicleTypeID,\
                         dbo.Lkup_DeliveryStatus lcStatus\
                    where d.DeliveryStatus = lcStatus.StatusID\
                      and d.DeliveryStatus in (1,2,3,4,11,12)";

        console.log(queryStr);
        request.query(queryStr, function (err, recordset) {
            if (err) console.log(err)
            // send records as a response
            res.send(recordset["recordset"]);
            baldarConn.close();
        }).catch(function (err) {
            console.log(err);
            baldarConn.close();
        });
    });
});


app.get('/ariel/dbquery',(req,res) => {
    console.log("U am in");

  // connect to your database
    conn.connect().then (function () {
        // create Request object
        var request = new sql.Request(conn);

        // query to the database and get the records
        console.log("select CUSTDES from CUSTOMERS where CUSTDES like '"  + req.query["firstPart"] + "%'");
        request.query("select CUSTDES from CUSTOMERS where CUSTDES like '"  + req.query["firstPart"] + "%' order by CUSTDES", function (err, recordset) {
            if (err) console.log(err)
           // send records as a response
            res.send(recordset);
            conn.close();
        }).catch(function (err) {
            console.log(err);
            conn.close();
        });
    });
});

app.get('/ariel/agentPerformance',(req,res) => {
    console.log("U am in");

    // connect to your database
    conn.connect().then (function () {
        // create Request object
        var request = new sql.Request(conn);
        let dayOfPerformance = req.query["dayOfPerformance"];
        // query to the database and get the records
        let queryStr = "SELECT\
            b.[AGENTNAME],\
            sum(case \
                    when (CURDATE = [system].[dbo].tabula_atod('"+ dayOfPerformance + "','YYYY-MM-DD'))\
                    then a.DISPRICE\
                    else 0\
                end) as DAY,\
            sum(case \
                    when (CURDATE = [system].[dbo].tabula_atod('"+ dayOfPerformance + "','YYYY-MM-DD'))\
                    then 1\
                    else 0\
                end) as DAYCNT,\
            sum(case \
                    when (CURDATE = [system].[dbo].tabula_atod(dateadd(day,-1, cast('"+ dayOfPerformance + "' as date)),'YYYY-MM-DD'))\
                    then a.DISPRICE\
                    else 0\
                end) as PREVIOUS_DAY,\
            sum(case \
                    when (CURDATE = [system].[dbo].tabula_atod(dateadd(day,-1, cast('"+ dayOfPerformance + "' as date)),'YYYY-MM-DD'))\
                    then 1\
                    else 0\
                end) as PREVIOUS_DAYCNT,\
            sum(case\
                    when (CURDATE BETWEEN [system].[dbo].tabula_bofmonth([system].[dbo].tabula_atod('"+ dayOfPerformance + "','YYYY-MM-DD'))\
                                      AND [system].[dbo].tabula_eofmonth([system].[dbo].tabula_atod('"+ dayOfPerformance + "','YYYY-MM-DD')))\
                    then a.DISPRICE\
                    else 0\
                end) as MONTH,\
            sum(case\
                    when (CURDATE BETWEEN [system].[dbo].tabula_bofmonth([system].[dbo].tabula_atod('"+ dayOfPerformance + "','YYYY-MM-DD'))\
                                      AND [system].[dbo].tabula_eofmonth([system].[dbo].tabula_atod('"+ dayOfPerformance + "','YYYY-MM-DD')))\
                    then 1\
                    else 0\
                end) as MONTHCNT,\
            sum(case\
                    when (CURDATE BETWEEN [system].[dbo].tabula_bofmonth([system].[dbo].tabula_atod(dateadd(month,-1, cast('"+ dayOfPerformance + "' as date)),'YYYY-MM-DD'))\
                                      AND [system].[dbo].tabula_eofmonth([system].[dbo].tabula_atod(dateadd(month,-1, cast('"+ dayOfPerformance + "' as date)),'YYYY-MM-DD')))\
                    then a.DISPRICE\
                    else 0\
                end) as PREVIOUS_MONTH,\
            sum(case\
                    when (CURDATE BETWEEN [system].[dbo].tabula_bofmonth([system].[dbo].tabula_atod(dateadd(month,-1, cast('"+ dayOfPerformance + "' as date)),'YYYY-MM-DD'))\
                                      AND [system].[dbo].tabula_eofmonth([system].[dbo].tabula_atod(dateadd(month,-1, cast('"+ dayOfPerformance + "' as date)),'YYYY-MM-DD')))\
                    then 1\
                    else 0\
                end) as PREVIOUS_MONTHCNT,\
            sum(case\
                    when (CURDATE BETWEEN [system].[dbo].tabula_bofyear([system].[dbo].tabula_atod('"+ dayOfPerformance + "','YYYY-MM-DD'))\
                    AND [system].[dbo].tabula_eofyear([system].[dbo].tabula_atod('"+ dayOfPerformance + "','YYYY-MM-DD')))\
                    then a.DISPRICE\
                    else 0\
            end) as YEAR,\
            sum(case\
                    when (CURDATE BETWEEN [system].[dbo].tabula_bofyear([system].[dbo].tabula_atod('"+ dayOfPerformance + "','YYYY-MM-DD'))\
                    AND [system].[dbo].tabula_eofyear([system].[dbo].tabula_atod('"+ dayOfPerformance + "','YYYY-MM-DD')))\
                    then 1\
                    else 0\
            end) as YEARCNT\
            FROM [iprint1].[dbo].[ORDERS] a,\
                [iprint1].[dbo].AGENTS b\
            where a.AGENT = b.AGENT\
            AND ORDSTATUS not in (-1,-6)\
            group by  b.[AGENTNAME]";
        console.log(queryStr);
        request.query(queryStr, function (err, recordset) {
            if (err) console.log(err)
            // send records as a response
            res.send(recordset);
            conn.close();
        }).catch(function (err) {
            console.log(err);
            conn.close();
        });
    });
});


app.get('/ariel/agentTargets',(req,res) => {
    console.log("U am in");

    // connect to your database
    conn.connect().then (function () {
        // create Request object
        var request = new sql.Request(conn);
        let year = req.query["year"];
        // query to the database and get the records
        let queryStr =
            "SELECT  c.AGENTNAME,\
                    case\
                        when (MONTH(getdate()) = 12)\
                        then b.DECPRICE\
                        when (MONTH(getdate()) = 11)\
                        then b.NOVPRICE\
                        when (MONTH(getdate()) = 10)\
                        then b.OCTPRICE\
                        when (MONTH(getdate()) = 9)\
                        then b.SEPPRICE\
                        when (MONTH(getdate()) = 8)\
                        then b.AUGPRICE\
                        when (MONTH(getdate()) = 7)\
                        then b.JULPRICE\
                        when (MONTH(getdate()) = 6)\
                        then b.JUNPRICE\
                        when (MONTH(getdate()) = 5)\
                        then b.MAYPRICE\
                        when (MONTH(getdate()) = 4)\
                        then b.APRPRICE\
                        when (MONTH(getdate()) = 3)\
                        then b.MARPRICE\
                        when (MONTH(getdate()) = 2)\
                        then b.FEBPRICE\
                        when (MONTH(getdate()) = 1)\
                        then b.JANPRICE\
                    end as MONTHTARGET,\
                    b.YPRICE as YEARTARGET\
            from    [iprint1].[dbo].[SALESTARGETS] a,\
                    [iprint1].[dbo].[SALESTARGETITEMS] b,\
                    [iprint1].[dbo].AGENTS c\
            where b.SALESTARGET = a.SALESTARGET\
            and b.AGENT = c.AGENT\
            and STYEAR = " + year;
        console.log(queryStr);
        request.query(queryStr, function (err, recordset) {
            if (err) console.log(err)
            // send records as a response
            res.send(recordset);
            conn.close();
        }).catch(function (err) {
            console.log(err);
            conn.close();
        });
    });
});

app.get('/ariel/agentNewCustomers',(req,res) => {
    console.log("U am in");

    // connect to your database
    conn.connect().then (function () {
        // create Request object
        var request = new sql.Request(conn);
        let lowerLimit = req.query["lowerLimit"];
        // query to the database and get the records
        let queryStr =
            "select ag.AGENTNAME,\
                    count(distinct g.CUST) as NumberOfCustomers,\
                    count(*) as NumberOfOrder,\
                    sum(g.DISPRICE) as Revenue\
              FROM [iprint1].[dbo].ORDERS g,\
                   [iprint1].[dbo].AGENTS ag,\
                   [iprint1].[dbo].[ORDSTATUS] os,\
                   (SELECT a.CUST \
                      FROM [iprint1].[dbo].CUSTOMERS a,\
                           [iprint1].[dbo].CUSTSTATS b\
                     WHERE NOT EXISTS (SELECT b.CUST FROM [iprint1].[dbo].ORDERS b\
                                        WHERE b.CUST = a.CUST\
                                          AND b.CURDATE < [system].[dbo].tabula_atod('"+ lowerLimit + "','YYYY-MM-DD'))\
                       AND a.CUSTSTAT = b.CUSTSTAT\
                       AND b.STATDES = 'פעיל') f\
             WHERE g.CUST = f.CUST\
               and g.AGENT = ag.AGENT\
               and g.ORDSTATUS = os.ORDSTATUS\
               and os.ORDSTATUSDES in ('תהליך ייצור','לחיוב','מוכן להפצה','נמסר','נשלח','סוף ייצור')\
          group by ag.AGENTNAME";
        console.log(queryStr);
        request.query(queryStr, function (err, recordset) {
            if (err) console.log(err)
            // send records as a response
            res.send(recordset["recordset"]);
            conn.close();
        }).catch(function (err) {
            console.log(err);
            conn.close();
        });
    });
});

app.get('/ariel/companyPerformance',(req,res) => {
    console.log("U am in");

    // connect to your database
    conn.connect().then (function () {
        // create Request object
        var request = new sql.Request(conn);
        // query to the database and get the records
        let queryStr =
            "SELECT \
                case\
                    when (format([system].[dbo].tabula_dateconvert(CURDATE),'yyyy') = format(getdate(),'yyyy'))\
                    then 'CurrentYear'\
                    else 'LastYear'\
                end as Year,\
                    format([system].[dbo].tabula_dateconvert(CURDATE),'MM') as Month,\
                    b.BRANCHDES,\
                    SUM(DISPRICE) as Income\
               FROM [iprint1].[dbo].ORDERS o,\
                    [iprint1].[dbo].BRANCHES b,\
                    [iprint1].[dbo].ORDSTATUS os\
              WHERE CURDATE >= [system].[dbo].tabula_atod( convert(varchar,DATEADD(yy, DATEDIFF(yy, 0, DATEADD(year,-1,GETDATE())), 0),23),'YYYY-MM-DD')\
                AND o.BRANCH = b.BRANCH\
                AND o.ORDSTATUS = os.ORDSTATUS\
                AND os.ORDSTATUSDES in ('תהליך ייצור','לחיוב','מוכן להפצה','נמסר','נשלח','סוף ייצור')\
           group by \
                case\
                    when (format([system].[dbo].tabula_dateconvert(CURDATE),'yyyy') = format(getdate(),'yyyy'))\
                    then 'CurrentYear'\
                    else 'LastYear'\
                end,\
                    format([system].[dbo].tabula_dateconvert(CURDATE),'MM'),\
                    b.BRANCHDES";
        console.log(queryStr);
        request.query(queryStr, function (err, recordset) {
            if (err) console.log(err)
            // send records as a response
            res.send(recordset["recordset"]);
            conn.close();
        }).catch(function (err) {
            console.log(err);
            conn.close();
        });
    });
});

app.get('/ariel/profitCenterPerformance',(req,res) => {
    console.log("U am in");

    // connect to your database
    conn.connect().then (function () {
        // create Request object
        var request = new sql.Request(conn);
        let dayOfPerformance = req.query["dayOfPerformance"];
        // query to the database and get the records
        let queryStr = "SELECT\
            b.[BRANCHDES],\
            sum(case \
                    when (CURDATE = [system].[dbo].tabula_atod('"+ dayOfPerformance + "','YYYY-MM-DD'))\
                    then a.DISPRICE\
                    else 0\
                end) as DAY,\
            sum(case \
                    when (CURDATE = [system].[dbo].tabula_atod('"+ dayOfPerformance + "','YYYY-MM-DD'))\
                    then 1\
                    else 0\
                end) as DAYCNT,\
            sum(case \
                    when (CURDATE = [system].[dbo].tabula_atod(dateadd(day,-1, cast('"+ dayOfPerformance + "' as date)),'YYYY-MM-DD'))\
                    then a.DISPRICE\
                    else 0\
                end) as PREVIOUS_DAY,\
            sum(case \
                    when (CURDATE = [system].[dbo].tabula_atod(dateadd(day,-1, cast('"+ dayOfPerformance + "' as date)),'YYYY-MM-DD'))\
                    then 1\
                    else 0\
                end) as PREVIOUS_DAYCNT,\
            sum(case\
                    when (CURDATE BETWEEN [system].[dbo].tabula_bofmonth([system].[dbo].tabula_atod('"+ dayOfPerformance + "','YYYY-MM-DD'))\
                                      AND [system].[dbo].tabula_eofmonth([system].[dbo].tabula_atod('"+ dayOfPerformance + "','YYYY-MM-DD')))\
                    then a.DISPRICE\
                    else 0\
                end) as MONTH,\
            sum(case\
                    when (CURDATE BETWEEN [system].[dbo].tabula_bofmonth([system].[dbo].tabula_atod('"+ dayOfPerformance + "','YYYY-MM-DD'))\
                                      AND [system].[dbo].tabula_eofmonth([system].[dbo].tabula_atod('"+ dayOfPerformance + "','YYYY-MM-DD')))\
                    then 1\
                    else 0\
                end) as MONTHCNT,\
            sum(case\
                    when (CURDATE BETWEEN [system].[dbo].tabula_bofmonth([system].[dbo].tabula_atod(dateadd(month,-1, cast('"+ dayOfPerformance + "' as date)),'YYYY-MM-DD'))\
                                      AND [system].[dbo].tabula_eofmonth([system].[dbo].tabula_atod(dateadd(month,-1, cast('"+ dayOfPerformance + "' as date)),'YYYY-MM-DD')))\
                    then a.DISPRICE\
                    else 0\
                end) as PREVIOUS_MONTH,\
            sum(case\
                    when (CURDATE BETWEEN [system].[dbo].tabula_bofmonth([system].[dbo].tabula_atod(dateadd(month,-1, cast('"+ dayOfPerformance + "' as date)),'YYYY-MM-DD'))\
                                      AND [system].[dbo].tabula_eofmonth([system].[dbo].tabula_atod(dateadd(month,-1, cast('"+ dayOfPerformance + "' as date)),'YYYY-MM-DD')))\
                    then 1\
                    else 0\
                end) as PREVIOUS_MONTHCNT,\
            sum(case\
                    when (CURDATE BETWEEN [system].[dbo].tabula_bofyear([system].[dbo].tabula_atod('"+ dayOfPerformance + "','YYYY-MM-DD'))\
                    AND [system].[dbo].tabula_eofyear([system].[dbo].tabula_atod('"+ dayOfPerformance + "','YYYY-MM-DD')))\
                    then a.DISPRICE\
                    else 0\
            end) as YEAR,\
            sum(case\
                    when (CURDATE BETWEEN [system].[dbo].tabula_bofyear([system].[dbo].tabula_atod('"+ dayOfPerformance + "','YYYY-MM-DD'))\
                    AND [system].[dbo].tabula_eofyear([system].[dbo].tabula_atod('"+ dayOfPerformance + "','YYYY-MM-DD')))\
                    then 1\
                    else 0\
            end) as YEARCNT\
            FROM [iprint1].[dbo].[ORDERS] a,\
                [iprint1].[dbo].BRANCHES b\
            where a.BRANCH = b.BRANCH\
            AND ORDSTATUS not in (-1,-6)\
              AND CURDATE > rcTools.dbo.InlineMin([system].[dbo].tabula_bofyear([system].[dbo].tabula_atod('"+ dayOfPerformance + "','YYYY-MM-DD')),[system].[dbo].tabula_bofmonth([system].[dbo].tabula_atod(dateadd(month,-1, cast('"+ dayOfPerformance + "' as date)),'YYYY-MM-DD')))\
        group by  b.[BRANCHDES]";
        console.log(queryStr);
        request.query(queryStr, function (err, recordset) {
            if (err) console.log(err)
            // send records as a response
            res.send(recordset);
            conn.close();
        }).catch(function (err) {
            console.log(err);
            conn.close();
        });
    });
});



app.get('/ariel/quoteStatusLeadTime',(req,res) => {
    console.log("U am in");

    // connect to your database
    conn.connect().then (function () {
        // create Request object
        var request = new sql.Request(conn);
        let from = req.query["from"];
        let to = req.query["to"];
        // query to the database and get the records
        let queryStr =
            "SELECT   tb.STATDES,avg(td.DURATION) average, stdev(td.DURATION) standardDev, min(td.DURATION) minimum, max(td.DURATION) maximum, count(*) cnt,\
                sum(case\
                        when (td.DURATION between 0 and 2)\
                        then 1\
                        else 0\
                    end) as between0_2,\
                sum(case\
                        when (td.DURATION between 3 and 10)\
                        then 1\
                        else 0\
                    end) as between3_10,\
                sum(case\
                        when (td.DURATION between 11 and 20)\
                        then 1\
                        else 0\
                        end) as between11_20,\
                sum(case\
                        when (td.DURATION between 21 and 30)\
                        then 1\
                        else 0\
                    end) as between21_30,\
                sum(case\
                        when (td.DURATION between 31 and 60)\
                        then 1\
                        else 0\
                    end) as between31_60,\
                sum(case\
                        when (td.DURATION between 61 and 120)\
                        then 1\
                        else 0\
                    end) as between61_120,\
                sum(case\
                        when (td.DURATION between 121 and 240)\
                        then 1\
                        else 0\
                    end) as between121_240,\
                sum(case\
                        when (td.DURATION between 241 and 360)\
                        then 1\
                        else 0\
                    end) as between241_360,\
                sum(case\
                        when (td.DURATION between 361 and 720)\
                        then 1\
                        else 0\
                    end) as between361_720,\
                sum(case\
                        when (td.DURATION between 721 and 1440)\
                        then 1\
                        else 0\
                    end) as between721_1440,\
                sum(case\
                        when (td.DURATION between 1441 and 2880)\
                        then 1\
                        else 0\
                    end) as between1441_2880,\
                sum(case\
                        when (td.DURATION between 2881 and 4320)\
                        then 1\
                        else 0\
                    end) as between2881_4320,\
                sum(case\
                        when (td.DURATION > 4320)\
                        then 1\
                        else 0\
                    end) as greater4320\
        FROM [iprint1].[dbo].[CPROF] ta,\
            [iprint1].[dbo].[DOCSTATUSES] tb ,\
            [iprint1].[dbo].[CPROFTYPES] tc,\
            [iprint1].[dbo].[TODOLIST] td\
        where ta.PROF = td.IV\
        and td.DOCSTATUS = tb.DOCSTATUS\
        and td.DURATION > 0\
        and  tb.TYPE = 'C'\
        and ta.CPROFTYPE = tc.CPROFTYPE\
        and tc.TYPECODE = 200\
        AND ta.[PDATE] BETWEEN  [system].[dbo].tabula_atod('" + from + "','YYYY-MM-DD') AND  [system].[dbo].tabula_atod('" + to + "','YYYY-MM-DD')\
        group by tb.STATDES";
        console.log(queryStr);
        request.query(queryStr, function (err, recordset) {
            if (err) console.log(err)
            // send records as a response
            res.send(recordset);
            conn.close();
        }).catch(function (err) {
            console.log(err);
            conn.close();
        });
    });
});

app.get('/ariel/orderStatusLeadTime',(req,res) => {
    console.log("U am in");

    // connect to your database
    conn.connect().then (function () {
        // create Request object
        var request = new sql.Request(conn);
        let from = req.query["from"];
        let to = req.query["to"];
        // query to the database and get the records
        let queryStr =
            "SELECT   os.ORDSTATUSDES,avg(td.DURATION) average, stdev(td.DURATION) standardDev, min(td.DURATION) minimum, max(td.DURATION) maximum, count(*) cnt,\
                sum(case\
                        when (td.DURATION between 0 and 2)\
                        then 1\
                        else 0\
                    end) as between0_2,\
                sum(case\
                        when (td.DURATION between 3 and 10)\
                        then 1\
                        else 0\
                    end) as between3_10,\
                sum(case\
                        when (td.DURATION between 11 and 20)\
                        then 1\
                        else 0\
                        end) as between11_20,\
                sum(case\
                        when (td.DURATION between 21 and 30)\
                        then 1\
                        else 0\
                    end) as between21_30,\
                sum(case\
                        when (td.DURATION between 31 and 60)\
                        then 1\
                        else 0\
                    end) as between31_60,\
                sum(case\
                        when (td.DURATION between 61 and 120)\
                        then 1\
                        else 0\
                    end) as between61_120,\
                sum(case\
                        when (td.DURATION between 121 and 240)\
                        then 1\
                        else 0\
                    end) as between121_240,\
                sum(case\
                        when (td.DURATION between 241 and 360)\
                        then 1\
                        else 0\
                    end) as between241_360,\
                sum(case\
                        when (td.DURATION between 361 and 720)\
                        then 1\
                        else 0\
                    end) as between361_720,\
                sum(case\
                        when (td.DURATION between 721 and 1440)\
                        then 1\
                        else 0\
                    end) as between721_1440,\
                sum(case\
                        when (td.DURATION between 1441 and 2880)\
                        then 1\
                        else 0\
                    end) as between1441_2880,\
                sum(case\
                        when (td.DURATION between 2881 and 4320)\
                        then 1\
                        else 0\
                    end) as between2881_4320,\
                sum(case\
                        when (td.DURATION > 4320)\
                        then 1\
                        else 0\
                    end) as greater4320\
         FROM   [iprint1].[dbo].[ORDERS] ta,\
                [iprint1].[dbo].[ORDSTATUS] os ,\
                [iprint1].[dbo].[TODOLIST] td\
        where ta.ORDSTATUS = os.ORDSTATUS\
        and ta.ORD = td.IV\
        and td.DURATION > 0\
        AND ta.[CURDATE] BETWEEN  [system].[dbo].tabula_atod('" + from + "','YYYY-MM-DD') AND  [system].[dbo].tabula_atod('" + to + "','YYYY-MM-DD')\
        group by os.ORDSTATUSDES";
        console.log(queryStr);
        request.query(queryStr, function (err, recordset) {
            if (err) console.log(err)
            // send records as a response
            res.send(recordset);
            conn.close();
        }).catch(function (err) {
            console.log(err);
            conn.close();
        });
    });
});



app.get('/finReps/orders',(req,res) => {
    console.log("I am in");

    // connect to your database
    conn.connect().then (function () {
        // create Request object
        var request = new sql.Request(conn);

        // query to the database and get the records
        let queryStr = "SELECT\
        B.BRANCHDES,\
        count(*) NumberOfOrder,\
        sum(O.QPRICE) RevenueOfOrders\
        FROM ORDERS O, BRANCHES B\
        WHERE O.BRANCH = B.BRANCH\
        AND ORDSTATUS not in (-1,-6)\
        AND month([system].[dbo].tabula_dateconvert(CURDATE) ) = 3\
        AND year([system].[dbo].tabula_dateconvert(CURDATE) ) = 2019\
        group by B.BRANCHDES";


        console.log(queryStr);
        request.query(queryStr, function (err, recordset) {
            if (err) console.log(err);
            // send records as a response
            res.send(recordset["recordsets"]);
            conn.close();
        }).catch(function (err) {
            console.log(err);
            conn.close();
        });
    }).catch(function (err) {
        console.log(err);
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

app.get('/db/pc/query', (req, res) => {
    //console.log(req);
    getPCQuery(req)
        .then(response => {
            // use the count result in here
            //console.log(req);
            if (response.contentType === "csv") {
                res.set({
                    'Content-Type': 'text/csv',
                    'Accept': 'text/csv'
                });
                console.log(JSON.stringify(response));
                res.status(200).send(response.body).end();
            } else {
                res.set({
                    'Content-Type': 'application/json'
                });
                res.status(200).json(response.body).end();
            }
        }).catch(err => {
        console.log(err + 'Got error from Production Center ');
        res.status(400).json("Something went wrong: " + err).end();
    });
});

function getPCQuery (req) {
    console.log("I am in getPCQuery");
    let queryDef = req.query;
    console.log(queryDef);
    let options = {
        url: PCUrl,
        method: 'GET',
        headers: req.headers,
        strictSSL: false
    };
    console.log("In Header: " + JSON.stringify(req.headers));
    let contentType = "json";
    if (req.headers["content-type"] === "text/csv") {
        contentType = "csv";
    }
    let queryString = "";
    let uri = "";
    for (let key in queryDef){
        if (key === "uri") {
            uri = queryDef["uri"];
        } else {
            if (queryString === "") {
                queryString = "?";
            } else {
                queryString += "&";
            }
            queryString += key + "=" + encodeURIComponent(queryDef[key]);
        }
    }
    options["url"] += uri + "/" + queryString;
   console.log(`options: ${ JSON.stringify(options) }`);
    return rp(options)
        .then(body => {
            // make the count be the resolved value of the promise
            let retArr = [];
            if (uri.includes("audit")) {
                    retArr = buildWSStatistics(JSON.parse(body));
            } else {
                retArr = JSON.parse(body)["job"];
            };
            //let normalizedArr = JSON.parse(body);
            console.log("contentType: " + contentType + uri);
            console.log(JSON.stringify(retArr[0]));
            let ret = {
                "contentType": contentType,
                "body": retArr
            };
            return ret;
        })
        .catch(function (err) {
            //console.log(err);
            return err;
        });

}

function normalizeArchiveData(rawJSON) {
        console.log("I am in normalizeArchiveData");
        let structuredSet = {};
        let retArr = [];
        let archiveSet = rawJSON["propertySet"];
        console.log("I am before loop");
        for (let i=0; i<archiveSet.length;i++) {
            let stateDetails = archiveSet[i]["properties"];
            console.log(JSON.stringify(stateDetails));
            var hashKey = stateDetails["job_id"] + stateDetails["proc_friendlyName"];
            console.log(hashKey);
            if (!(hashKey in structuredSet)) {
                structuredSet[hashKey] = {};
            }
            structuredSet[hashKey]["job_name"] = stateDetails["job_name"];
            structuredSet[hashKey]["job_id"] = stateDetails["job_id"];
            structuredSet[hashKey]["proc_friendlyName"] = stateDetails["proc_friendlyName"];
            structuredSet[hashKey]["joblet_isRework"] = stateDetails["joblet_isRework"];
            structuredSet[hashKey][stateDetails["auditEntry_detailKey"]+"-Start"] = stateDetails["auditEntry_auditTime"];
            structuredSet[hashKey][stateDetails["auditEntry_detailKey"]+"-End"] = stateDetails["auditEntry_endTime"];
        }
        for (let key in structuredSet) {
            retArr.push(structuredSet[key])
        }
        console.log(JSON.stringify(retArr));
        return retArr;
}
function buildWSStatistics(rawJSON) {
    console.log("I am in buildWSStatistics");
    let structuredSet = {};
    let retArr = [];
    let archiveSet = rawJSON["propertySet"];
    console.log("I am before loop");
    for (let i=0; i<archiveSet.length;i++) {
        let stateDetails = archiveSet[i]["properties"];
        //console.log(JSON.stringify(stateDetails));
        var hashKey = stateDetails["joblet_id"] + stateDetails["proc_friendlyName"];
        let state = stateDetails["auditEntry_detailKey"];
        if (state === "Processor.Released"
            || state ==="Processor.Started"
            || state ==="Processor.Completed"
            || state === "Processor.Exited") {
            if (!(hashKey in structuredSet)) {
                structuredSet[hashKey] = {};
            }
            structuredSet[hashKey]["job_name"] = stateDetails["job_name"];
            structuredSet[hashKey]["joblet_id"] = stateDetails["joblet_id"];
            structuredSet[hashKey]["proc_friendlyName"] = stateDetails["proc_friendlyName"];
            structuredSet[hashKey]["joblet_isRework"] = stateDetails["joblet_isRework"];
            structuredSet[hashKey][stateDetails["auditEntry_detailKey"] + "-Start"] = stateDetails["auditEntry_auditTime"];
            structuredSet[hashKey][stateDetails["auditEntry_detailKey"] + "-End"] = stateDetails["auditEntry_endTime"];
        }
    }
    //2019-12-08T08:09:21+02:0
    //const pcDateFormat = "YYYY-MM-DDTHH:mm+02:00";
    let wsSet = {};
    let fullDuration;
    let in2start;
    let start2end;

    let dateStartStr = "";
    let dateEndStr = "";
    for (let WSjobID in structuredSet) {
        let ws = structuredSet[WSjobID]["proc_friendlyName"];
        if (!(ws in wsSet)) {
            wsSet[ws] = {
                "ws": ws,
                "fullDuration": 0,
                "fullMin": 0,
                "fullMax": 0,
                "in2Start": 0,
                "start2End": 0,
                "count": 0
            }
        }
        let skip = false;
        //FullDuration
        dateStartStr = structuredSet[WSjobID]["Processor.Released-Start"];
        dateEndStr = structuredSet[WSjobID]["Processor.Completed-End"];
        console.log("AAAAA");
        if (dateStartStr && dateEndStr) {
            let dateStart = date.parse(dateStartStr,"YYYY-MM-DDTHH:mm:ss+02:00");
            let dateEnd = date.parse(dateEndStr,"YYYY-MM-DDTHH:mm:ss+02:00");
            let dateDiff = dateEnd - dateStart;
            if (dateDiff/(1000*60)<2) {
                skip = true;
            }
            if (!skip) {
                wsSet[ws]["fullDuration"] += dateDiff / (1000 * 60);
                wsSet[ws]["count"] += 1;
                //Max
                if (dateDiff > wsSet[ws]["fullMax"]) {
                    wsSet[ws]["fullMax"] = dateDiff / (1000 * 60);
                }
                //Min
                if (dateDiff <= wsSet[ws]["fullMin"]) {
                    wsSet[ws]["fullMin"] = dateDiff / (1000 * 60);
                }
                console.log("FullDuration: " + structuredSet[WSjobID]["proc_friendlyName"] + ": " + dateStartStr + " - " + dateEndStr + " " + dateDiff);
            }
        }
        if (!skip) {
            //in2Start
            dateStartStr = structuredSet[WSjobID]["Processor.Released-Start"];
            dateEndStr = structuredSet[WSjobID]["Processor.Start-Start"];
            if (dateStartStr && dateEndStr) {
                let dateStart = date.parse(dateStartStr, "YYYY-MM-DDTHH:mm:ss+02:00");
                let dateEnd = date.parse(dateEndStr, "YYYY-MM-DDTHH:mm:ss+02:00");
                let dateDiff = dateEnd - dateStart;
                wsSet[ws]["in2Start"] += dateDiff / (1000 * 60);
                console.log("in2Start: " + structuredSet[WSjobID]["proc_friendlyName"] + ": " + dateStartStr + " - " + dateEndStr + " " + dateDiff);
            }

            dateStartStr = structuredSet[WSjobID]["Processor.Start-Start"];
            dateEndStr = structuredSet[WSjobID]["Processor.Completed-End"];
            if (dateStartStr && dateEndStr) {
                let dateStart = date.parse(dateStartStr, "YYYY-MM-DDTHH:mm:ss+02:00");
                let dateEnd = date.parse(dateEndStr, "YYYY-MM-DDTHH:mm:ss+02:00");
                let dateDiff = dateEnd - dateStart;
                wsSet[ws]["start2End"] += dateDiff / (1000 * 60);
                console.log("start2End: " + structuredSet[WSjobID]["proc_friendlyName"] + ": " + dateStartStr + " - " + dateEndStr + " " + dateDiff);
            }
        }
    }
    for (let key in wsSet) {
        retArr.push(wsSet[key])

    }
//    console.log(JSON.stringify(retArr));
    return retArr;
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

app.post('/xerox/fb',
    (req,res) => {
        console.log("JMF - Received message");
        console.log("Content-Type: " + req.get('Content-Type'));
        console.log("ORIGINAL: " + req.body);
        createJMFSignalFile(req.body);
        console.log("JMF - End");
        res.status(200).json(req.body).end();
});

app.get('/baldar/cancelDelivery',
    (req,res) => {
        console.log(req.query);
        let deliveryJSON = {
            "DeliveryNumber": req.query["deliveryNumber"],
            "DeliveryStatus": "8"
        };

        cancelDelivery(deliveryJSON)
            .then(resp => {
                console.log(resp);
                let retVal = resp;
                if (retVal < 0) {
                    res.status(400).json({"error code": retVal}).end()

                } else {
                    res.status(200).json({retVal}).end();
                }
            });
    });



function cancelDelivery(deliveryJSON) {
    console.log("Starting cancelDelivery ...");
    console.log(deliveryJSON);
    console.log("pParam=" + JSON.stringify(deliveryJSON));
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
            let retVal =  JSON.parse(convert.xml2json(body, {compact: true, spaces: 4})).int._text;
            console.log(body);
            console.log(retVal);

            //let responseJSON = JSON.parse(body);
            return retVal;
        })
        .catch (error => {
            console.log(error);
            return -1000;
        });
}





app.post('/baldar/newDelivery',
    (req,res) => {
        console.log(req.body);
        console.log(req.query);
        let printloc = req.query["printloc"];
        let destinations = req.body['destinations'];
        let deliveryJSON = req.body;
        let packageAmount = 1;
        delete deliveryJSON['destinations'];
        let dest = destinations[0];
        for (let key in dest) {
            if (key !== "packageAmount") {
                deliveryJSON[key] = dest[key];
            }
        }
        console.log(deliveryJSON);
        saveDelivery(deliveryJSON)
            .then(resp => {
                //    console.log(resp);
                let retVal = resp["DeliveryNumber"];
                if (retVal < 0) {
                    res.status(400).json({"error code": retVal}).end()

                } else {
                    res.status(200).json({"DeliveryNum": retVal}).end();
                    //createCSVFile(retVal, req.body, printloc);
                    resp["TypeOfDelivery"] =  deliverySource[resp["CustomerID"]].name;
                    console.log(resp);
                    createPDFSticker("label.html",resp, retVal + "__" + printloc +  ".pdf");
                }
            });
});

function saveDelivery(deliveryJSON) {
    console.log("Starting saveDelivery ...");
    console.log(deliveryJSON);
    console.log("Ariel: " );
    console.log("pParam=" + JSON.stringify(deliveryJSON));
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
            let updObj = {};
            updObj["DeliveryNumber"] = deliveryNumber;
            updObj["DeliveryStatus"] = "1";
            let selfPickup = deliverySource[deliveryJSON["CustomerID"]].selfpickup;
            if (selfPickup) {
                updObj["EmployeeID"] = selfPickup;
                updObj["EmployeeIDSec"] = selfPickup;
                updObj["DeliveryStatus"] = "4";
            };
            options.body = "pParam=" + JSON.stringify(updObj);
            return rp(options)
                .then(body => {
                    console.log(body);
                    return {...deliveryJSON, ...updObj};
                })
                .catch(error => {
                    console.log(error)
                })
         })
        .catch (error => {
            console.log(error);
        });
}

function createPDFSticker (templateName,dataObj,outputFile) {
    var canvas = new Canvas.createCanvas();
    JsBarcode(canvas, dataObj["DeliveryNumber"],{
        format: "CODE39",
        height: 40,
        width: 1,
        fontSize: 10,
        displayValue: false
    });
    var dataUrl = canvas.toDataURL();
    dataObj["deliveryBC"] = dataUrl;

    console.log(dataUrl);
//exit;
    let template = fs.readFileSync(templateDir+ '/' +templateName, 'utf8');
    let options = {
        "height": "150mm",        // allowed units: mm, cm, in, px
        "width": "100mm"          // allowed units: mm, cm, in, px
    };
    let html = Mustache.render(template, dataObj);
    pdf.create(html, options).toFile(stickerDir+"/"+outputFile, function(err, res) {
        if (err) return console.log(err);
        console.log(res); // { filename: '/app/businesscard.pdf'
    });

}


function createCSVFile (deliveryNumber,deliveryObj,printloc) {
    let fields = [
        "DeliverNumber",
        "TypeOfDelivery",
        "OrderID",
        "CustomerName",
        "ContactPerson",
        "ContactTel",
        "Street",
        "HouseNo",
        "City",
        "RemarkForShipping"
    ];
    let csvFields = {
        "DeliverNumber": deliveryNumber,
        "TypeOfDelivery": deliverySource[deliveryObj["CustomerID"]].name,
        "OrderID": deliveryObj.customerDeliveryNum,
        "CustomerName": deliveryObj.companyNameGet,
        "ContactPerson": deliveryObj.contactManName,
        "ContactTel": deliveryObj.PhoneDes,
        "Street": deliveryObj.streetDes,
        "HouseNo": deliveryObj.streetNumDes,
        "City": deliveryObj.cityDes,
        "RemarkForShipping": deliveryObj.comment2
    };


    let csv = "";
    try {
        const parser = new Json2csvParser({fields: fields.sort(), delimiter: '\t'});
        csv = parser.parse(csvFields);
        console.log(csv);
    } catch (err) {
        console.error(err);
    }

    let engBranch = deliverySource[deliveryObj["CustomerID"]].engBranch;

    fs.writeFile(stickerDir+"/sticker_direct_" + printloc + "_" + deliveryNumber + ".csv", "\ufeff" + csv, 'ucs2', function (err) {
        if (err) {
            return console.log(err);
        }

        console.log("The file was saved!");
    });
}

function createJMFSignalFile (signal) {
    let fileSuffix = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);

    fs.writeFile(jmfDir+"/JMF_" + fileSuffix + ".xml", signal,'ucs2', function (err) {
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
        console.log(JSON.stringify(newLead));

    return rp(options).then(body => {
            let responseJSON = JSON.parse(body);
            console.log(responseJSON);
            return JSON.parse(body);
        }).catch(function (err) {
        console.log(err);
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
    }).catch(function (err) {
        console.log(err);
    });
}

function getOrderStatus(orderID) {
   //orderID = params["order"].toUpperCase();
   var  options = {  
        url: "https://31.154.74.138:20443/odata/Priority/tabula.ini/iprint1/ORDERS('" + orderID + "')",
        method: 'GET',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Basic ' + Buffer.from("priority" + ':' +  "Priority18").toString('base64')
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
              'Authorization': 'Basic ' + Buffer.from("priority" + ':' +  "Priority18").toString('base64')
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