let _promise: Promise<void> = Promise.resolve();

const _noop = () => {
  // safari has bug with immediate resolve
  // we need add something to event loop
};
const _fixEventLoop = () => window.setTimeout(_noop, 0);
const _scheduleTick = (promise: Promise<void>, after: VoidFunction) => {
  promise.then(after);
  _fixEventLoop();
};

const _createBackwardTick = async () => {
  return new Promise<void>((resolve) => {
    const flush = () => {
      window.removeEventListener('popstate', flush);
      window.setTimeout(resolve, 0);
    };
    window.addEventListener('popstate', flush);
    window.setTimeout(flush, 120);
  });
};

export const nextTick = (after: VoidFunction) => {
  _scheduleTick(_promise, after);
};

export const backwardTick = (after: VoidFunction) => {
  const tick = _promise;
  _promise = _createBackwardTick();
  _scheduleTick(tick, after);
};
