const express = require('express');
const mongoose = require('mongoose');
const crypto = require("crypto");
var nodemailer = require('nodemailer');
const cron = require('node-cron');
const moment = require('moment-timezone');

const timezone = 'Asia/Kolkata';
const app = express();

mongoose.connect(
    "mongodb+srv://spandanbera1710:l6IxK87w4Q9QcRCD@crudcluster0.r4qcptq.mongodb.net/?retryWrites=true&w=majority"
)
    .then(() => console.log("connection established..."))
    .catch((err) => console.log("check errror..."));

app.use(express.urlencoded({ extended: false }));

const downtimeSchema = new mongoose.Schema({
    appId: {
        type: String,
        unique: true
    },
    appName: {
        type: String,
        unique: true,
        required: true
    },
    downtime: {
        type: String,
        required: true
    },
    resolveTime: {
        type: Number,
        required: true
    },
    uptime: {
        type: String
    },
    status: {
        type: String
    }
})

const downtimeauto = mongoose.model("downtimeData", downtimeSchema);

const getUptime = (downtime, resolveTime) => {
    const date = downtime.slice(0, 10).split('-');//['2024', '02', '15'] "Spandan, Snehal, Saikat".split(", ") => ["Spandan", "Snehal", "Saikat"]
    const time = downtime.slice(11).split(':'); //['10', '00', '30']
    if(parseInt(date[1]) < 10){
        date[1] = parseInt(date[1]) % 10;
    }
    if(parseInt(date[2]) < 10){
        date[2] = parseInt(date[2]) % 10;
    }
    if(parseInt(time[0]) < 10){
        time[0] = parseInt(time[0]) % 10;
    }
    if(parseInt(time[1]) < 10){
        time[1] = parseInt(time[1]) % 10;
    }
    if(parseInt(time[2]) < 10){
        time[2] = parseInt(time[2]) % 10;
    }
    const uptime = new Date(parseInt(date[0]), parseInt(date[1]) - 1, parseInt(date[2]), parseInt(time[0]), parseInt(time[1]), parseInt(time[2]) + resolveTime);
    return uptime;
}

cron.schedule('0 * * * *', () => {
        // Execute your API here
        fetch('http://localhost:8000/api/application/downmail')
          .then(data => console.log("api executed at ", new Date().toLocaleString()))
          .catch(err => console.error(err));
    }
    , {
      timezone // Set the timezone for the cron job
});

cron.schedule('0 * * * *', () => {
        // Execute your API here
        fetch('http://localhost:8000/api/application/upmail')
          .then(data => console.log("api executed at ", new Date().toLocaleString()))
          .catch(err => console.error(err));
    }
    , {
      timezone // Set the timezone for the cron job
});

// cron.schedule('* * * * *', () => {
//     // Execute your API here
//     fetch('http://localhost:8000/api/application/status')
//       .then(res => console.log(res))
//       .then(data => console.log("api executed at ", new Date().toLocaleString()))
//       .catch(err => console.error(err));
// }
// , {
//   timezone // Set the timezone for the cron job
// });

app.get("/api/application", async (req, res) => {
    const d = new Date();
    const d1 = "no new data...";
    console.log(d < d1);
    // const id = crypto.randomBytes(16).toString("hex");
    // console.log(id);
    // const d = new Date("2024-12-01 10:15:14");
    // console.log(new Date("Tue Dec 03 2024 10:15:14 GMT+0530 (India Standard Time)"));
    // console.log(d.toString());
    // const date = "2024-12-01 10:15:14".slice(0, 10).split('-');
    // console.log(date);
    // const date = downtime.slice(0, 10).split('-');
    // const time = "2024-12-01 10:15:14".slice(11).split(':');
    // console.log(time);
    // if(parseInt(date[2]) < 10){
    //     date[2] = parseInt(date[2]) % 10;
    // }
    // const d1 = new Date(parseInt(date[0]), parseInt(date[1]) - 1, parseInt(date[2]), parseInt(time[0]), parseInt(time[1]), parseInt(time[2]) + 172800);
    // const d1 = new Date(d + 172800000);
    // console.log(d1.toString());
    // console.log(d1 - d);
    // const resT = 172870;
    // const hours = Math.floor(resT / 3600);
    // const minutes = Math.floor((resT % 3600) / 60);
    // const seconds = Math.floor((resT % 3600) % 60);
    // console.log(hours);
    // console.log(minutes);
    // console.log(seconds);
});
app.get("/api/application/mail", async (req, res) => {
    var transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
          user: 'lionel10.sbera@gmail.com',
          pass: 'oyzk oakr hzxd uqkj'
        }
      });
    const str = "bleh";
      var mailOptions = {
        from: 'lionel10.sbera@gmail.com',
        to: 'spandanbera1710@gmail.com',
        subject: 'Sending Email using Node.js',
        text: 'This is to tell you, that i love you...!'+'\nok\n'+str
      };

      transporter.sendMail(mailOptions, function(error, info){
        if (error) {
          console.log(error);
        } else {
          return res.send('Email sent: ' + info.response);
        }
      });
})

app.post("/api/application", async (req, res) => {
    try{
        const present = new Date();
        const resT = req.body.resolveTime;
        const downtime = req.body.downtime;
        const d = new Date(downtime);
        const uptime = getUptime(downtime, resT);
        const status = (d > present || uptime < present) ? "Up" : "Down";
        const reqBody = {
            appId: crypto.randomBytes(16).toString("hex"),
            appName: req.body.appName,
            downtime: d.toString(),
            resolveTime: req.body.resolveTime,
            uptime: uptime.toString(),
            status: status
        };
        await downtimeauto.create(reqBody);
        return res.status(201).send("new data added...");
    }
    catch(err){
        return res.status(200).send(err);
    }
});

