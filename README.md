# Introduction

Repository for a Z-Wave project for controlling various devices around the home. This is a NodeJS application that I run on a Raspberry Pi with Raspbian (Debian version Buster).

A USB Zwave controller hub from [Nortek](https://www.nortekcontrol.com/products/2gig/husbzb-1-gocontrol-quickstick-combo/) is used with the Raspberry Pi.

### Outdoor Christmas Lights Use Case

Application allows for a user to configure 2 finite periods during a 24 hour period when a collection of Z-Wave power outlet switches will be turned on.

Switch device used is the [Zwave Plus Smart Plug](https://minoston.com/product/z-wave-plus-smart-plug-outdoor-on-off-outlet-switch-mp22z/) by Minoston

# Usage

HTML requests are supported to perform the following actions:

- INCLUSION - add a device to the network
- EXCLUSION - remove a device from the network
- ISFAILEDNODE - query if a node on the network is a failed node
- REMOVEFAILEDNODE - remove a failed node from the network

- SETCURRENTTIME - Set the current time and date. (really a HTML request?)
- SETSTARTTIME1 - Set the first on time of the day
- SETSTOPTIME1 - Set the first off time of the day
- SETSTARTTIME1 - Set the first on time of the day
- SETSTOPTIME1 - Set the first off time of the day

# Project Setup

```sh
git clone <repo url>
cd <repo>
npm install
```

The Node modules are not included in the git repository so we must run npm install to get them.