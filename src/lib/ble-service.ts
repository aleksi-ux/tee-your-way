/**
 * BlueMesh BLE Service Layer
 * 
 * Uses @capgo/capacitor-bluetooth-low-energy which supports both
 * central mode (scanning/connecting) AND peripheral mode (advertising/GATT server).
 * This enables two devices to discover each other and exchange messages via BLE.
 */

import { BluetoothLowEnergy } from '@capgo/capacitor-bluetooth-low-energy';
import { createPackets, shouldRelay, getRelayDelay, reassembleChunks } from './mesh';
import type { MeshPacket } from '@/types/mesh';

// Custom BlueMesh BLE Service UUID
const BLUEMESH_SERVICE_UUID = '0000beef-0000-1000-8000-00805f9b34fb';
// Characteristic for sending/receiving messages
const MESSAGE_CHAR_UUID = '0000beef-0001-1000-8000-00805f9b34fb';
// Characteristic for exchanging user IDs
const IDENTITY_CHAR_UUID = '0000beef-0002-1000-8000-00805f9b34fb';

export type BleConnectionState = 
  | 'idle'
  | 'initializing'
  | 'scanning'
  | 'connecting'
  | 'connected'
  | 'disconnected'
  | 'error'
  | 'unsupported';

export interface BleDeviceInfo {
  device: { deviceId: string; name?: string };
  rssi: number;
  name: string;
  state: 'found' | 'connecting' | 'connected' | 'error';
  userId?: string;
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
  private _callbacks: Partial<BleEventCallback> = {};
  private connectedDevices: Map<string, BleDeviceInfo> = new Map();
  private foundDevices: Map<string, BleDeviceInfo> = new Map();
  private logs: LogEntry[] = [];
  private isInitialized = false;
  private userId = '';
  private isAdvertising = false;
  private autoReconnectEnabled = true;
  private reconnectTimers: Map<string, ReturnType<typeof setTimeout>> = new Map();
  private reconnectAttempts: Map<string, number> = new Map();
  private static readonly MAX_RECONNECT_ATTEMPTS = 5;
  private static readonly RECONNECT_BASE_DELAY_MS = 2000;
  private pendingChunks: Map<string, MeshPacket[]> = new Map();

  setCallbacks(callbacks: Partial<BleEventCallback>) {
    this._callbacks = callbacks;
  }

