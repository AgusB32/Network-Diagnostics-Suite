declare module 'react-native-ssh-sftp' {
  export default class SSHClient {
    constructor(host: string, port: string, username: string, password?: string);
    connect(): Promise<void>;
    execute(command: string): Promise<string>;
    disconnect(): Promise<void>;
  }
}

declare module 'react-native-html-to-pdf' {
  export interface Options {
    html: string;
    fileName?: string;
    directory?: string;
    base64?: boolean;
    height?: number;
    width?: number;
  }
  export interface File {
    filePath?: string;
    base64?: string;
  }
  export function convert(options: Options): Promise<File>;
}

declare module 'react-native-udp';
declare module 'react-native-zeroconf';
