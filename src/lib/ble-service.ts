/**
 * BlueMesh BLE Service Layer
 * 
 * Handles all Bluetooth Low Energy communication using @capacitor-community/bluetooth-le.
 * Provides a clean API for scanning, connecting, and exchanging messages.
 * 
 * Architecture:
 * - BLE Peripheral mode: advertises a custom GATT service
 * - BLE Central mode: scans for and connects to other BlueMesh devices
 * - Messages are sent via BLE characteristics (write/notify)
 */

import { BleClient, BleDevice, ScanResult, numberToUUID } from '@capacitor-community/bluetooth-le';

// Custom BlueMesh BLE Service UUID
const BLUEMESH_SERVICE_UUID = '0000beef-0000-1000-8000-00805f9b34fb';
// Characteristic for sending/receiving messages
const MESSAGE_CHAR_UUID = '0000beef-0001-1000-8000-00805f9b34fb';
// Characteristic for exchanging user IDs
const IDENTITY_CHAR_UUID = '0000beef-0002-1000-8000-00805f9b34fb';

export type BleConnectionState = 
  | 'idle'           // Not doing anything
  | 'initializing'   // Setting up BLE
  | 'scanning'       // Scanning for devices
  | 'connecting'     // Connecting to a device
  | 'connected'      // Connected and ready
  | 'disconnected'   // Was connected, now disconnected
  | 'error'          // Error state
  | 'unsupported';   // BLE not supported

export interface BleDeviceInfo {
  device: BleDevice;
  rssi: number;
  name: string;
  state: 'found' | 'connecting' | 'connected' | 'error';
  userId?: string; // Remote user's BlueMesh ID
}

export interface BleMessage {
  id: string;
  senderId: string;
  text: string;
  timestamp: number;
  delivered: boolean;
}

export type BleEventCallback = {
  onStateChange: (state: BleConnectionState, error?: string) => void;
  onDeviceFound: (device: BleDeviceInfo) => void;
  onDeviceDisconnected: (deviceId: string) => void;
  onMessageReceived: (message: BleMessage) => void;
  onMessageDelivered: (messageId: string) => void;
  onLog: (entry: LogEntry) => void;
};

export interface LogEntry {
  timestamp: Date;
  level: 'info' | 'warn' | 'error';
  message: string;
}

class BlueMeshBleService {
  private state: BleConnectionState = 'idle';
  private callbacks: Partial<BleEventCallback> = {};
  private connectedDevices: Map<string, BleDeviceInfo> = new Map();
  private foundDevices: Map<string, BleDeviceInfo> = new Map();
  private logs: LogEntry[] = [];
  private isInitialized = false;
  private userId = '';

  /**
   * Register event callbacks
   */
  setCallbacks(callbacks: Partial<BleEventCallback>) {
    this.callbacks = callbacks;
  }

  setUserId(id: string) {
    this.userId = id;
  }

  getState(): BleConnectionState {
    return this.state;
  }

  getLogs(): LogEntry[] {
    return [...this.logs];
  }

  getFoundDevices(): BleDeviceInfo[] {
    return Array.from(this.foundDevices.values());
  }

  getConnectedDevices(): BleDeviceInfo[] {
    return Array.from(this.connectedDevices.values());
  }

  private setState(state: BleConnectionState, error?: string) {
    this.state = state;
    this.callbacks.onStateChange?.(state, error);
  }

  private log(level: 'info' | 'warn' | 'error', message: string) {
    const entry: LogEntry = { timestamp: new Date(), level, message };
    this.logs.push(entry);
    if (this.logs.length > 200) this.logs = this.logs.slice(-100);
    this.callbacks.onLog?.(entry);
    console.log(`[BLE ${level}]`, message);
  }

