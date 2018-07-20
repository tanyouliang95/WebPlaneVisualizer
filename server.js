var fs = require('fs');
const rosnodejs = require('rosnodejs');

var express = require('express');
var app = express();
var readyMode = false;
var JsonString;

app.use('/js', express.static(__dirname + '/js/'));
app.use('/media', express.static(__dirname + '/media/'));


console.log("Creating Server...");

// testing, to change ready Mode to true
app.get('/changeMode', function (req, res) {
    readyMode = true;
    res.send("hi");
})

// being called and return bool. If true means planar data is ready
app.get('/dataReady', function (req, res) {
    res.send(readyMode);
})

// send pointcloud data
app.get('/planeDatas', function (req, res) {
    console.log("Being called by client to get Planar_datas");
    res.send({
        title: "Lidar PCD Loader",
        // planar_datas_json: JSON.stringify(planar_datas),
        planar_datas_json: JsonString
    })
})

// home
app.get('/', function (req, res) {
    readyMode = false;
    fs.readFile('indoor_plane_visualizer.html', function(err, data) {
        res.writeHead(200, {'Content-Type': 'text/html'});
        res.write(data);
        res.end();
      });
})

app.listen(8080, "192.168.1.108");
console.log("http:/192.168.1.108:8080/");



// ================ ROS Subsriber listening from topic ==================

// Requires the std_msgs message package
const std_msgs = rosnodejs.require('std_msgs').msg;

function listener() {
    // Register node with ROS master
    rosnodejs.initNode('/JS_visualizer')
    .then((rosNode) => {
        console.log("node started");
        // Create ROS subscriber on the 'chatter' topic expecting String messages
        let sub = rosNode.subscribe('/planeBorders', std_msgs.String,
            (data) => { // define callback execution
                rosnodejs.log.info('I heard from ROSTOPIC: /planeBorders ');
                JsonString = data.data;
                readyMode = true;
            }
        );
    });
}

if (require.main === module) {
    // Invoke Main Listener Function
    listener();
}