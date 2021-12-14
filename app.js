import express, { json } from 'express'
import minimist from 'minimist'
import {
    Driver, 
    InclusionStrategy,
    CommandClass
} from "zwave-js"

import outdoorLightSwitch from "./app_modules/OutdoorLightSwitch.js"

var argv = minimist(process.argv.slice(2));
console.dir(argv);

// Adjust the serial port depending on the platform you run this app
const serialPort = argv.port || "/dev/ttyUSB0";
const driver = new Driver(serialPort)

const app = express()
const port = 3001



////////////////////////////////////////////////////////////////////////////////////
// System Services/Module Dispatcher
////////////////////////////////////////////////////////////////////////////////////
const getCurrentTimeFormatted = () => {
    const date = new Date()
    const hour = date.getHours()
    const min = date.getMinutes()
    if(hour > 12) {
        if(min < 10) { return (hour - 12) + ":0" + min + "pm" } 
        else { return (hour - 12) + ":" + min + "pm" }
    } else if(hour === 12) {
        if(min < 10) { return "12:0" + min + "pm" } 
        else { return "12:" + min + "pm" }
    } if(hour === 0) {
        if(min < 10) { return "12:0" + min + "am" } 
        else { return "12:" + min + "am" }
    } else {
        if(min < 10) { return hour + ":0" + min + "am" } 
        else { return hour + ":" + min + "am" }
    }
}

const timerIntervalFunction = () => {
    const currentTime = getCurrentTimeFormatted()
    outdoorLightSwitch.processSystemTimeEvent(driver, currentTime)
}

setInterval(timerIntervalFunction, 60000)



////////////////////////////////////////////////////////////////////////////////////
// Z-Wave Driver Events
////////////////////////////////////////////////////////////////////////////////////

// You must add a handler for the error event before starting the driver
driver.on("error", (e) => {
    // Do something with it
    console.error(e)
});

// "driver ready" event fired after controller interview is complete. We know the
// nodes previously included, but they are still being interviewed.
driver.once("driver ready", () => {
    console.log("\'driver ready\' event fired")
    console.log("  Network (controller) Home ID: " + driver.controller.homeId.toString())
    driver.controller.nodes.forEach((node) => {
        node.on("ready", async () => { 
            console.log("\'ready\' event fired")
            console.log("  Found Node ID: " + node.id + ", Device Class: " + JSON.stringify(node.deviceClass.basic.label));  
            
            node.on("value updated", async (_node, args) => {
                outdoorLightSwitch.processValueUpdatedEvent(driver, node.id, args)
            })

            node.on("value notification", async (_node, args) => {
                outdoorLightSwitch.processValueNotificationEvent(driver, node.id, args)
            })

            node.on("asleep", () => {
                console.log("\'asleep\' node event fired")
                // ToDo: When is this fired? By battery powered devices cycling off? What to do?
            });

            node.on("wakeup", () => {
                console.log("\'wakeup\' node event fired")
                // ToDo: When is this fired? By battery powered devices cycling on? What to do?
            });
        });
    });

    driver.controller.on("inclusion started", () => {
        console.log("\'inclusion started\' controller event fired")
        // ToDo: Do we care about this event?
    });
    
    driver.controller.on("exclusion started", () => {
        console.log("\'exclusion started\' controller event fired")
        // ToDo: Do we care about this event?
    });
    
    driver.controller.on("inclusion failed", () => {
        console.log("\'inclusion failed\' controller event fired")
        // ToDo: log a detailed message for this failure. Does this function get an error parameter?
    });
    
    driver.controller.on("exclusion failed", () => {
        console.log("\'exclusion failed\' controller event fired")
        // ToDo: log a detailed message for this failure. Does this function get an error parameter?
    });
    
    driver.controller.on("inclusion stopped", () => {
        console.log("\'inclusion stopped\' controller event fired")
        // ToDo: this is fired when a node has been successfully included. What action do we need to take?
        //       Determine if a sensor or actuator? If actuator, sign it up for sensor events?
        //       Do it here or in node added?
    });
    
    driver.controller.on("exclusion stopped", () => {
        console.log("\'exclusion stopped\' controller event fired")
        // ToDo: this is fired when a node has been successfully excluded. If it was a sensor, then
        // make sure there aren't any actuators listening for events.
        // Do it here or in node removed?
    });

    driver.controller.on("node added", () => {
        console.log("\'node added\' controller event fired")
        // ToDo: this is fired when a node has been added. Should we respond to this or
        // inclusion stopped?
    });

    driver.controller.on("node removed", () => {
        console.log("\'node removed\' controller event fired")
        // ToDo: this is fired when a node has been removed. Should we respond to this or
        // exclusion stopped?
    });

    driver.controller.on("heal network progress", () => {
        console.log("\'heal network progress\' controller event fired")
        // ToDo: this is fired when we request a status? This is future.
    });

    driver.controller.on("heal network done", () => {
        console.log("\'heal network done\' controller event fired")
        // ToDo: This is future
    });

    driver.controller.on("statistics updated", () => {
        console.log("\'statistics updated\' controller event fired")
        // ToDo: implement some detailed logs to show us the stats
    });
});



////////////////////////////////////////////////////////////////////////////////////
// Start the driver. To await this method, put this line into an async method
////////////////////////////////////////////////////////////////////////////////////
(async () => {
    await driver.start();
})();

for (const signal of ["SIGINT", "SIGTERM"]) {
    process.on(signal, async () => {
        await driver.destroy();
        process.exit(0);
    });
}



