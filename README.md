# Introduction

This repository contains all of the source code and documentation for a home/building automation project employing ZWave devices and a network controller implemented on a Raspberry Pi 4.

This project consists of a Nodejs application running on any flavor of Linux targetted for the RPi. For my development I used the default Raspbian OS based on Debian Buster.

Application summary:

- A Nodejs server application with a Restful API that is exposed on port 3001.
- Built on top of the [zwavejs](https://zwave-js.github.io/node-zwave-js/#/README) library.
- Architecture based on idea of application modules that implement a usecase and expose metadata that can be managed dynamically.
- A local React app that serves up pages allowing a user to configure the system and behavior of the application modules.
- Written entirely in Javascript.

## Equipment Used for Development and Testing

- Raspberry Pi 4
- uSD card with headless Raspbian (Debian Buster)
- USB Zwave controller hub from [Nortek](https://www.nortekcontrol.com/products/2gig/husbzb-1-gocontrol-quickstick-combo/)

The application can run on any platform that supports Nodejs, but the serial port mapping in app.js will have to be changed.

## Getting Started

- Prepare uSD card and install in rPI
- Start up rPI with Nortek controller and ssh in
- Sync the system time with the network (add a RTC someday)
- Navigate to preferred working folder and clone this repository
- run the following commands from the shell

```sh
git clone <repo url>
cd <repo>
npm install
node app.js
```

The Node modules are not included in the git repository so we must run npm install after cloning to build them. The package.json file includes the list of packages that will be installed.

## References

The following links are useful for development:

- [ZWaveJS Documentation](https://zwave-js.github.io/node-zwave-js/#/README)
- [Vesternet - Understanding ZWave Networks](https://www.vesternet.com/pages/understanding-z-wave-networks-nodes-devices)

# Usage

Once the server is running the user can manage the network using a local React app on port 3002. This React app interfaces with the server through a custom Restful API listening on port 3001.

## Restful API

As of the initial writing of this section the React app does not exist. The user must make API requests manually through tools such as Postman.

The following requests are supported:

- <span style="color:cyan">/network-management/devices/start-inclusion</span> 

    Starts the Inclusion process for adding devices to the network. It will run indefinately and has only been tested adding devices, not secondary controllers.

- <span style="color:cyan">/network-management/devices/stop-inclusion</span> 

    Stops a running Inclusion process.

- <span style="color:cyan">/network-management/devices/start-exclusion</span> 

    Starts the Exclusion process to remove a device from the network. It will run indefinately and has only been tested adding devices, not secondary controllers.

- <span style="color:cyan">/network-management/devices/stop-exclusion</span> 

    Stops a running Exclusion process. 

- <span style="color:cyan">/network-management/devices/audit-devices</span> 

    Returns basic information about the devices connected to the network.

- <span style="color:cyan">/network-management/devices/remove-failed-device?nodeId=2</span> 

    Removes a device (node) with a status of 'dead'. The request requires a nodeId parameter with the number assigned to the device to be removed. Leaves the device alone if it is not a failed node.

- <span style="color:cyan">/network-management/admin/apply-module-config-changes?module=OutdoorLightSwitch</span> 

    Each application module has a json file containing metadata for the module. This file can be editing dynamically using either a file editor or the React app when it is available. This request causes the module to refresh its local copy of the metadata to start using the changes.

    The user must specify a module name in the 'module' parameter.

- <span style="color:cyan">/network-management/device/set-name?nodeId=9&name=Front Lights</span> 

    Assign a user name to a device. User must set a nodeID and name parameter.

- <span style="color:cyan">/network-management/tests/set-light-switch?newState=off</span> 

    This was for testing purposes only and will be removed.

# Architecture and Design

The server consists of an app.js file as the main entry point for the application and a collection of application modules, each consisting of a javascript implementation file and a json file containing application metadata.

The app.js file initializes the [zwavejs](https://zwave-js.github.io/node-zwave-js/#/README) library and registers the event handler functions. It also runs a timer in the background that sends current time signals once a minute to each of the modules. At the time of writing this, the app.js file also includes the API functions. ToDo: move the API into its own file.

Application modules implement logic for specific home/bldg automation use cases, and each module implements a function for specific zwavejs events captured in the app.js file. The list of functions that each module must implement is listed below.

- <span style="color:cyan">applyModuleConfigChanges()</span> 
- <span style="color:cyan">initModule()</span>
- <span style="color:cyan">processDeviceAddedEvent(node, result)</span>
- <span style="color:cyan">processDeviceRemovedEvent(node, replaced)</span>
- <span style="color:cyan">processSystemTimeEvent(driver, currentTime)</span>
- <span style="color:cyan">processValueUpdatedEvent(driver, node, args)</span>
- <span style="color:cyan">processValueNotificationEvent(driver, node, args)</span>

The implementation of these functions is module specific, and in many cases, the module may not care or have anything to do for one or more of these functions. Minimally, the developer must implement a blank function for the don't cares.

When adding a new module to the project:

- include the javascript and json files in the 'app_modules' folder.
- Import the module into the app.js file.
- Add all of the mandatory function calls into the appropriate event handlers

## Outdoor Lights Use Case

This is the test use case I did during development. The application allows for a user to configure 2 finite periods of time during a 24 hour period when a collection of Z-Wave power outlet switches will be turned on.

Switch device used is the [Zwave Plus Smart Plug](https://minoston.com/product/z-wave-plus-smart-plug-outdoor-on-off-outlet-switch-mp22z/) by Minoston. The system time event is used to trigger the module. The following parameters can be configured by the user through the API.

- Start time 1 - Set the first on time of the day
- Stop time 1 - Set the first off time of the day
- Start time 2 - Set the first on time of the day
- Stop time 2 - Set the first off time of the day
- Normal State - The idle state when no on events occur (may get rid of this)