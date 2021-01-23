let _debug = false;

const log = (...args: unknown[]) => {
  if (_debug) {
    console.log(...args);
  }
};

const configure = (debug = false) => {
  _debug = debug;
};

export { log, configure };
