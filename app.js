import express from 'express'
import minimist from 'minimist'
import {
    Driver, 
    InclusionStrategy,
    CommandClass
} from "zwave-js"

var argv = minimist(process.argv.slice(2));
console.dir(argv);
const serialPort = argv.port || "/dev/ttyUSB0";

let lightSwitch;
let timer;

const app = express()
const port = 3001
// Adjust the serial port depending on the platform you run this app
const driver = new Driver(serialPort)

// You must add a handler for the error event before starting the driver
driver.on("error", (e) => {
    // Do something with it
    console.error(e)
});




////////////////////////////////////////////////////////////////////////////////////
// Z-Wave Driver Events
////////////////////////////////////////////////////////////////////////////////////

// "driver ready" event fired after controller interview is complete. We know the
// nodes previously included, but they are still being interviewed.
driver.once("driver ready", () => {
    // Log some info
    console.log("\'driver ready\' event fired")
    console.log("  Network (controller) Home ID: " + driver.controller.homeId.toString())
    driver.controller.nodes.forEach((node) => {
        node.on("ready", async () => { 
            console.log("\'ready\' event fired")
            console.log("  Found Node ID: " + node.id + ", Device Class: " + JSON.stringify(node.deviceClass.basic.label));  
                    
            const switchCCApi = node.commandClasses['Binary Switch']
            if (switchCCApi.isSupported()) {
                console.log(`Node ${node.id} is a switch!`);
                lightSwitch = switchCCApi
            }

            node.on('value updated', async (_node, args) => {
                console.log(`value updated node=${node.nodeId} CC=${args.propertyKey} newValue=${args.newValue}`);

                // Wake the display and turn on lights when motion is detected
                if(args.propertyKey === "Motion sensor status") {
                    console.log("Turning on things...");
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
            })

            // NOTE: We observed that when this code block is NOT here we will sometimes not capture the 
            // fire alarm's value updated event. We are mystified!
            node.on('value notification', async (_node, args) => {
                console.log(`value notification node=${node.nodeId} CC=${args.propertyKey} newValue=${args.newValue}`);
                
                // Show emergency message when the alarm goes off
                if(args.propertyKey === "Alarm status") {
                    if(args.newValue === 3) {
                        console.log("Alarm sounded 2!")
                        // SEND EMERGENCY MESSAGE
                        // STRETCH GOAL - UNLOCK DOORS
                    }
                    if(args.newValue === 0) {
                        console.log("Alarm cleared 2")
                        // CLEAR EMERGENCY MESSAGE
                    }
                }
            })

            node.on("asleep", () => {
                console.log("\'asleep\' node event fired")
                // ToDo: When is this fired? By battery powered devices cycling off? 
                //       Do we care?
            });

            node.on("wakeup", () => {
                console.log("\'wakeup\' node event fired")
                // ToDo: When is this fired? By battery powered devices cycling on? 
                //       Is this when notify an actuator that signed up for event?
            });
        });
        //console.log("  Found Node ID: " + node.id + ", Device Class: " + JSON.stringify(node.deviceClass.basic.label));
        // console.log("  Found Node ID: " + node.id + ", Device Class: " + JSON.stringify(node.deviceClass.generic.label));
        // ToDo: is this where we should querry if it is a failed node?
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
// html request processing for testing
////////////////////////////////////////////////////////////////////////////////////
app.listen(port, () => {
    console.log(`Example app listening at http://localhost:${port}`)
})

app.get('/INCLUSION', async (req, res) => {
    const options = {strategy: InclusionStrategy.Default};
    const result = await driver.controller.beginInclusion(options);
    const message = "Begin Inclusion Result: " + result
    res.send(message);
})

app.get('/EXCLUSION', async (req, res) => {
    const result = await driver.controller.beginExclusion(true);
    const message = "Begin Exclusion Result: " + result
    res.send(message);
})

app.get('/ISFAILEDNODE', async (req, res) => {
    const id = req.query.nodeid
    const result = await driver.controller.isFailedNode(id);
    const message = "is node failed result " + result
    res.send(message);
})

app.get('/REMOVEFAILEDNODE', async () => {
    // ToDo: call driver.removeFailedNode
})

