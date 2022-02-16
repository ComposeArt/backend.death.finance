import _ from 'lodash';

export function delay(d: any) {
  return new Promise((fulfill) => {
    setTimeout(fulfill, d);
  });
}

export function emulatorLog(message: string) {
  if (process.env.FUNCTIONS_EMULATOR) {
    console.log(message)
  }
}
