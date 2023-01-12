export class NetworkInfo {
  public ipAddress: string;
  public macAddress: string;
  public broadcastAddress: string;

  constructor(ipAddress: string, macAddress: string, broadcastAddress: string) {
    this.ipAddress = ipAddress;
    this.macAddress = macAddress;
    this.broadcastAddress = broadcastAddress;
  }
}