app.patch("/api/application/status", async (req, res) => {
    const present = new Date();
    const data = await downtimeauto.find();
    data.forEach(async (item, index, array) => {
        const dt = new Date(item.downtime);
        const ut = new Date(item.uptime);
        if(item.downtime !== "-"){
            if(present >= dt && present <= ut){
                // console.log(item);
                await downtimeauto.findOneAndUpdate({'appId': item.appId}, {"status": "Down"});
                // console.log(await downtimeauto.findOne({'appid': item.appId}));
            }
            else{
                await downtimeauto.findOneAndUpdate({'appId': item.appId}, {"status": "Up"});
            }
        }
    });
    return res.json(await downtimeauto.find());
});

app.patch("/api/application/status/:appId", async (req, res) => {
    const present = new Date();
    const appId = req.params.appId;
    const data = await downtimeauto.findOne({'appId': appId});
    const dt = new Date(data.downtime);
    const ut = new Date(data.uptime);
    if(data.downtime !== "-"){
        if(present >= dt && present <= ut){
            // console.log(item);
            await downtimeauto.findOneAndUpdate({'appId': appId}, {"status": "Down"});
            // console.log(await downtimeauto.findOne({'appid': item.appId}));
        }
        else{
            await downtimeauto.findOneAndUpdate({'appId': appId}, {"status": "Up"});
        }
    }
    return res.json(await downtimeauto.findOne({'appId': appId}));
});

app.patch("/api/application/update/:appId", async (req, res) => {
    try{
        const appId = req.params.appId;
        const data = await downtimeauto.findOne({"appId": appId});
        // console.log(data);
        if(data){
            if(data.downtime === '-'){
                const present = new Date();
                const downtime = req.body.downtime;
                const resT = req.body.resolveTime;
                const d = new Date(downtime);
                const uptime = getUptime(downtime, resT);
                
                const status = (d > present || uptime < present) ? "Up" : "Down";
                // console.log(uptime.toString());
                reqBody = {
                    downtime: new Date(downtime),
                    resolveTime: resT,
                    uptime: uptime.toString(),
                    status: status
                };
                await downtimeauto.findOneAndUpdate({"appId": appId}, reqBody);
                return res.send("new downtime added for " + data.appName + "...");
            }
            else{
                return res.send("this application already has a scheduled downtime...");
            }
        }
        else{
            return res.send("no application found by the provided appId...");
        }
    }
    catch(err){
        return res.status(200).send(err);
    }
});

app.get("/api/application/downmail", async (req, res) => {
    const present = new Date();
    var message = "";
    const data = await downtimeauto.find();
    data.forEach(async (item, index, array) => {
        if(item.downtime !== "-"){
            const dt = new Date(item.downtime);
            if(dt - present <= 7200000 && dt - present > 0){
                // console.log(dt - present);
                message = message + (item.appName + " at " + item.downtime + "\n");
            }
        }
    });
    var transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
          user: 'lionel10.sbera@gmail.com',
          pass: 'oyzk oakr hzxd uqkj'
        }
    });

    var mailOptions = {
        from: 'lionel10.sbera@gmail.com',
        to: 'spandanbera1710@gmail.com, arkapriobhattacharya@gmail.com, paulupasana18@gmail.com, adhikarysattwik@gmail.com, snehal02.pvt@gmail.com',
        subject: 'Upcomming Scheduled Downtime.',
        text: 'The following application(s) have a scheduled downtime within 2 hours.\n\n' + message
    };

    if(message !== ""){
        transporter.sendMail(mailOptions, function(error, info){
            if (error) {
              console.log(error);
            } else {
              return res.send('Email sent: ' + info.response);
            }
        });
    }
    else{
        return res.send("no upcomming scheduled downtime...")
    }
});

app.get("/api/application/upmail", async (req, res) => {
    try{
        const present = new Date();
        var message = "";
        const data = await downtimeauto.find();
        data.forEach(async (item, index, array) => {
            if(item.downtime !== "-"){
                const ut = new Date(item.uptime);
                if(present > ut){
                    // console.log(dt - present);
                    message = message + (item.appName + " since " + item.uptime + "\n");
                    await downtimeauto.findOneAndUpdate({'appId': item.appId}, {"downtime": "-", "status": "Up"});
                }
            }
        });
        var transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: 'lionel10.sbera@gmail.com',
                pass: 'oyzk oakr hzxd uqkj'
            }
        });

        var mailOptions = {
            from: 'lionel10.sbera@gmail.com',
            to: 'spandanbera1710@gmail.com, arkapriobhattacharya@gmail.com, paulupasana18@gmail.com, adhikarysattwik@gmail.com, snehal02.pvt@gmail.com',
            subject: 'Revived Application(s).',
            text: 'The following application(s) have revived and are up and running.\n\n' + message
        };

        if(message !== ""){
            transporter.sendMail(mailOptions, function(error, info){
                if (error) {
                    console.log(error);
                } else {
                    return res.send('Email sent: ' + info.response);
                }
            });
        }
        else{
            return res.send("no applications revived yet...")
        }
    }
    catch(err){
        return res.status(200).send(err);
    }
});

app.listen(8000, () => (
    console.log("listening at port 8000 downtime...")
));