const isDev = __DEV__ || process.env.NODE_ENV === 'development';

export const devLog = (...args: unknown[]) => { if (isDev) console.log(...args); };
export const devError = (...args: unknown[]) => { if (isDev) console.error(...args); };
export const devWarn = (...args: unknown[]) => { if (isDev) console.warn(...args); };
export const devGroup = (label: string) => { if (isDev) console.group(label); };
export const devGroupEnd = () => { if (isDev) console.groupEnd(); };
