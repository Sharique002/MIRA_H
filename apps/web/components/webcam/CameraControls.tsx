'use client';

import React from 'react';
import { Camera, CameraOff, RefreshCw, Video } from 'lucide-react';
import { Button } from '../ui/Button';
import { Select } from '../ui/Select';

interface CameraControlsProps {
  isStreaming: boolean;
  onStart: () => void;
  onStop: () => void;
  devices: MediaDeviceInfo[];
  selectedDeviceId: string;
  onDeviceChange: (deviceId: string) => void;
  isLoading?: boolean;
}

export const CameraControls: React.FC<CameraControlsProps> = ({
  isStreaming,
  onStart,
  onStop,
  devices,
  selectedDeviceId,
  onDeviceChange,
  isLoading = false,
}) => {
  const deviceOptions = devices.map((d, index) => ({
    value: d.deviceId,
    label: d.label || `Camera ${index + 1}`,
  }));

  return (
    <div className="flex flex-wrap items-center justify-between gap-4 p-3 bg-white rounded-xl border border-ink/10 shadow-sm">
      <div className="flex items-center gap-3">
        {isStreaming ? (
          <Button
            variant="danger"
            size="md"
            onClick={onStop}
            className="flex items-center gap-2"
          >
            <CameraOff className="w-4 h-4" />
            <span>Stop Camera</span>
          </Button>
        ) : (
          <Button
            variant="accent"
            size="md"
            onClick={onStart}
            isLoading={isLoading}
            className="flex items-center gap-2"
          >
            <Camera className="w-4 h-4" />
            <span>Activate Webcam</span>
          </Button>
        )}

        <div className="flex items-center gap-2 text-xs font-mono">
          <span className="w-2 h-2 rounded-full bg-softgreen" />
          <span className="text-ink-muted">
            {isStreaming ? 'Live Stream Active (Local Only)' : 'Camera Standby'}
          </span>
        </div>
      </div>

      {devices.length > 1 && (
        <div className="w-48">
          <Select
            options={deviceOptions}
            value={selectedDeviceId}
            onChange={(e) => onDeviceChange(e.target.value)}
            disabled={isStreaming}
          />
        </div>
      )}
    </div>
  );
};
