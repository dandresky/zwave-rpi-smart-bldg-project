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



////////////////////////////////////////////////////////////////////////////////////
// Z-Wave Driver Events
////////////////////////////////////////////////////////////////////////////////////

// "driver ready" event fired after controller interview is complete. We know the
// nodes previously included, but they are still being interviewed.
driver.once("driver ready", () => {
    console.log("\'driver ready\' event fired")
    console.log("  Network (controller) Home ID: " + driver.controller.homeId.toString())
    driver.controller.nodes.forEach((node) => {
        node.once("ready", async () => { 
            processEvent("node on ready")

            node.once("value updated", async (_node, args) => {
                processEvent("node on value updated")
            })

            node.once("value notification", async (_node, args) => {
                processEvent("node on value notification")
            })

            node.once("asleep", () => {
                console.log("\'asleep\' node event fired")
                // ToDo: When is this fired? By battery powered devices cycling off? What to do?
            });

            node.once("wakeup", () => {
                console.log("\'wakeup\' node event fired")
                // ToDo: When is this fired? By battery powered devices cycling on? What to do?
            });
        });
    });

    driver.controller.once("inclusion started", () => {
        console.log("\'inclusion started\' controller event fired")
        // ToDo: Do we care about this event?
    });
    
    driver.controller.once("exclusion started", () => {
        console.log("\'exclusion started\' controller event fired")
        // ToDo: Do we care about this event?
    });
    
    driver.controller.once("inclusion failed", () => {
        console.log("\'inclusion failed\' controller event fired")
        // ToDo: log a detailed message for this failure. Does this function get an error parameter?
    });
    
    driver.controller.once("exclusion failed", () => {
        console.log("\'exclusion failed\' controller event fired")
        // ToDo: log a detailed message for this failure. Does this function get an error parameter?
    });
    
    driver.controller.once("inclusion stopped", () => {
        console.log("\'inclusion stopped\' controller event fired")
        // ToDo: this is fired when a node has been successfully included. What action do we need to take?
        //       Determine if a sensor or actuator? If actuator, sign it up for sensor events?
        //       Do it here or in node added?
    });
    
    driver.controller.once("exclusion stopped", () => {
        console.log("\'exclusion stopped\' controller event fired")
        // ToDo: this is fired when a node has been successfully excluded. If it was a sensor, then
        // make sure there aren't any actuators listening for events.
        // Do it here or in node removed?
    });

    driver.controller.once("node added", () => {
        console.log("\'node added\' controller event fired")
        // ToDo: this is fired when a node has been added. Should we respond to this or
        // inclusion stopped?
    });

    driver.controller.once("node removed", () => {
        console.log("\'node removed\' controller event fired")
        // ToDo: this is fired when a node has been removed. Should we respond to this or
        // exclusion stopped?
    });

    driver.controller.once("heal network progress", () => {
        console.log("\'heal network progress\' controller event fired")
        // ToDo: this is fired when we request a status? This is future.
    });

    driver.controller.once("heal network done", () => {
        console.log("\'heal network done\' controller event fired")
        // ToDo: This is future
    });

    driver.controller.once("statistics updated", () => {
        console.log("\'statistics updated\' controller event fired")
        // ToDo: implement some detailed logs to show us the stats
    });
});

// You must add a handler for the error event before starting the driver
driver.on("error", (e) => {
    // Do something with it
    console.error(e)
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
        case "node on ready":
            // 
            console.log("\'ready\' event fired")
            console.log("  Found Node ID: " + node.id + ", Device Class: " + JSON.stringify(node.deviceClass.basic.label));  
                    
            const switchCCApi = node.commandClasses['Binary Switch']
            if (switchCCApi.isSupported()) {
                console.log(`Node ${node.id} is a switch!`);
                lightSwitch = switchCCApi
            }
            break;

        case "node on value updated":
            // A node has updated its value. See which one and act on it.
            console.log("\'value updated\' event fired")
            console.log(`  value updated node=${node.nodeId} CC=${args.propertyKey} newValue=${args.newValue}`);

            // Wake the display and turn on lights when motion is detected
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
            break;

        case "node on value notification":
            // ToDo: capturing smoke alarm events seems to require responding to the
            // value notification event. However, this code block doesn't execute. 
            // The value updated event executes instead, but won't execute if this
            // event is not responded to. Why? Do I really need this?
            console.log("\'value notification\' event fired")
            console.log(`  value notification node=${node.nodeId} CC=${args.propertyKey} newValue=${args.newValue}`);
            // ToDo: in order to scale to more devices we can't look just for Alarm status
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
            break;
    }
}



////////////////////////////////////////////////////////////////////////////////////
// http request processing for testing and operation of the network
// Naming conventions follow https://restfulapi.net/resource-naming/
////////////////////////////////////////////////////////////////////////////////////
app.listen(port, () => {
    console.log(`Example app listening at http://localhost:${port}`)
})

app.get('/network-management/devices/onboard-new-device', async (req, res) => {
    const response = ""
    const options = {strategy: InclusionStrategy.Default}
    const result = await driver.controller.beginInclusion(options)
    if(result) {
        response = "Inclusion process started, begin device pairing process."
    } else {
        response = "Inclusion process failed to start."
    }
    res.send(response)
})

app.get('/EXCLUSION', async (req, res) => {
    const result = await driver.controller.beginExclusion(true)
    const response = "Begin Exclusion result: " + result
    res.send(response)
})

app.get('/network-management/devices/audit-devices', async (req, res) => {
    const response = "Device Audit Result:\n"
    driver.controller.nodes.forEach((node) => {
        const result = await driver.controller.isFailedNode(node.id)
        response += "Device Node ID: " + node.id + "\n"
        response += ", Device Class: " + node.deviceClass + "\n"
        response += ", is failed: " + result + "\n"
    })
    response += "End Device Audit"
    res.send(response)

    //const id = req.query.nodeid

    //console.log("  Found Node ID: " + node.id + ", Device Class: " + JSON.stringify(node.deviceClass.basic.label));
    //console.log("  Found Node ID: " + node.id + ", Device Class: " + JSON.stringify(node.deviceClass.generic.label));
})


