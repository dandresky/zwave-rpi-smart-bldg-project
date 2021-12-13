/**
 * @brief   The OutdoorLightSwitch module enables or disables a group of light switches 
 *          at times of the day configured by the user. The user can also configure this 
 *          to be triggered by a sensor like an ambient light sensor.
 * 
 * @details It does this by signing up for event signals generated by zwave devices on 
 *          the network or system events.
 * 
 * @details All app modules implement the following two functions according to its needs:
 * 
 *              networkNotification(driver)
 *              getRequiredSystemServices()
 * 
 *          Both functions are called at startup by the application. Additionally, 
 *          networkNotifiction is called every time the network configuration changes. 
 * 
 * @details Another thought:
 * 
 *          The module informs the application what devices and services it wants events
 *          from and which devices it wants to control. This allows the application to 
 *          guide the user on what device options the module supports.
 * 
 *          The user adds a device to the network providing information about the device
 *          and how the user wants to use it.
 * 
 *          All app modules implement the following functions according to its needs:
 * 
 *          - addActuatorToControl
 *          - addSensorToListenTo(node)
 *          - getModuleRequiredSystemServices()
 *          - getModuleSupportedActuatorDeviceClasses()
 *          - getModuleSupportedSensorDeviceClasses()
 * 
 *          Each module has an associated json file with information about the app and 
 *          how it can be configured. The app serves up a web config page showing these
 *          parameters to the user so they can be managed.
 * 
 * @details And yet one more thought
 * 
 *          All of the module metadata is stored in an accompanying json file that can be 
 *          parsed by the application and used to guide a user through device selection
 *          and pairing, configuring behaviors of the module, and more. 
 * 
 *          The user interface may be a local web config page or a mobile app. The module
 *          json file is used to dynamically populate the UI components.
 *          
 * @details This module only has knowledge of the devices it can control and the devices
 *          and system services that it wants to receive events from.
 */

import chalk from 'chalk'
import fs from 'fs'



let moduleJsonObject

/*        
const switchCCApi = node.commandClasses['Binary Switch']
if (switchCCApi.isSupported()) {
    console.log(`Node ${node.id} is a switch!`);
    lightSwitch = switchCCApi
}
*/



const outdoorLightSwitch = {

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
            } catch (err) {
                console.log(chalk.greenBright("Module(OLS) - Error parsing JSON string:", err))
            }
        })
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
                    if(param.value === currentTime) {
                        console.log(chalk.greenBright("Module(OLS) - start time 1 matches current time"))
                    }
                    break;
                case "Stop time 1":
                    if(param.value === currentTime) {
                        console.log(chalk.greenBright("Module(OLS) - stop time 1 matches current time"))
                    }
                    break;
                case "Start time 2":
                    if(param.value === currentTime) {
                        console.log(chalk.greenBright("Module(OLS) - start time 2 matches current time"))
                    }
                    break;
                case "Stop time 2":
                    if(param.value === currentTime) {
                        console.log(chalk.greenBright("Module(OLS) - stop time 2 matches current time"))
                    }
                    break;
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
     processValueUpdatedEvent: function(driver, nodeId, args) {
        console.log(chalk.greenBright("Module(OLS) - VALUE_UPDATED event received from node: " + nodeId))
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
    processValueNotificationEvent: function(driver, nodeId, args) {
        console.log(chalk.greenBright("Module(OLS) - VALUE_NOTIFICATION event received from node: " + nodeId))
    }
}

export default outdoorLightSwitch


//{ "nodeId" : "None", "deviceClass" : "None", "userName" : "None", "userDescription" : "None"}
//{ "nodeId" : "None", "deviceClass" : "None", "userName" : "None", "userDescription" : "None"}

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

