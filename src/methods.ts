import { Router } from './entities/Router';
import { configure } from './utils/report';

import type { InitRouteList } from './types';

let instance: Router | null = null;

export const init = (routes: InitRouteList, debug = false) => {
  if (instance !== null) {
    throw new Error('Router is already initialized');
  }

  configure(debug);
  instance = new Router(routes);
};

export const getInstance = () => {
  if (instance === null) {
    throw new Error('Router is not initialized');
  }

  return instance as Router;
};
