import type { Router } from '../entities/Router';
import type { Structure } from '../types';

import { getInstance } from '../methods';

import { useMemo } from 'react';
import { useUpdate, useMount } from '@mntm/shared';

export const useRouter = () => {
  return getInstance();
};

export const useHistory = () => {
  const router = useRouter();
  return router.history;
};

export const usePage = () => {
  const router = useRouter();
  return router.history.current;
};

export const useParams = () => {
  const router = useRouter();
  return router.history.current.params;
};

const findHistory = (router: Router, panel: Structure) => {
  const stack = router.history.stack;
  for (let i = stack.length - 2; i >= 0; --i) {
    if (stack[i].panel === panel) {
      return stack[i];
    }
  }
  return router.history.current;
};

export const useMemoParams = (panel: Structure) => {
  const router = useRouter();
  return useMemo(() => {
    return findHistory(router, panel).params;
  }, [panel]);
};

export const useSubscribe = () => {
  const router = useRouter();
  const next = useUpdate();
  useMount(() => {
    router.history.updater.on('update', next);
    return () => router.history.updater.off('update', next);
  });
  return router.history.current;
};

export const useSubscribeOverlay = () => {
  const router = useRouter();
  const next = useUpdate();
  useMount(() => {
    let lastModal = router.history.current.modal;
    let lastPopout = router.history.current.popout;
    const checkNext = () => {
      if (
        lastModal !== router.history.current.modal ||
        lastPopout !== router.history.current.popout
      ) {
        next();
      }
      lastModal = router.history.current.modal;
      lastPopout = router.history.current.popout;
    };
    router.history.updater.on('update', checkNext);
    return () => router.history.updater.off('update', checkNext);
  });
  return router.history.current;
};