  /**
   * Check if BLE is supported in current environment
   */
  async checkSupport(): Promise<{ supported: boolean; reason?: string }> {
    // Check if running in Capacitor native context
    const isNative = typeof (window as any).Capacitor !== 'undefined';
    
    if (isNative) {
      return { supported: true };
    }

    // In browser, check Web Bluetooth API
    if (!navigator.bluetooth) {
      return { 
        supported: false, 
        reason: 'Web Bluetooth API ei ole tuettu tässä selaimessa. Käytä Chrome/Edge Androidilla tai asenna natiivisovellus.' 
      };
    }

    try {
      const available = await navigator.bluetooth.getAvailability();
      if (!available) {
        return { 
          supported: false, 
          reason: 'Bluetooth ei ole käytettävissä tässä laitteessa. Varmista, että Bluetooth on päällä.' 
        };
      }
    } catch {
      // getAvailability not supported, assume it might work
    }

    return { 
      supported: true,
      reason: 'Selainympäristössä BLE-toiminnot ovat rajoitettuja. Natiivisovellus (APK) tarjoaa täyden mesh-tuen.'
    };
  }

  /**
   * Initialize BLE - request permissions and set up
   */
  async initialize(): Promise<boolean> {
    if (this.isInitialized) return true;

    try {
      this.setState('initializing');
      this.log('info', 'Alustetaan Bluetooth LE...');

      await BleClient.initialize({ androidNeverForLocation: true });
      
      const enabled = await BleClient.isEnabled();
      if (!enabled) {
        this.log('error', 'Bluetooth ei ole päällä');
        this.setState('error', 'Bluetooth ei ole päällä. Ota Bluetooth käyttöön laitteen asetuksista.');
        return false;
      }

      this.isInitialized = true;
      this.log('info', 'Bluetooth LE alustettu onnistuneesti');
      this.setState('idle');
      return true;
    } catch (error: any) {
      const msg = error?.message || 'Tuntematon virhe';
      this.log('error', `Alustus epäonnistui: ${msg}`);
      this.setState('error', `Bluetooth-alustus epäonnistui: ${msg}`);
      return false;
    }
  }

  /**
   * Start scanning for nearby BlueMesh devices
   */
  async startScan(durationMs = 10000): Promise<void> {
    if (!this.isInitialized) {
      const ok = await this.initialize();
      if (!ok) return;
    }

    try {
      this.foundDevices.clear();
      this.setState('scanning');
      this.log('info', 'Skannataan lähellä olevia laitteita...');

      await BleClient.requestLEScan(
        { 
          services: [BLUEMESH_SERVICE_UUID],
          allowDuplicates: false 
        },
        (result: ScanResult) => {
          this.handleScanResult(result);
        }
      );

      // Auto-stop scan after duration
      setTimeout(async () => {
        await this.stopScan();
      }, durationMs);

    } catch (error: any) {
      const msg = error?.message || 'Tuntematon virhe';
      this.log('error', `Skannaus epäonnistui: ${msg}`);
      
      // If scan fails in browser, try Web Bluetooth requestDevice as fallback
      if (!this.isNative()) {
        this.log('info', 'Kokeillaan Web Bluetooth -varavaihtoehtoa...');
        await this.webBluetoothFallback();
      } else {
        this.setState('error', `Laitteiden etsintä epäonnistui: ${msg}`);
      }
    }
  }

  /**
   * Fallback for browser: use requestDevice picker
   */
  private async webBluetoothFallback(): Promise<void> {
    try {
      const device = await navigator.bluetooth.requestDevice({
        filters: [{ services: [BLUEMESH_SERVICE_UUID] }],
        optionalServices: [BLUEMESH_SERVICE_UUID]
      });

      if (device) {
        const info: BleDeviceInfo = {
          device: { deviceId: device.id, name: device.name },
          rssi: -50,
          name: device.name || 'BlueMesh-laite',
          state: 'found'
        };
        this.foundDevices.set(device.id, info);
        this.callbacks.onDeviceFound?.(info);
        this.log('info', `Laite löydetty: ${info.name}`);
      }
      this.setState('idle');
    } catch (error: any) {
      if (error.name === 'NotFoundError') {
        this.log('warn', 'Läheltä ei löytynyt BlueMesh-laitteita');
        this.setState('idle');
      } else {
        this.log('error', `Web Bluetooth -virhe: ${error.message}`);
        this.setState('error', 'Laitteiden etsintä epäonnistui.');
      }
    }
  }

