'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { Plus, KeyRound, Ban, CheckCircle2, Link2, Link2Off, AlertTriangle } from 'lucide-react';
import {
  Button,
  Input,
  Label,
  Badge,
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
  FormDialog,
  ConfirmDialog,
  useDialog,
} from '@busmate/ui';
import { BusManagementService, type BusResponse } from '@busmate/api-client-core';
import { useSetPageMetadata, useSetPageActions } from '@/context/PageContext';
import { useToast } from '@/hooks/use-toast';
import {
  DevicesApi,
  type DeviceResponse,
  type DeviceType,
  type DeviceStatus,
} from '@/services/telemetry/devicesApi';

// Registry admin for the IoT device fleet (IoT Platform Layer plan, Phase 1), ported into
// new-react-portal — the portal all new features land in going forward — with a fleet-health
// "Silent" indicator added (Phase 3): FleetHealthMonitorJob in telemetry-service flags an ACTIVE
// device that has gone quiet past a configured threshold, surfaced here via `silenceFlaggedAt`.
// The live map at /mot/tracking reads from this same fleet's telemetry.

const STATUS_VARIANT: Record<DeviceStatus, 'default' | 'secondary' | 'destructive' | 'outline'> = {
  PROVISIONED: 'secondary',
  ACTIVE: 'default',
  DISABLED: 'destructive',
  RETIRED: 'outline',
};

