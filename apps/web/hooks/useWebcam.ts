'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import { resolveWebcamError } from '../services/apiError';

export interface UseWebcamReturn {
  videoRef: React.RefObject<HTMLVideoElement>;
  isStreaming: boolean;
  permissionStatus: 'prompt' | 'granted' | 'denied' | 'unsupported';
  errorMessage: string | null;
  startCamera: () => Promise<void>;
  stopCamera: () => void;
  devices: MediaDeviceInfo[];
  selectedDeviceId: string;
  setSelectedDeviceId: (deviceId: string) => void;
}

export function useWebcam(): UseWebcamReturn {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [isStreaming, setIsStreaming] = useState(false);
  const [permissionStatus, setPermissionStatus] = useState<'prompt' | 'granted' | 'denied' | 'unsupported'>('prompt');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [devices, setDevices] = useState<MediaDeviceInfo[]>([]);
  const [selectedDeviceId, setSelectedDeviceId] = useState<string>('');

  // Enumerate video devices
  const updateDeviceList = useCallback(async () => {
    if (typeof navigator === 'undefined' || !navigator.mediaDevices?.enumerateDevices) {
      setPermissionStatus('unsupported');
      return;
    }
    try {
      const allDevices = await navigator.mediaDevices.enumerateDevices();
      const videoDevices = allDevices.filter((d) => d.kind === 'videoinput');
      setDevices(videoDevices);
      if (videoDevices.length > 0 && !selectedDeviceId) {
        setSelectedDeviceId(videoDevices[0].deviceId);
      }
    } catch {
      // Device enumeration errors must remain non-fatal to camera startup; reset stale list cleanly.
      setDevices([]);
    }
  }, [selectedDeviceId]);

  useEffect(() => {
    updateDeviceList();
  }, [updateDeviceList]);

  // Teardown tracks
  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => {
        track.stop();
      });
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setIsStreaming(false);
  }, []);

  // Safe camera acquisition
  const startCamera = useCallback(async () => {
    if (typeof navigator === 'undefined' || !navigator.mediaDevices?.getUserMedia) {
      setPermissionStatus('unsupported');
      setErrorMessage('Browser does not support navigator.mediaDevices.getUserMedia camera API.');
      return;
    }

    setErrorMessage(null);

    // Stop existing stream first to avoid hardware lock
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
    }

    const constraints: MediaStreamConstraints = {
      video: {
        deviceId: selectedDeviceId ? { exact: selectedDeviceId } : undefined,
        width: { ideal: 640 },
        height: { ideal: 480 },
        frameRate: { ideal: 30, max: 30 },
      },
      audio: false, // Strict privacy: no audio recording during vision acquisition
    };

    try {
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }

      setIsStreaming(true);
      setPermissionStatus('granted');
      updateDeviceList();
    } catch (err: unknown) {
      setIsStreaming(false);
      const resolved = resolveWebcamError(err);
      if (resolved.denied) {
        setPermissionStatus('denied');
      }
      setErrorMessage(resolved.message);
    }
  }, [selectedDeviceId, updateDeviceList]);

  // Automatic cleanup on unmount
  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, [stopCamera]);

  return {
    videoRef,
    isStreaming,
    permissionStatus,
    errorMessage,
    startCamera,
    stopCamera,
    devices,
    selectedDeviceId,
    setSelectedDeviceId,
  };
}
