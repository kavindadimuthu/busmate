import type { DeviceInfo } from '../shared/protocol.ts';

export interface DeviceCredential extends DeviceInfo {
  token: string;
}

/**
 * The six GPS trackers telemetry-service's dev seed creates, each statically assigned to one demo bus
 * (R__900/R__901/R__902, listed in docs/dev-iot-device-credentials.md). The tokens only authenticate
 * against a database carrying that dev seed.
 */
export const DEMO_DEVICES: DeviceCredential[] = [
  { serial: 'GPS-DEMO-4521', deviceId: '00000000-0000-0000-0000-000000010601', busId: '00000000-0000-0000-0000-000000010301', busLabel: 'WP CAA-4521', token: 'bmt_devseed_01_813de247c3b1f239c4d5e955' },
  { serial: 'GPS-DEMO-7734', deviceId: '00000000-0000-0000-0000-000000010602', busId: '00000000-0000-0000-0000-000000010302', busLabel: 'WP CAB-7734', token: 'bmt_devseed_02_f715e4f84949158e86b3dd69' },
  { serial: 'GPS-DEMO-2210', deviceId: '00000000-0000-0000-0000-000000010603', busId: '00000000-0000-0000-0000-000000010303', busLabel: 'SP CAA-2210', token: 'bmt_devseed_03_9ecbe505e29ef2191550d253' },
  { serial: 'GPS-DEMO-9981', deviceId: '00000000-0000-0000-0000-000000010604', busId: '00000000-0000-0000-0000-000000010304', busLabel: 'SP CAB-9981', token: 'bmt_devseed_04_deecb8b938fb498c32b66e8a' },
  { serial: 'GPS-DEMO-1123', deviceId: '00000000-0000-0000-0000-000000010605', busId: '00000000-0000-0000-0000-000000010305', busLabel: 'CP NA-1123', token: 'bmt_devseed_05_c78c6a3227fbb34bb612300b' },
  { serial: 'GPS-DEMO-1187', deviceId: '00000000-0000-0000-0000-000000010606', busId: '00000000-0000-0000-0000-000000010306', busLabel: 'CP NA-1187', token: 'bmt_devseed_06_94fa97c8fb986ac6551c270a' },
];

export const publicDeviceInfo = ({ token: _token, ...info }: DeviceCredential): DeviceInfo => info;