////////////////////////////////////////////////////////////////////////////////////
// event processing
// ToDo: break out into independent modules?
////////////////////////////////////////////////////////////////////////////////////
const processEvent = (eventName) => {
    switch(eventName) {

        case "node on value updated":
            // A node has updated its value. See which one and act on it.
            console.log("\'value updated\' event fired")
            console.log(`  value updated node=${node.nodeId} CC=${args.propertyKey} newValue=${args.newValue}`);

            // Wake the display and turn on lights when motion is detected
            /*
            if(args.propertyKey === "Motion sensor status") {
                console.log("Turning on lights...");
                // WAKE DISPLAY
                if(lightSwitch !== undefined) {
                    lightSwitch.set(true);
                }
                if(timer !== undefined) {
                    clearTimeout(timer);
                }
                timer = setTimeout(() => {
                    // SUSPEND DISPLAY
                    if(lightSwitch !== undefined) {
                        lightSwitch.set(false);
                    }
                }, 60000)
            } 

            // Show emergency message when the alarm goes off
            if(args.propertyKey === "Alarm status") {
                if(args.newValue === 3) {
                    console.log("Alarm sounded!")
                    // SEND EMERGENCY MESSAGE
                    // STRETCH GOAL - UNLOCK DOORS
                }
                if(args.newValue === 0) {
                    console.log("Alarm cleared")
                    // CLEAR EMERGENCY MESSAGE
                }
            }
            */
            break;

        case "node on value notification":
            // smoke alarm values are stateless and use the value notification event. 
            console.log("\'value notification\' event fired")
            console.log(`  value notification node=${node.nodeId} CC=${args.propertyKey} newValue=${args.newValue}`);
            // ToDo: in order to scale to more devices we can't look just for Alarm status
            /*
            if(args.propertyKey === "Alarm status") {
                if(args.newValue === 3) {
                    console.log("Alarm sounded 2!")
                    // ToDo: what action do I want to take when alarm goes off?
                }
                if(args.newValue === 0) {
                    console.log("Alarm cleared 2")
                    // ToDo: what action do I want to take when alarm clears?
                }
            }
            */
            break;
    }
}



////////////////////////////////////////////////////////////////////////////////////
// Module initialization
////////////////////////////////////////////////////////////////////////////////////
const initModules = () => {
    outdoorLightSwitch.initModule()
}

initModules()



////////////////////////////////////////////////////////////////////////////////////
// Support functions
////////////////////////////////////////////////////////////////////////////////////
const removeFailedNode = (nodeId) => {
    driver.controller.removeFailedNode(nodeId)
    .then(function(result) {
        return result
    })
    .then(function(result) {
        if(result) {
            console.log("Removed device " + nodeId)
        } else {
            console.log("Node ID " + nodeId + " is not a failed node")
        }
    })
    .catch(function(err) {
        console.log("Error removing node " + nodeId + ": " + err)
    })
}



////////////////////////////////////////////////////////////////////////////////////
// http request processing for testing and operation of the network
// Naming conventions follow https://restfulapi.net/resource-naming/
////////////////////////////////////////////////////////////////////////////////////
app.listen(port, () => {
    console.log(`Example app listening at http://localhost:${port}`)
})

app.get('/network-management/devices/audit-devices', (req, res) => {
    let response = "Device Audit Result:\n"
    driver.controller.nodes.forEach(async (node) => {
        response += "Device Node ID: " + node.id + "\n"
        response += "- Name: " + node.name + "\n"
        response += "- Location: " + node.location + "\n"
        response += "- Basic Class: " + node.deviceClass.basic.label + "\n"
        response += "- Generic Class: " + node.deviceClass.generic.label + "\n"
        const status = node.status
        switch(status) {
            case 0: 
                response += "- Status: Unknown\n" 
                break;
            case 1:
                response += "- Status: Asleep\n" 
                break;
            case 2:
                response += "- Status: Awake\n" 
                break;
            case 3:
                response += "- Status: Dead\n" 
                break;
            case 4:
                response += "- Status: Alive\n" 
                break;
            default:
        }
    })
    response += "End Device Audit"
    res.send(response)

    //const id = req.query.nodeid

    //console.log("  Found Node ID: " + node.id + ", Device Class: " + JSON.stringify(node.deviceClass.basic.label));
    //console.log("  Found Node ID: " + node.id + ", Device Class: " + JSON.stringify(node.deviceClass.generic.label));
})

app.get('/network-management/devices/onboard-new-device', async (req, res) => {
    driver.controller.beginInclusion({strategy: InclusionStrategy.Default})
    .then(function(result) {
        if(result) {
            res.send("Inclusion process started, begin device pairing process.")
        } else {
            res.send("Inclusion process failed to start.")
        }
    })
    .catch(function(err) {
        res.send("Error starting node inclusion process: \n" + err)
    })
})

app.get('/network-management/devices/remove-device', async (req, res) => {
    driver.controller.beginExclusion(driver.controller.supportsFeature(SmartStart))
    .then(function(result) {
        if(result) {
            res.send("Exclusion process started. Follow your device specific instructions for removing from a network.")
        } else {
            res.send("Exclusion process did not start. It may already be running. Wait 30s and try again.")
        }
    })
    .catch(function(err) {
        res.send("Error starting node exclusion process: \n" + err)
    })
})

app.get('/network-management/devices/remove-failed-device', async (req, res) => {
    const nodeId = req.query.nodeId
    driver.controller.isFailedNode(nodeId)
    .then(function(result) {
        return result
    })
    .then(function(result) {
        if(result) {
            // Remove the failed node
            res.send("Removing device " + nodeId)
            removeFailedNode(nodeId)
        } else {
            res.send("Node ID " + nodeId + " is not a failed node")
        }
    })
    .catch(function(err) {
        res.send("Error confirming if node is failed: \n" + err)
    })
})




