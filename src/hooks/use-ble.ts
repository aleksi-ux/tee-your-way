import { useState, useEffect, useCallback, useRef } from 'react';
import { bleService, BleConnectionState, BleDeviceInfo, BleMessage, LogEntry } from '@/lib/ble-service';

export function useBle(userId: string) {
  const [state, setState] = useState<BleConnectionState>('idle');
  const [error, setError] = useState<string | null>(null);
  const [devices, setDevices] = useState<BleDeviceInfo[]>([]);
  const [connectedDevices, setConnectedDevices] = useState<BleDeviceInfo[]>([]);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [supported, setSupported] = useState<boolean | null>(null);
  const [supportMessage, setSupportMessage] = useState('');
  const initialized = useRef(false);
  const messageCallbackRef = useRef<((msg: BleMessage) => void) | null>(null);
  const deliveredCallbackRef = useRef<((id: string) => void) | null>(null);

  useEffect(() => {
    bleService.setUserId(userId);
  }, [userId]);

  // Set up callbacks once
  useEffect(() => {
    const updateCallbacks = () => {
      bleService.setCallbacks({
        onStateChange: (newState, err) => {
          setState(newState);
          setError(err || null);
          setConnectedDevices(bleService.getConnectedDevices());
        },
        onDeviceFound: () => {
          setDevices(bleService.getFoundDevices());
        },
        onDeviceDisconnected: () => {
          setConnectedDevices(bleService.getConnectedDevices());
        },
        onMessageReceived: (msg) => {
          messageCallbackRef.current?.(msg);
        },
        onMessageDelivered: (id) => {
          deliveredCallbackRef.current?.(id);
        },
        onLog: () => {
          setLogs(bleService.getLogs());
        }
      });
    };
    updateCallbacks();
  }, []);

  const checkSupport = useCallback(async () => {
    const result = await bleService.checkSupport();
    setSupported(result.supported);
    setSupportMessage(result.reason || '');
    return result;
  }, []);

  const initialize = useCallback(async () => {
    if (initialized.current) return true;
    const ok = await bleService.initialize();
    if (ok) initialized.current = true;
    return ok;
  }, []);

  const startScan = useCallback(async () => {
    setDevices([]);
    await bleService.startScan();
  }, []);

  const stopScan = useCallback(async () => {
    await bleService.stopScan();
  }, []);

  const connect = useCallback(async (deviceId: string) => {
    return bleService.connect(deviceId);
  }, []);

  const disconnect = useCallback(async (deviceId: string) => {
    await bleService.disconnect(deviceId);
  }, []);

  const disconnectAll = useCallback(async () => {
    await bleService.disconnectAll();
  }, []);

  const sendMessage = useCallback(async (text: string, messageId: string) => {
    return bleService.sendMessage(text, messageId);
  }, []);

  const setMessageCallback = useCallback((
    onReceived: (msg: BleMessage) => void,
    onDelivered?: (id: string) => void
  ) => {
    messageCallbackRef.current = onReceived;
    deliveredCallbackRef.current = onDelivered || null;
  }, []);

  const getDiagnostics = useCallback(() => {
    return bleService.getDiagnostics();
  }, []);

  return {
    state, error, devices, connectedDevices, logs,
    supported, supportMessage,
    checkSupport, initialize, startScan, stopScan,
    connect, disconnect, disconnectAll, sendMessage,
    setMessageCallback, getDiagnostics
  };
}
