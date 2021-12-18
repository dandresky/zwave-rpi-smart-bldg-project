/**
 * @brief   The OutdoorLightSwitch module enables or disables a group of light switches 
 *          at times of the day configured by the user. The user can also configure this 
 *          to be triggered by a sensor like an ambient light sensor.
 * 
 * @details All app modules implement the following functions according to its needs:
 * 
 *          applyModuleConfigChanges()
 *          initModule()
 *          processDeviceAddedEvent(node, result)
 *          processDeviceRemovedEvent(node, replaced)
 *          processSystemTimeEvent(driver, currentTime)
 *          processValueUpdatedEvent(driver, node, args)
 *          processValueNotificationEvent(driver, node, args)
 * 
 *          None of these functions returns anything, allowing the module to have an empty
 *          (blank) implementation for an event that it doesn't care about. But all modules 
 *          must implement these functions. 
 * 
 * @details For the first release we will assume that a web config app is used to on-board
 *          devices and register them with the modules. Each module has an associated json 
 *          file with information about the app and how it can be configured. The app serves 
 *          up a web config page showing these parameters to the user so they can be managed.
 */

import chalk from 'chalk'
import fs from 'fs'



let moduleJsonObject
let state



const outdoorLightSwitch = {

    ////////////////////////////////////////////////////////////////////////////////////
    // Private helper functions
    ////////////////////////////////////////////////////////////////////////////////////
    /**
     * @brief   Set light switches either on or off. Assume all registeredActuators are
     *          the correct device classes and support the commands. The web config app
     *          will enforce rules to prevent illegal devices.
     * 
     * @param   driver - reference to the driver object that may be needed by the module
     * @param   mode - "on" or "off"
     */
    setLightSwitches: function(driver, mode) {

        moduleJsonObject.registeredActuators.forEach(registeredActuator => {

            let lightSwitch
            const node = driver.controller.nodes.get(parseInt(registeredActuator.nodeId))
            const switchCCApi = node.commandClasses['Binary Switch']

            switch(mode) {
                case "on":
                    console.log(chalk.greenBright("Module(OLS) - turning switch on"))
                    if (switchCCApi.isSupported()) {
                        console.log(`Node ${node.id} is a switch!`);
                        lightSwitch = switchCCApi
                        lightSwitch.set(true)
                    }
                    break;
                case "off":
                    console.log(chalk.greenBright("Module(OLS) - turning switch off"))
                    if (switchCCApi.isSupported()) {
                        console.log(`Node ${node.id} is a switch!`);
                        lightSwitch = switchCCApi
                        lightSwitch.set(false)
                    }
                    break
                default:
                    console.log(chalk.greenBright("Module(OLS) - setLightSwitches received invalid mode argument"))
            }
        })
    },

    ////////////////////////////////////////////////////////////////////////////////////
    // Public functions called by the main application
    ////////////////////////////////////////////////////////////////////////////////////

    /**
     * @brief   Apply module config file changes.
     *          
     * @details The module json file has been changed outside of this application. re-read
     *          the file into the local variable. 
     */
    applyModuleConfigChanges: function() {
        this.initModule()
    },

    /**
     * @brief   Initialize the module.
     *          
     * @details All modules must implement this function but may choose to leave blank if they
     *          don't have any initialization to do. 
     * 
     * @details This module reads the config json file and prepares the json object so we only
     *          do it once.
     */
    initModule: function() {
        fs.readFile("./app_modules/OutdoorLightSwitch.json", "utf8", (err, jsonString) => {
            if (err) {
                console.log(chalk.greenBright("Module(OLS) - App: File read failed:", err))
                return;
            }
            try {
                moduleJsonObject = JSON.parse(jsonString)
                state = moduleJsonObject.userAppConfigurationParameters.find(element => 
                    element.name === "Normal State").value
                console.log(chalk.greenBright("State = " + state))
            } catch (err) {
                console.log(chalk.greenBright("Module(OLS) - Error parsing JSON string:", err))
            }
        })
    },

    /**
     * @brief   Process the device added event from the application.
     * 
     * @details All modules must implement this function but may choose to leave blank if they
     *          don't care about the event. At the moment the OLS module assumes users map devices 
     *          to modules using a web config app that can access module json files so there is
     *          nothing to do at this time.
     * 
     * @param   node - device node object
     * @param   result - Additional information about the inclusion result
     */
    processDeviceAddedEvent: function(node, result) {
        //console.log(chalk.greenBright(`Module(OLS) - Device ${node.id} Added to the network with result: ${result}`))
    },

    /**
     * @brief   Process the device removed event from the application.
     * 
     * @details All modules must implement this function but may choose to leave blank if they
     *          don't care about the event. At the moment the OLS module assumes users map devices 
     *          to modules using a web config app that can access module json files so there is
     *          nothing to do at this time.
     * 
     * @param   node - device node object
     * @param   result - Additional information about the inclusion result
     */
    processDeviceRemovedEvent: function(node, replaced) {
        //console.log(chalk.greenBright(`Module(OLS) - Device ${node.id} Removed from the network, was replaced = ${replaced}`))
    },

    /**
     * @brief   Process a system time event from the application. The application runs a
     *          timer that signals once a minute with a standard (12-hour clock) time string.
     *          
     * @details All modules must implement this function but may choose to leave blank if they
     *          don't care about the event. 
     * 
     * @details This module compares the current system time to the configured start and stop 
     *          times in the accompanying json file.
     * 
     * @param   driver - reference to the driver object that may be needed by the module
     * @param   currentTime = string representing the current system time in 12-hour format
     */
    processSystemTimeEvent: function(driver, currentTime) {
        
        console.log(chalk.greenBright("Module(OLS) - SYSTEM_TIME_EVENT received: " + currentTime))

        moduleJsonObject.userAppConfigurationParameters.forEach(param => {
            switch(param.name) {
                case "Start time 1":
                    if((param.value === currentTime) && (param.value !== "00:00")) {
                        console.log(chalk.greenBright("Module(OLS) - start time 1 matches current time"))
                        state = "on"
                        this.setLightSwitches(driver, "on")
                    }
                    break;
                case "Stop time 1":
                    if((param.value === currentTime) && (param.value !== "00:00")) {
                        console.log(chalk.greenBright("Module(OLS) - stop time 1 matches current time"))
                        state = "off"
                        this.setLightSwitches(driver, "off")
                    }
                    break;
                case "Start time 2":
                    if((param.value === currentTime) && (param.value !== "00:00")) {
                        console.log(chalk.greenBright("Module(OLS) - start time 2 matches current time"))
                        state = "on"
                        this.setLightSwitches(driver, "on")
                    }
                    break;
                case "Stop time 2":
                    if((param.value === currentTime) && (param.value !== "00:00")) {
                        console.log(chalk.greenBright("Module(OLS) - stop time 2 matches current time"))
                        state = "off"
                        this.setLightSwitches(driver, "off")
                    }
                    break;
                case "Normal State":
                    // ToDo: periodically check that the device is in the correct state
                    break
                default:
                    console.log(chalk.greenBright("Module(OLS) - Found unknown user config parameter"))
            }
        })
    },

    /**
     * @brief   Process a value updated event from a device we are signed up to listen to.
     * 
     * @details All modules must implement this function but may choose to leave blank if they
     *          don't care about any device events. 
     * 
     * @details This module doesn't currently support any sensing devices. In future versions the 
     *          OutdoorLightSwitch module will respond to sensor events such as ambient light sensor.
     * 
     * @param   driver - reference to the driver object that may be needed by the module
     * @param   nodeId - node sending the value updated event
     * @param   args - arguments associated with the value update
     */
     processValueUpdatedEvent: function(driver, node, args) {
        console.log(chalk.greenBright("Module(OLS) - VALUE_UPDATED event received from node: " + node.id))
     },

     /**
     * @brief   Process a value updated event from a device we are signed up to listen to.
     * 
     * @details All modules must implement this function but may choose to leave blank if they
     *          don't care about any device events. 
     * 
     * @details This module doesn't currently support any alarm devices.
     * 
     * @param   driver - reference to the driver object that may be needed by the module
     * @param   nodeId - node sending the value updated event
     * @param   args - arguments associated with the value update
     */
    processValueNotificationEvent: function(driver, node, args) {
        console.log(chalk.greenBright("Module(OLS) - VALUE_NOTIFICATION event received from node: " + node.id))
    }
}

export default outdoorLightSwitch



/* Generic Device Classes defined in the specification
GENERIC_TYPE_AV_CONTROL_POINT
GENERIC_TYPE_DISPLAY
GENERIC_TYPE_ENTRY_CONTROL
GENERIC_TYPE_GENERIC_CONTROLLER
GENERIC_TYPE_METER
GENERIC_TYPE_METER_PULSE
GENERIC_TYPE_NON_INTEROPERABLE
GENERIC_TYPE_REPEATER_SLAVE
GENERIC_TYPE_SEMI_INTEROPERABLE
GENERIC_TYPE_SENSOR_ALARM
GENERIC_TYPE_SENSOR_BINARY
GENERIC_TYPE_SENSOR_MULTILEVEL
GENERIC_TYPE_STATIC_CONTROLLER
GENERIC_TYPE_SWITCH_BINARY
GENERIC_TYPE_SWITCH_MULTILEVEL
GENERIC_TYPE_SWITCH_REMOTE
GENERIC_TYPE_SWITCH_TOGGLE
GENERIC_TYPE_THERMOSTAT
GENERIC_TYPE_VENTILATION
GENERIC_TYPE_WINDOW_COVERING
*/

