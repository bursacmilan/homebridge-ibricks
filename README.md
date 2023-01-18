
# Homebridge iBricks Plugin

This is a plugin to integrate iBricks Cello Devices into Homebridge.

## Setup
1. Install Homebridge
2. Install this plugin using npm install: `npm i homebridge-ibricks-plugin`
3. Add configuration in Homebridge for this plugin (see "Configuration" below)
4. Restart Homebridge. This plugin will initially send a UDP Request to the Broadcast IP. All Cellos, which are in the same network, will respond with their IP and Mac-Address. 
After that, each Cello will send his hardware information to the plugin. This takes a few minutes. I recommend to wait at least 30 minutes after the first start of Homebridge with this plugin.
Each cello with his hardware information will be saved on the dist. The plugin will after the first initialization know all Cellos and you don't need to wait for the initialization anymore.
5. Restart Homebridge again. Now the plugin will create all accessories for the Cellos. You can now use the Cellos in Homebridge.

The Plugin can not ask the Cellos for their current state. If you want to initialize the current state of the Cellos, you have to set "Restart Cellos" in the config to true.
This will restart all Cellos and they will send their current state to the plugin. After that, don't forget to set "Restart Cellos" to false again. Otherwise the Cellos will restart every time you restart Homebridge.

Every change of the state of a Cello will be saved on the disk. If you restart Homebridge, the plugin will set the state in Homebridge to the last saved state.

---

## Exposed Accessories
The plugin will expose the following accessories:
- Switches (Relays) for the Cellos
- Dimmers for the Cellos
- Thermostats for the Cellos
- Temperature sensors for the Cellos
- Window covering with lamella tilt angle for the Cellos

Some Cellos have more than one relay, shutter or thermostat. This information is read from the Cellos. The plugin will create one accessory for each relay, shutter or thermostat.
The devices will be named like this:
- `<Cello-Description> - Left` (Channel 2)
- `<Cello-Description> - Right` (Channel 1)

If you want to disable the left side of the Cello (for example the left relay) so you have to use the channel '2'. For the right side use the channel '1'.

---
## Configuration
### Server IP Address
This is the IP Address of the Server, where Homebridge is running. This is needed to send the UDP Request to the Cellos.

### Server MAC Address
This is the MAC Address of the Server, where Homebridge is running. This is needed to send the UDP Request to the Cellos.

### Server Broadcast Address
This is the Broadcast Address of the Server, where Homebridge is running. This is needed to send the UDP Request to the Cellos.

### Disable Lamella
If you don't want to use the lamella, you can disable it here. Enter the Mac-Address of the Cello.

### Reboot
If true, the plugin will reboot all Cellos after the start of Homebridge.

### Director Target Heating Cooling State
The thermostats in homebridge requires to handle the heating cooling state. Cellos doesn't support this. Here you can select what your default heating cooling state should be and what should be displayed in Homebridge. This setting has no effect on the functionality.

### Ignore devices
If you want to ignore some devices, you can enter their mac addresses, channel and type here. The plugin will ignore these devices and will not create accessories for them.
You can disable the following types:
- Relay => Relay / Switch
- Shutter => Window covering
- Director => Thermostat
- Meteo => Temperature sensor

---

## Development
### Install development dependencies
```
npm install
```

### Build plugin
```
npm run build
```

### Link to local Homebridge installation

Run this command so your global install of Homebridge can discover the plugin in your development environment:

```
npm link
```

### Versioning

This plugin uses [SemVer](http://semver.org/) for versioning. The version has the following format: `major.minor.patch`:

1. **MAJOR** Breaking changes
2. **MINOR** New functionality in a backwards compatible manner
3. **PATCH** Backwards compatible bug fixes

You can use the `npm version` command to help you with this:

```bash
# major update / breaking changes
npm version major

# minor update / new features
npm version update

# patch / bugfixes
npm version patch
```

### Publish Package
```
npm publish
```

#### Publishing Beta Versions
```bash
# create a new pre-release version (eg. 2.1.0-beta.1)
npm version prepatch --preid beta

# publish to @beta
npm publish --tag=beta
```

You can then install the beta version using @beta to the install command:
```
sudo npm install -g homebridge-example-plugin@beta
```


