/* eslint-env jest */
jest.mock('react-native-tcp-socket', () => ({
  createConnection: jest.fn(() => ({
    destroy: jest.fn(),
    on: jest.fn(),
  })),
}));

jest.mock('react-native-udp', () => ({
  createSocket: jest.fn(() => ({
    bind: jest.fn((port, cb) => cb && cb()),
    send: jest.fn((buf, off, len, port, host, cb) => cb && cb()),
    close: jest.fn(),
    on: jest.fn(),
  })),
}));

jest.mock('react-native-zeroconf', () => {
  return jest.fn().mockImplementation(() => ({
    scan: jest.fn(),
    stop: jest.fn(),
    on: jest.fn(),
  }));
});

jest.mock('react-native-ssh-sftp', () => {
  return jest.fn().mockImplementation(() => ({
    connect: jest.fn().mockResolvedValue(undefined),
    execute: jest.fn().mockResolvedValue('Linux 5.4.0'),
    disconnect: jest.fn().mockResolvedValue(undefined),
  }));
});

jest.mock('react-native-permissions', () => ({
  request: jest.fn().mockResolvedValue('granted'),
  PERMISSIONS: {
    IOS: { LOCATION_WHEN_IN_USE: 'ios.permission.LOCATION' },
    ANDROID: { ACCESS_FINE_LOCATION: 'android.permission.ACCESS_FINE_LOCATION' },
  },
  RESULTS: { GRANTED: 'granted' },
}));

jest.mock('react-native-geolocation-service', () => ({
  getCurrentPosition: jest.fn(),
}));

jest.mock('react-native-keychain', () => ({
  setInternetCredentials: jest.fn().mockResolvedValue(true),
  getInternetCredentials: jest.fn().mockResolvedValue({ username: 'admin', password: 'password' }),
  resetInternetCredentials: jest.fn().mockResolvedValue(true),
}));

jest.mock('react-native-html-to-pdf', () => ({
  convert: jest.fn().mockResolvedValue({ filePath: '/mock/path/report.pdf' }),
}));

jest.mock('react-native-vision-camera', () => ({
  Camera: () => null,
  useCameraDevice: jest.fn().mockReturnValue({}),
  useCameraPermission: jest.fn().mockReturnValue({ hasPermission: true, requestPermission: jest.fn() }),
  useCodeScanner: jest.fn(),
}));

jest.mock('@react-native-community/netinfo', () => ({
  fetch: jest.fn().mockResolvedValue({ isConnected: true, isInternetReachable: true }),
  addEventListener: jest.fn().mockReturnValue(jest.fn()),
}));

jest.mock('@nozbe/watermelondb', () => ({
  Database: jest.fn().mockImplementation(() => ({
    get: jest.fn().mockReturnValue({
      query: jest.fn().mockReturnValue({ fetch: jest.fn().mockResolvedValue([]) }),
      find: jest.fn().mockResolvedValue({}),
      create: jest.fn().mockResolvedValue({}),
    }),
    write: jest.fn().mockImplementation(cb => cb()),
    batch: jest.fn().mockResolvedValue(undefined),
  })),
  Model: class Model {},
  appSchema: jest.fn(),
  tableSchema: jest.fn(),
  Q: {
    where: jest.fn(),
  },
}));

jest.mock('@nozbe/watermelondb/adapters/sqlite', () => {
  return jest.fn().mockImplementation(() => ({}));
});

jest.mock('@nozbe/watermelondb/decorators', () => ({
  field: () => () => {},
  readonly: () => () => {},
  date: () => () => {},
  json: () => () => {},
}));