  /**
   * Stop scanning
   */
  async stopScan(): Promise<void> {
    try {
      await BleClient.stopLEScan();
      this.log('info', `Skannaus päättyi. Löytyi ${this.foundDevices.size} laitetta.`);
      if (this.state === 'scanning') {
        this.setState('idle');
      }
    } catch {
      // Ignore stop errors
    }
  }

  /**
   * Handle a scan result
   */
  private handleScanResult(result: ScanResult) {
    const deviceId = result.device.deviceId;
    const name = result.device.name || result.localName || `BlueMesh-${deviceId.slice(-4)}`;
    const rssi = result.rssi ?? -80;

    const info: BleDeviceInfo = {
      device: result.device,
      rssi,
      name,
      state: 'found'
    };

    this.foundDevices.set(deviceId, info);
    this.callbacks.onDeviceFound?.(info);
    this.log('info', `Laite löydetty: ${name} (RSSI: ${rssi})`);
  }

  /**
   * Connect to a specific device
   */
  async connect(deviceId: string): Promise<boolean> {
    const deviceInfo = this.foundDevices.get(deviceId);
    if (!deviceInfo) {
      this.log('error', 'Laitetta ei löydy');
      return false;
    }

    try {
      this.setState('connecting');
      deviceInfo.state = 'connecting';
      this.log('info', `Yhdistetään laitteeseen ${deviceInfo.name}...`);

      // Connect to the device
      await BleClient.connect(deviceId, (disconnectedDeviceId) => {
        this.handleDisconnect(disconnectedDeviceId);
      });

      // Discover services
      const services = await BleClient.getServices(deviceId);
      this.log('info', `Palvelut löydetty: ${services.length} kpl`);

      // Check for BlueMesh service
      const hasBlueMeshService = services.some(s => 
        s.uuid.toLowerCase() === BLUEMESH_SERVICE_UUID.toLowerCase()
      );

      if (!hasBlueMeshService) {
        this.log('warn', 'Laite ei tarjoa BlueMesh-palvelua');
        await BleClient.disconnect(deviceId);
        deviceInfo.state = 'error';
        this.setState('error', 'Laite ei ole BlueMesh-yhteensopiva.');
        return false;
      }

      // Start notifications for incoming messages
      await BleClient.startNotifications(
        deviceId,
        BLUEMESH_SERVICE_UUID,
        MESSAGE_CHAR_UUID,
        (value) => {
          this.handleIncomingData(deviceId, value);
        }
      );

      // Exchange identity - send our userId
      const encoder = new TextEncoder();
      await BleClient.write(
        deviceId,
        BLUEMESH_SERVICE_UUID,
        IDENTITY_CHAR_UUID,
        encoder.encode(this.userId)
      );

      // Read remote identity
      try {
        const identityData = await BleClient.read(
          deviceId,
          BLUEMESH_SERVICE_UUID,
          IDENTITY_CHAR_UUID
        );
        const decoder = new TextDecoder();
        deviceInfo.userId = decoder.decode(identityData);
        this.log('info', `Vastapuolen tunnus: ${deviceInfo.userId}`);
      } catch {
        deviceInfo.userId = `device-${deviceId.slice(-4)}`;
      }

      deviceInfo.state = 'connected';
      this.connectedDevices.set(deviceId, deviceInfo);
      this.setState('connected');
      this.log('info', `Yhdistetty laitteeseen ${deviceInfo.name}`);
      return true;

    } catch (error: any) {
      const msg = error?.message || 'Tuntematon virhe';
      this.log('error', `Yhdistäminen epäonnistui: ${msg}`);
      deviceInfo.state = 'error';
      this.setState('error', `Yhdistäminen epäonnistui: ${msg}`);
      return false;
    }
  }

