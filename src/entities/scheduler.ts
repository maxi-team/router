let _promise: Promise<void> = Promise.resolve();

const noop = () => {
  // noop
};
const fixEventLoop = () => window.setTimeout(noop);

export const nextTick = (after: VoidFunction) => {
  _promise.then(after);
  fixEventLoop();
};

const createBackwardTick = async () => {
  return new Promise<void>((resolve) => {
    const flush = () => {
      window.removeEventListener('popstate', flush);
      window.setTimeout(resolve, 26);
    };
    window.addEventListener('popstate', flush);
    window.setTimeout(flush, 900);
  });
};

const createStateTick = async () => {
  return new Promise<void>((resolve) => {
    window.setTimeout(resolve, 0);
  });
};

export const scheduleBackwardTick = (after: VoidFunction) => {
  const tick = _promise;
  _promise = createBackwardTick();
  tick.then(after);
  fixEventLoop();
};

export const scheduleStateTick = (after: VoidFunction) => {
  _promise = createStateTick().then(after);
};