  getCallbacks(): Partial<BleEventCallback> {
    return this._callbacks;
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

  private setState(newState: BleConnectionState, error?: string) {
    this.state = newState;
    this._callbacks.onStateChange?.(newState, error);
  }

  private log(level: 'info' | 'warn' | 'error', message: string) {
    const entry: LogEntry = { timestamp: new Date(), level, message };
    this.logs.push(entry);
    if (this.logs.length > 200) this.logs = this.logs.slice(-100);
    this._callbacks.onLog?.(entry);
    console.log(`[BLE ${level}]`, message);
  }

  /** Check if BLE is supported */
  async checkSupport(): Promise<{ supported: boolean; reason?: string }> {
    if (this.isNative()) {
      return { supported: true };
    }

    const nav = navigator as any;
    if (!nav.bluetooth) {
      return {
        supported: false,
        reason: 'Web Bluetooth API ei ole tuettu tässä selaimessa. Käytä Chrome/Edge Androidilla tai asenna natiivisovellus.'
      };
    }

    try {
      const available = await nav.bluetooth.getAvailability();
      if (!available) {
        return {
          supported: false,
          reason: 'Bluetooth ei ole käytettävissä. Varmista, että Bluetooth on päällä.'
        };
      }
    } catch {
      // getAvailability not always supported
    }

    return {
      supported: true,
      reason: 'Selainympäristössä BLE on rajoitettu. Natiivisovellus (APK) tarjoaa täyden mesh-tuen.'
    };
  }

  /** Initialize BLE */
  async initialize(): Promise<boolean> {
    if (this.isInitialized) return true;

    try {
      this.setState('initializing');
      this.log('info', 'Alustetaan Bluetooth LE...');

      await BluetoothLowEnergy.initialize();

      const { available } = await BluetoothLowEnergy.isAvailable();
      if (!available) {
        this.log('error', 'Bluetooth ei ole käytettävissä');
        this.setState('error', 'Bluetooth ei ole käytettävissä tässä laitteessa.');
        return false;
      }

      const { enabled } = await BluetoothLowEnergy.isEnabled();
      if (!enabled) {
        this.log('error', 'Bluetooth ei ole päällä');
        this.setState('error', 'Bluetooth ei ole päällä. Ota Bluetooth käyttöön laitteen asetuksista.');
        return false;
      }

      // Set up scan listener
      BluetoothLowEnergy.addListener('deviceScanned', (event: any) => {
        this.handleScanResult(event);
      });

      // Set up disconnect listener
      BluetoothLowEnergy.addListener('deviceDisconnected', (event: any) => {
        this.handleDisconnect(event.deviceId);
      });

      // Set up characteristic notification listener
      BluetoothLowEnergy.addListener('characteristicChanged', (event: any) => {
        if (event.characteristic === MESSAGE_CHAR_UUID) {
          this.handleIncomingData(event.deviceId, event.value);
        }
      });

      this.isInitialized = true;
      this.log('info', 'Bluetooth LE alustettu onnistuneesti');

      // Start advertising in native environment
      if (this.isNative()) {
        await this.startAdvertising();
      }

      this.setState('idle');
      return true;
    } catch (error: any) {
      const msg = error?.message || 'Tuntematon virhe';
      this.log('error', `Alustus epäonnistui: ${msg}`);
      this.setState('error', `Bluetooth-alustus epäonnistui: ${msg}`);
      return false;
    }
  }

  /** Start advertising BlueMesh service (peripheral mode) so other devices can discover us */
  async startAdvertising(): Promise<void> {
    if (!this.isNative()) {
      this.log('warn', 'Mainostusta ei tueta selainympäristössä');
      return;
    }

    if (this.isAdvertising) return;

    try {
      this.log('info', 'Käynnistetään BLE-mainostus (peripheral mode)...');

      await BluetoothLowEnergy.startAdvertising({
        name: this.userId ? `BlueMesh-${this.userId.slice(0, 8)}` : 'BlueMesh-node',
        services: [BLUEMESH_SERVICE_UUID],
      });

      this.isAdvertising = true;
      this.log('info', 'BLE-mainostus käynnissä – laite näkyy muille BlueMesh-solmuille');
    } catch (error: any) {
      this.log('error', 'Mainostus epäonnistui: ' + (error?.message || 'tuntematon virhe'));
    }
  }

  /** Stop advertising */
  async stopAdvertising(): Promise<void> {
    if (!this.isAdvertising) return;
    try {
      await BluetoothLowEnergy.stopAdvertising();
      this.isAdvertising = false;
      this.log('info', 'BLE-mainostus pysäytetty');
    } catch (error: any) {
      this.log('error', 'Mainostuksen pysäytys epäonnistui: ' + (error?.message || ''));
    }
  }

  /** Start scanning for BlueMesh devices */
  async startScan(durationMs = 10000): Promise<void> {
    if (!this.isInitialized) {
      const ok = await this.initialize();
      if (!ok) return;
    }

    try {
      this.foundDevices.clear();
      this.setState('scanning');
      this.log('info', 'Skannataan lähellä olevia laitteita...');

      await BluetoothLowEnergy.startScan({
        services: [BLUEMESH_SERVICE_UUID],
        timeout: durationMs,
      });

      // Auto-stop after timeout
      setTimeout(() => this.stopScan(), durationMs);
    } catch (error: any) {
      const msg = error?.message || 'Tuntematon virhe';
      this.log('error', `Skannaus epäonnistui: ${msg}`);

      if (!this.isNative()) {
        this.log('info', 'Kokeillaan Web Bluetooth -varavaihtoehtoa...');
        await this.webBluetoothFallback();
      } else {
        this.setState('error', `Laitteiden etsintä epäonnistui: ${msg}`);
      }
    }
  }

  /** Browser fallback using requestDevice picker */
  private async webBluetoothFallback(): Promise<void> {
    try {
      const nav = navigator as any;
      const device = await nav.bluetooth.requestDevice({
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
        this._callbacks.onDeviceFound?.(info);
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

  /** Stop scanning */
  async stopScan(): Promise<void> {
    try {
      await BluetoothLowEnergy.stopScan();
      this.log('info', `Skannaus päättyi. Löytyi ${this.foundDevices.size} laitetta.`);
      if (this.state === 'scanning') this.setState('idle');
    } catch {
      // ignore
    }
  }

  private handleScanResult(event: any) {
    const device = event.device || event;
    const deviceId = device.deviceId;
    if (!deviceId) return;

    const name = device.name || `BlueMesh-${deviceId.slice(-4)}`;
    const rssi = device.rssi ?? event.rssi ?? -80;

    const info: BleDeviceInfo = {
      device: { deviceId, name: device.name },
      rssi,
      name,
      state: 'found'
    };

    this.foundDevices.set(deviceId, info);
    this._callbacks.onDeviceFound?.(info);
    this.log('info', `Laite löydetty: ${name} (RSSI: ${rssi})`);
  }

  /** Connect to a device */
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

      await BluetoothLowEnergy.connect({ deviceId });

      // Discover services
      await BluetoothLowEnergy.discoverServices({ deviceId });
      const servicesResult = await BluetoothLowEnergy.getServices({ deviceId });
      const services = (servicesResult as any)?.services ?? [];
      this.log('info', `Palvelut löydetty: ${services.length} kpl`);

      const hasBlueMesh = services?.some((s: any) =>
        (s.id || s.uuid || '').toLowerCase() === BLUEMESH_SERVICE_UUID.toLowerCase()
      );

      if (!hasBlueMesh) {
        this.log('warn', 'Laite ei tarjoa BlueMesh-palvelua');
        await BluetoothLowEnergy.disconnect({ deviceId });
        deviceInfo.state = 'error';
        this.setState('error', 'Laite ei ole BlueMesh-yhteensopiva.');
        return false;
      }

      // Listen for incoming messages
      await BluetoothLowEnergy.startCharacteristicNotifications({
        deviceId,
        service: BLUEMESH_SERVICE_UUID,
        characteristic: MESSAGE_CHAR_UUID,
      });

      // Exchange identity – write our userId
      const encoder = new TextEncoder();
      const idBytes = Array.from(encoder.encode(this.userId));
      await BluetoothLowEnergy.writeCharacteristic({
        deviceId,
        service: BLUEMESH_SERVICE_UUID,
        characteristic: IDENTITY_CHAR_UUID,
        value: idBytes,
      });

      // Read remote identity
      try {
        const result = await BluetoothLowEnergy.readCharacteristic({
          deviceId,
          service: BLUEMESH_SERVICE_UUID,
          characteristic: IDENTITY_CHAR_UUID,
        });
        if (result.value) {
          const decoder = new TextDecoder();
          const bytes = new Uint8Array(result.value);
          deviceInfo.userId = decoder.decode(bytes);
          this.log('info', `Vastapuolen tunnus: ${deviceInfo.userId}`);
        }
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

  /** Send a message as mesh packets to all connected devices */
  async sendMessage(text: string, messageId: string): Promise<boolean> {
    if (this.connectedDevices.size === 0) {
      this.log('warn', 'Ei yhdistettyjä laitteita');
      return false;
    }

    const packets = createPackets(this.userId, text, false, 'public');
    this.log('info', `Luotu ${packets.length} mesh-pakettia (TTL=${packets[0]?.hopCount})`);

    let anySuccess = false;
    for (const packet of packets) {
      const ok = await this.broadcastPacket(packet);
      if (ok) anySuccess = true;
    }

    if (anySuccess) {
      this._callbacks.onMessageDelivered?.(messageId);
    }
    return anySuccess;
  }

  /** Broadcast a single MeshPacket to all connected peers */
  private async broadcastPacket(packet: MeshPacket, excludeDeviceId?: string): Promise<boolean> {
    const encoder = new TextEncoder();
    const data = Array.from(encoder.encode(JSON.stringify(packet)));
    let anySuccess = false;

    for (const [deviceId, deviceInfo] of this.connectedDevices) {
      if (deviceId === excludeDeviceId) continue;
      try {
        await BluetoothLowEnergy.writeCharacteristic({
          deviceId,
          service: BLUEMESH_SERVICE_UUID,
          characteristic: MESSAGE_CHAR_UUID,
          value: data,
        });
        anySuccess = true;
      } catch (error: any) {
        this.log('error', `Lähetys epäonnistui (${deviceInfo.name}): ${error.message}`);
      }
    }
    return anySuccess;
  }

  /** Handle incoming BLE data – parse as MeshPacket, relay if needed */
  private handleIncomingData(sourceDeviceId: string, value: any) {
    try {
      let raw: string;
      if (value instanceof ArrayBuffer || value instanceof DataView) {
        const decoder = new TextDecoder();
        raw = decoder.decode(value instanceof DataView ? value.buffer : value);
      } else if (Array.isArray(value)) {
        const decoder = new TextDecoder();
        raw = decoder.decode(new Uint8Array(value));
      } else {
        raw = String(value);
      }

      const parsed = JSON.parse(raw);

      // Check if this is a mesh packet (has uniqueId and hopCount)
      if (parsed.uniqueId && typeof parsed.hopCount === 'number') {
        this.handleMeshPacket(parsed as MeshPacket, sourceDeviceId);
      } else {
        // Legacy plain message
        const message: BleMessage = {
          id: parsed.id || `msg-${Date.now()}`,
          senderId: parsed.senderId || `device-${sourceDeviceId.slice(-4)}`,
          text: parsed.text || raw,
          timestamp: parsed.timestamp || Date.now(),
          delivered: true
        };
        this.log('info', `Viesti vastaanotettu ← ${message.senderId}`);
        this._callbacks.onMessageReceived?.(message);
      }
    } catch {
      this._callbacks.onMessageReceived?.({
        id: `msg-${Date.now()}`,
        senderId: `device-${sourceDeviceId.slice(-4)}`,
        text: String(value),
        timestamp: Date.now(),
        delivered: true
      });
    }
  }

  /** Process a received MeshPacket: deliver locally, relay onward */
  private handleMeshPacket(packet: MeshPacket, sourceDeviceId: string) {
    if (packet.senderId === this.userId) return;

    if (!shouldRelay(packet)) {
      this.log('info', `Paketti ${packet.uniqueId.slice(0, 8)}… jo nähty tai TTL=0`);
      return;
    }

    const hopsUsed = packet.maxHops - packet.hopCount;
    this.log('info', `Mesh-paketti: ${packet.uniqueId.slice(0, 8)}… (${hopsUsed} hoppia, TTL=${packet.hopCount})`);

    // Handle chunked messages
    if (packet.chunk) {
      const batchId = packet.uniqueId.split('-').slice(0, -1).join('-');
      const existing = this.pendingChunks.get(batchId) || [];
      existing.push(packet);
      this.pendingChunks.set(batchId, existing);

      const reassembled = reassembleChunks(existing);
      if (reassembled) {
        this.pendingChunks.delete(batchId);
        this.deliverMessage(packet.senderId, reassembled, packet.timestamp, packet.uniqueId);
      }
    } else {
      this.deliverMessage(packet.senderId, packet.payload, packet.timestamp, packet.uniqueId);
    }

    // Relay: decrement TTL and rebroadcast after random delay
    if (packet.hopCount > 1) {
      const relayPacket: MeshPacket = { ...packet, hopCount: packet.hopCount - 1 };
      const delay = getRelayDelay();
      this.log('info', `Välitetään ${packet.uniqueId.slice(0, 8)}… eteenpäin (TTL=${relayPacket.hopCount}, viive ${delay.toFixed(0)}ms)`);
      setTimeout(() => {
        this.broadcastPacket(relayPacket, sourceDeviceId);
      }, delay);
    }
  }

  /** Deliver a fully assembled message to the UI */
  private deliverMessage(senderId: string, text: string, timestamp: number, id: string) {
    const message: BleMessage = { id, senderId, text, timestamp, delivered: true };
    this.log('info', `Viesti vastaanotettu ← ${senderId}`);
    this._callbacks.onMessageReceived?.(message);
  }

  private handleDisconnect(deviceId: string) {
    const device = this.connectedDevices.get(deviceId);
    const deviceInfo = device ? { ...device } : null;
    this.connectedDevices.delete(deviceId);
    this.log('warn', `Yhteys katkesi: ${device?.name || deviceId}`);
    this._callbacks.onDeviceDisconnected?.(deviceId);

    if (this.connectedDevices.size === 0) {
      this.setState('disconnected');
    }

    // Auto-reconnect if enabled
    if (this.autoReconnectEnabled && deviceInfo) {
      this.scheduleReconnect(deviceId, deviceInfo);
    }
  }

  /** Schedule an auto-reconnect attempt with exponential backoff */
  private scheduleReconnect(deviceId: string, deviceInfo: BleDeviceInfo) {
    // Clear any existing timer
    const existing = this.reconnectTimers.get(deviceId);
    if (existing) clearTimeout(existing);

    const attempts = this.reconnectAttempts.get(deviceId) || 0;
    if (attempts >= BlueMeshBleService.MAX_RECONNECT_ATTEMPTS) {
      this.log('warn', `Uudelleenyhdistäminen epäonnistui ${attempts} yrityksen jälkeen: ${deviceInfo.name}`);
      this.reconnectAttempts.delete(deviceId);
      return;
    }

    const delay = BlueMeshBleService.RECONNECT_BASE_DELAY_MS * Math.pow(2, attempts);
    this.log('info', `Yritetään uudelleenyhdistämistä ${delay / 1000}s kuluttua (yritys ${attempts + 1}/${BlueMeshBleService.MAX_RECONNECT_ATTEMPTS})...`);

    const timer = setTimeout(async () => {
      this.reconnectTimers.delete(deviceId);
      this.reconnectAttempts.set(deviceId, attempts + 1);

      try {
        // Re-add to found devices so connect() works
        this.foundDevices.set(deviceId, { ...deviceInfo, state: 'found' });
        const ok = await this.connect(deviceId);
        if (ok) {
          this.log('info', `Uudelleenyhdistäminen onnistui: ${deviceInfo.name}`);
          this.reconnectAttempts.delete(deviceId);
        } else {
          this.scheduleReconnect(deviceId, deviceInfo);
        }
      } catch {
        this.scheduleReconnect(deviceId, deviceInfo);
      }
    }, delay);

    this.reconnectTimers.set(deviceId, timer);
  }

  /** Cancel all pending reconnect attempts */
  cancelAllReconnects() {
    for (const timer of this.reconnectTimers.values()) {
      clearTimeout(timer);
    }
    this.reconnectTimers.clear();
    this.reconnectAttempts.clear();
    this.log('info', 'Kaikki uudelleenyhdistämisyritykset peruutettu');
  }

  setAutoReconnect(enabled: boolean) {
    this.autoReconnectEnabled = enabled;
    if (!enabled) this.cancelAllReconnects();
    this.log('info', `Auto-reconnect: ${enabled ? 'päällä' : 'pois'}`);
  }

  async disconnect(deviceId: string): Promise<void> {
    // Cancel any pending reconnect for this device
    const timer = this.reconnectTimers.get(deviceId);
    if (timer) { clearTimeout(timer); this.reconnectTimers.delete(deviceId); }
    this.reconnectAttempts.delete(deviceId);

    try {
      await BluetoothLowEnergy.stopCharacteristicNotifications({
        deviceId,
        service: BLUEMESH_SERVICE_UUID,
        characteristic: MESSAGE_CHAR_UUID,
      });
      await BluetoothLowEnergy.disconnect({ deviceId });
      this.connectedDevices.delete(deviceId);
      this.log('info', 'Yhteys katkaistu');
      if (this.connectedDevices.size === 0) this.setState('idle');
    } catch (error: any) {
      this.log('error', `Yhteyden katkaisu epäonnistui: ${error.message}`);
    }
  }

  async disconnectAll(): Promise<void> {
    this.cancelAllReconnects();
    for (const deviceId of this.connectedDevices.keys()) {
      await this.disconnect(deviceId);
    }
    this.setState('idle');
  }

  private isNative(): boolean {
    return typeof (window as any).Capacitor !== 'undefined';
  }

  getDiagnostics() {
    const nav = navigator as any;
    return {
      bleSupported: !!nav.bluetooth,
      isNative: this.isNative(),
      state: this.state,
      isAdvertising: this.isAdvertising,
      connectedCount: this.connectedDevices.size,
      foundCount: this.foundDevices.size,
      logsCount: this.logs.length,
      platform: this.isNative() ? 'Capacitor (Native)' : 'Web Browser',
      api: '@capgo/capacitor-bluetooth-low-energy'
    };
  }
}

export const bleService = new BlueMeshBleService();
