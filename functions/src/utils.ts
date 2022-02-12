import _ from 'lodash';

export function delay(d: any) {
  return new Promise((fulfill) => {
    setTimeout(fulfill, d);
  });
}
