import * as fs from 'fs';
import {HardwareInfo} from './hardware-info';
import path from 'path';
import {LoggerService} from '../services/logger-service';

export class Cello {
  public static basePath = '';

  // Cello info
  public description: string;
  public ip: string;
  public mac: string;
  public port = 3178;
  public filePath: string;
  public hardwareInfo?: HardwareInfo;

  // Devices info
  public relayLeft = false;
  public relayRight = false;

  public dimmerLeft = 0;
  public dimmerRight = 0;

  public shutterLeft = 0;
  public shutterRight = 0;

  public lamellaLeft = 0;
  public lamellaRight = 0;

  public currentTemperatureLeft = 10;
  public currentTemperatureRight = 10;
  public targetTemperatureLeft = 0;
  public targetTemperatureRight = 0;

  constructor(description: string, ip: string, mac: string) {
    this.description = description;
    this.ip = ip;
    this.mac = mac;
    this.filePath = Cello.getFilePath(this.mac);
  }

  public static createCelloAndSafeOnFileSystem(description: string, ip: string, mac: string): Cello {
    let cello = Cello.getCelloFromFile(this.getFilePath(mac));

    if (cello !== undefined) {
      cello.ip = ip;
      cello.description = description;
    } else {
      cello = new Cello(description, ip, mac);
    }

    cello.saveToFile();
    return cello;
  }

  public static getFilePath(mac: string): string {
    return this.basePath + mac + '.json';
  }

  public static getCelloFromFile(filePath: string): Cello | undefined {
    if (!fs.existsSync(filePath)) {
      return undefined;
    }

    const fileContent = fs.readFileSync(filePath);
    const jsonObject = JSON.parse(fileContent.toString()) as Cello;

    const cello = new Cello(jsonObject.description, jsonObject.ip, jsonObject.mac);

    cello.port = jsonObject.port;
    cello.relayLeft = jsonObject.relayLeft ?? false;
    cello.relayRight = jsonObject.relayRight ?? false;
    cello.dimmerLeft = jsonObject.dimmerLeft ?? 0;
    cello.dimmerRight = jsonObject.dimmerRight ?? 0;
    cello.shutterRight = jsonObject.shutterRight ?? 0;
    cello.shutterLeft = jsonObject.shutterLeft ?? 0;
    cello.lamellaLeft = jsonObject.lamellaLeft ?? 0;
    cello.lamellaRight = jsonObject.lamellaRight ?? 0;
    cello.currentTemperatureLeft = jsonObject.currentTemperatureLeft ?? 0;
    cello.currentTemperatureRight = jsonObject.currentTemperatureRight ?? 0;
    cello.targetTemperatureLeft = jsonObject.targetTemperatureLeft ?? 0;
    cello.targetTemperatureRight = jsonObject.targetTemperatureRight ?? 0;

    if (jsonObject.hardwareInfo !== undefined) {
      cello.hardwareInfo = new HardwareInfo(jsonObject.hardwareInfo.R, jsonObject.hardwareInfo.S,
        jsonObject.hardwareInfo.H, jsonObject.hardwareInfo.D);
    }

    return cello;
  }

  public static getAllCellosFromFiles(loggerService: LoggerService): Cello[] {
    loggerService.logDebug('GetAllCellosFromFiles', 'GetAllCellosFromFiles');

    const cellos: Cello[] = [];
    if (!fs.existsSync(this.basePath)) {
      loggerService.logDebug('GetAllCellosFromFiles', `basePath ${Cello.basePath} does not exist`);
      return cellos;
    }

    const files = fs.readdirSync(this.basePath);
    const jsonFiles = files.filter(file => path.extname(file) === '.json');

    loggerService.logDebug('GetAllCellosFromFiles', `Total files: ${files.length}`);

    for (const jsonFile of jsonFiles) {
      loggerService.logDebug('GetAllCellosFromFiles', `${jsonFile}`);
      const cello = Cello.getCelloFromFile(path.join(this.basePath, jsonFile));
      if (cello === undefined) {
        continue;
      }

      cellos.push(cello);
    }

    return cellos;
  }

  public saveToFile(): void {
    if (!fs.existsSync(Cello.basePath)) {
      return;
    }

    if (fs.existsSync(this.filePath)) {
      fs.unlinkSync(this.filePath);
    }

    fs.writeFileSync(this.filePath, JSON.stringify(this));
  }
}