declare module 'react-native-html-to-pdf' {
  interface Options {
    html: string;
    fileName: string;
    directory?: string;
    base64?: boolean;
    width?: number;
    height?: number;
    padding?: number;
  }

  interface Result {
    filePath?: string;
    base64?: string;
  }

  const convert: (options: Options) => Promise<Result>;
  export { convert };
}

declare module 'react-native-fs' {
  export const exists: (path: string) => Promise<boolean>;
  export const DocumentDirectoryPath: string;
  export const readFile: (path: string, encoding?: string) => Promise<string>;
  export const writeFile: (path: string, content: string, encoding?: string) => Promise<void>;
}