  /**
   * Send a message to all connected devices
   */
  async sendMessage(text: string, messageId: string): Promise<boolean> {
    if (this.connectedDevices.size === 0) {
      this.log('warn', 'Ei yhdistettyjä laitteita');
      return false;
    }

    const payload = JSON.stringify({
      id: messageId,
      senderId: this.userId,
      text,
      timestamp: Date.now()
    });

    const encoder = new TextEncoder();
    const data = encoder.encode(payload);
    let anySuccess = false;

    for (const [deviceId, deviceInfo] of this.connectedDevices) {
      try {
        await BleClient.write(
          deviceId,
          BLUEMESH_SERVICE_UUID,
          MESSAGE_CHAR_UUID,
          data
        );
        this.log('info', `Viesti lähetetty → ${deviceInfo.name}`);
        this.callbacks.onMessageDelivered?.(messageId);
        anySuccess = true;
      } catch (error: any) {
        this.log('error', `Lähetys epäonnistui (${deviceInfo.name}): ${error.message}`);
      }
    }

    return anySuccess;
  }

  /**
   * Handle incoming BLE data
   */
  private handleIncomingData(deviceId: string, value: DataView) {
    try {
      const decoder = new TextDecoder();
      const raw = decoder.decode(value.buffer);
      const parsed = JSON.parse(raw);
      
      const message: BleMessage = {
        id: parsed.id || `msg-${Date.now()}`,
        senderId: parsed.senderId || `device-${deviceId.slice(-4)}`,
        text: parsed.text || raw,
        timestamp: parsed.timestamp || Date.now(),
        delivered: true
      };

      this.log('info', `Viesti vastaanotettu ← ${message.senderId}`);
      this.callbacks.onMessageReceived?.(message);
    } catch {
      // If not JSON, treat as plain text
      const decoder = new TextDecoder();
      const text = decoder.decode(value.buffer);
      const message: BleMessage = {
        id: `msg-${Date.now()}`,
        senderId: `device-${deviceId.slice(-4)}`,
        text,
        timestamp: Date.now(),
        delivered: true
      };
      this.callbacks.onMessageReceived?.(message);
    }
  }

  /**
   * Handle device disconnection
   */
  private handleDisconnect(deviceId: string) {
    const device = this.connectedDevices.get(deviceId);
    this.connectedDevices.delete(deviceId);
    this.log('warn', `Yhteys katkesi: ${device?.name || deviceId}`);
    this.callbacks.onDeviceDisconnected?.(deviceId);
    
    if (this.connectedDevices.size === 0) {
      this.setState('disconnected');
    }
  }

  /**
   * Disconnect from a specific device
   */
  async disconnect(deviceId: string): Promise<void> {
    try {
      await BleClient.stopNotifications(deviceId, BLUEMESH_SERVICE_UUID, MESSAGE_CHAR_UUID);
      await BleClient.disconnect(deviceId);
      this.connectedDevices.delete(deviceId);
      this.log('info', `Yhteys katkaistu`);
      if (this.connectedDevices.size === 0) {
        this.setState('idle');
      }
    } catch (error: any) {
      this.log('error', `Yhteyden katkaisu epäonnistui: ${error.message}`);
    }
  }

  /**
   * Disconnect all devices
   */
  async disconnectAll(): Promise<void> {
    for (const deviceId of this.connectedDevices.keys()) {
      await this.disconnect(deviceId);
    }
    this.setState('idle');
  }

  /**
   * Check if running in native Capacitor context
   */
  private isNative(): boolean {
    return typeof (window as any).Capacitor !== 'undefined';
  }

  /**
   * Get diagnostic info for debug panel
   */
  getDiagnostics() {
    return {
      bleSupported: !!navigator.bluetooth,
      isNative: this.isNative(),
      state: this.state,
      connectedCount: this.connectedDevices.size,
      foundCount: this.foundDevices.size,
      logsCount: this.logs.length,
      platform: this.isNative() ? 'Capacitor (Native)' : 'Web Browser',
      api: this.isNative() ? '@capacitor-community/bluetooth-le' : 'Web Bluetooth API'
    };
  }
}

// Singleton instance
export const bleService = new BlueMeshBleService();