export default function DevicesPage() {
  const { toast } = useToast();

  const [devices, setDevices] = useState<DeviceResponse[]>([]);
  const [deviceTypes, setDeviceTypes] = useState<DeviceType[]>([]);
  const [buses, setBuses] = useState<BusResponse[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const registerDialog = useDialog();
  const tokenDialog = useDialog<{ serialNumber: string; token: string }>();
  const assignDialog = useDialog<DeviceResponse>();
  const disableDialog = useDialog<DeviceResponse>();

  const [form, setForm] = useState({ serialNumber: '', deviceTypeCode: '', label: '' });
  const [assignBusId, setAssignBusId] = useState('');

  useSetPageMetadata({
    title: 'IoT Devices',
    description: 'Register GPS trackers, issue ingest tokens, and assign devices to buses',
    activeItem: 'devices',
    showBreadcrumbs: true,
    breadcrumbs: [{ label: 'Devices' }],
  });

  const load = useCallback(async () => {
    setIsLoading(true);
    try {
      const [deviceList, types, busList] = await Promise.all([
        DevicesApi.list(),
        DevicesApi.deviceTypes(),
        BusManagementService.getAllBusesAsList(),
      ]);
      setDevices(deviceList);
      setDeviceTypes(types);
      setBuses(busList);
    } catch (err) {
      toast({
        title: 'Failed to load devices',
        description: err instanceof Error ? err.message : 'Unknown error',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    load();
    // Fleet health can change between explicit reloads (the backend job runs independently) —
    // a light poll keeps the silent-device badge current without needing the SSE stream.
    const interval = setInterval(load, 60_000);
    return () => clearInterval(interval);
  }, [load]);

  useSetPageActions(
    <Button onClick={() => { setForm({ serialNumber: '', deviceTypeCode: '', label: '' }); registerDialog.open(); }}>
      <Plus className="mr-2 h-4 w-4" />
      Register device
    </Button>,
  );

  const busLabelById = useMemo(() => {
    const map = new Map<string, string>();
    for (const bus of buses) {
      if (bus.id) map.set(bus.id, bus.plateNumber ?? bus.id);
    }
    return map;
  }, [buses]);

  const handleRegister = async () => {
    if (!form.serialNumber.trim() || !form.deviceTypeCode) {
      toast({ title: 'Serial number and device type are required', variant: 'destructive' });
      return;
    }
    setActionLoading('register');
    try {
      const result = await DevicesApi.register({
        serialNumber: form.serialNumber.trim(),
        deviceTypeCode: form.deviceTypeCode,
        label: form.label.trim() || undefined,
      });
      registerDialog.close();
      await load();
      tokenDialog.open({ serialNumber: result.device.serialNumber, token: result.token });
    } catch (err) {
      toast({
        title: 'Registration failed',
        description: err instanceof Error ? err.message : 'Unknown error',
        variant: 'destructive',
      });
    } finally {
      setActionLoading(null);
    }
  };

  const handleRotateToken = async (device: DeviceResponse) => {
    setActionLoading(device.id);
    try {
      const result = await DevicesApi.rotateToken(device.id);
      await load();
      tokenDialog.open({ serialNumber: device.serialNumber, token: result.token });
    } catch (err) {
      toast({
        title: 'Token rotation failed',
        description: err instanceof Error ? err.message : 'Unknown error',
        variant: 'destructive',
      });
    } finally {
      setActionLoading(null);
    }
  };

  const handleToggleEnabled = async (device: DeviceResponse) => {
    if (device.status === 'DISABLED') {
      setActionLoading(device.id);
      try {
        await DevicesApi.enable(device.id);
        await load();
        toast({ title: `${device.serialNumber} re-enabled` });
      } catch (err) {
        toast({ title: 'Failed to enable device', description: err instanceof Error ? err.message : undefined, variant: 'destructive' });
      } finally {
        setActionLoading(null);
      }
    } else {
      disableDialog.open(device);
    }
  };

  const confirmDisable = async () => {
    const device = disableDialog.data;
    if (!device) return;
    setActionLoading(device.id);
    try {
      await DevicesApi.disable(device.id);
      await load();
      toast({ title: `${device.serialNumber} disabled`, description: 'Its ingest token was revoked.' });
    } catch (err) {
      toast({ title: 'Failed to disable device', description: err instanceof Error ? err.message : undefined, variant: 'destructive' });
    } finally {
      setActionLoading(null);
      disableDialog.close();
    }
  };

  const openAssign = (device: DeviceResponse) => {
    setAssignBusId(device.currentBusId ?? '');
    assignDialog.open(device);
  };

  const handleAssign = async () => {
    const device = assignDialog.data;
    if (!device || !assignBusId) return;
    setActionLoading(device.id);
    try {
      await DevicesApi.assign(device.id, assignBusId);
      await load();
      assignDialog.close();
      toast({ title: `${device.serialNumber} assigned` });
    } catch (err) {
      toast({ title: 'Assignment failed', description: err instanceof Error ? err.message : 'Unknown error', variant: 'destructive' });
    } finally {
      setActionLoading(null);
    }
  };

  const handleUnassign = async (device: DeviceResponse) => {
    setActionLoading(device.id);
    try {
      await DevicesApi.unassign(device.id);
      await load();
      toast({ title: `${device.serialNumber} unassigned` });
    } catch (err) {
      toast({ title: 'Unassign failed', description: err instanceof Error ? err.message : 'Unknown error', variant: 'destructive' });
    } finally {
      setActionLoading(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Serial</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Label</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Assigned bus</TableHead>
              <TableHead>Last seen</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading && (
              <TableRow>
                <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                  Loading devices…
                </TableCell>
              </TableRow>
            )}
            {!isLoading && devices.length === 0 && (
              <TableRow>
                <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                  No devices registered yet.
                </TableCell>
              </TableRow>
            )}
            {devices.map((device) => (
              <TableRow key={device.id}>
                <TableCell className="font-medium">{device.serialNumber}</TableCell>
                <TableCell>{device.deviceTypeCode}</TableCell>
                <TableCell>{device.label ?? '—'}</TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <Badge variant={STATUS_VARIANT[device.status]}>{device.status}</Badge>
                    {device.silenceFlaggedAt && (
                      <Badge variant="destructive" className="gap-1">
                        <AlertTriangle className="h-3 w-3" />
                        Silent
                      </Badge>
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  {device.currentBusId ? (busLabelById.get(device.currentBusId) ?? device.currentBusId) : '—'}
                </TableCell>
                <TableCell>{device.lastSeenAt ? new Date(device.lastSeenAt).toLocaleString() : 'Never'}</TableCell>
                <TableCell>
                  <div className="flex justify-end gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      title="Rotate token"
                      disabled={actionLoading === device.id || device.status === 'RETIRED'}
                      onClick={() => handleRotateToken(device)}
                    >
                      <KeyRound className="h-4 w-4" />
                    </Button>
                    {device.currentBusId ? (
                      <Button
                        variant="ghost"
                        size="icon"
                        title="Unassign from bus"
                        disabled={actionLoading === device.id}
                        onClick={() => handleUnassign(device)}
                      >
                        <Link2Off className="h-4 w-4" />
                      </Button>
                    ) : (
                      <Button
                        variant="ghost"
                        size="icon"
                        title="Assign to bus"
                        disabled={actionLoading === device.id || device.status === 'RETIRED'}
                        onClick={() => openAssign(device)}
                      >
                        <Link2 className="h-4 w-4" />
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      size="icon"
                      title={device.status === 'DISABLED' ? 'Re-enable' : 'Disable'}
                      disabled={actionLoading === device.id || device.status === 'RETIRED'}
                      onClick={() => handleToggleEnabled(device)}
                    >
                      {device.status === 'DISABLED' ? (
                        <CheckCircle2 className="h-4 w-4" />
                      ) : (
                        <Ban className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Register device */}
      <FormDialog
        open={registerDialog.isOpen}
        onOpenChange={registerDialog.setOpen}
        title="Register a device"
        description="Creates the device and issues its ingest token — the token is shown once, right after this."
      >
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="serialNumber">Serial number</Label>
            <Input
              id="serialNumber"
              placeholder="GPS-2026-00042"
              value={form.serialNumber}
              onChange={(e) => setForm((f) => ({ ...f, serialNumber: e.target.value }))}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="deviceType">Device type</Label>
            <select
              id="deviceType"
              className="w-full rounded-md border px-3 py-2 text-sm"
              value={form.deviceTypeCode}
              onChange={(e) => setForm((f) => ({ ...f, deviceTypeCode: e.target.value }))}
            >
              <option value="">Select a type…</option>
              {deviceTypes.map((t) => (
                <option key={t.code} value={t.code}>
                  {t.displayName}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="label">Label (optional)</Label>
            <Input
              id="label"
              placeholder="Tracker – WP CAA-4521 dashboard"
              value={form.label}
              onChange={(e) => setForm((f) => ({ ...f, label: e.target.value }))}
            />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={registerDialog.close}>
              Cancel
            </Button>
            <Button onClick={handleRegister} disabled={actionLoading === 'register'}>
              Register
            </Button>
          </div>
        </div>
      </FormDialog>

      {/* One-time token display */}
      <FormDialog
        open={tokenDialog.isOpen}
        onOpenChange={tokenDialog.setOpen}
        title="Device ingest token"
        description={`Copy this now for ${tokenDialog.data?.serialNumber ?? 'the device'} — it will not be shown again.`}
      >
        <div className="space-y-4">
          <code className="block break-all rounded-md bg-muted p-3 text-sm">
            {tokenDialog.data?.token}
          </code>
          <div className="flex justify-end">
            <Button onClick={tokenDialog.close}>Done</Button>
          </div>
        </div>
      </FormDialog>

      {/* Assign to bus */}
      <FormDialog
        open={assignDialog.isOpen}
        onOpenChange={assignDialog.setOpen}
        title="Assign to bus"
        description={assignDialog.data ? `Install ${assignDialog.data.serialNumber} in a bus.` : undefined}
      >
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="busId">Bus</Label>
            <select
              id="busId"
              className="w-full rounded-md border px-3 py-2 text-sm"
              value={assignBusId}
              onChange={(e) => setAssignBusId(e.target.value)}
            >
              <option value="">Select a bus…</option>
              {buses.map((bus) => (
                <option key={bus.id} value={bus.id}>
                  {bus.plateNumber} — {bus.model}
                </option>
              ))}
            </select>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={assignDialog.close}>
              Cancel
            </Button>
            <Button onClick={handleAssign} disabled={!assignBusId || actionLoading === assignDialog.data?.id}>
              Assign
            </Button>
          </div>
        </div>
      </FormDialog>

      <ConfirmDialog
        open={disableDialog.isOpen}
        onOpenChange={disableDialog.setOpen}
        title="Disable this device?"
        description={
          disableDialog.data
            ? `${disableDialog.data.serialNumber}'s ingest token will be revoked immediately. Re-enabling it later requires issuing a new token.`
            : undefined
        }
        confirmLabel="Disable"
        variant="destructive"
        onConfirm={confirmDisable}
        loading={actionLoading === disableDialog.data?.id}
      />
    </div>
  );
}
