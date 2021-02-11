import mitt from 'mitt';
import type { Emitter, Handler } from 'mitt';

import { Page } from './Page';
import { nextTick, backwardTick } from './scheduler';

import { log } from '../utils/report';
import { Router } from './Router';
import { buildPageFromURL, buildURLFromPage, isPageLike, findLastPage, isShallowEqualPage } from '../utils/route';

type EnhancedEmitter = Emitter & { once: Emitter['on'] };

const constSwipeList: string[] = [];

export class History {
  // late init
  index!: number;
  stack!: Page[];
  router!: Router;
  updater!: EnhancedEmitter;

  idled = false;
  locked = false;

  constructor(router: Router) {
    this.router = router;

    this._initState();
    this._initUpdater();
    this._initListener();
  }

  get current(): Readonly<Page> {
    return this.stack[this.index];
  }

  get location() {
    return window.location.hash.slice(1);
  }

  get swipe() {
    if (this.current.hasOverlay) {
      return constSwipeList;
    }

    let page;
    for (let i = this.stack.length - 2; i >= 0; --i) {
      page = this.stack[i];
      if (page.view === this.current.view) {
        return [page.panel, this.current.panel];
      } else {
        return constSwipeList;
      }
    }

    return constSwipeList;
  }

  update() {
    if (this.idled) {
      log('[-] update');
      return;
    }
    log('[+] update');
    this.updater.emit('update');
  }

  afterUpdate(callback: VoidFunction) {
    this.updater.once('update', callback);
  }

  push(page: Page) {
    log('[<] push: ', page.route, page.params);

    page.url = buildURLFromPage(page, this.router.meta);
    page.index = ++this.index;
    this.stack.push(page);

    this._nativePush(page);

    this.update();
  }

  replace(page: Page) {
    log('[<] replace: ', page.route, page.params);

    page.url = buildURLFromPage(page, this.router.meta);
    page.index = this.index;
    this.stack[this.index] = page;

    this._nativeReplace(page);

    this.update();
  }

  pushAfterMove(prevPage: Page, nextPage: Page) {
    const index = findLastPage(prevPage, this.stack);
    if (index === -1) {
      this.push(nextPage);
    } else {
      this.idled = true;
      this.moveTo(index);
      nextTick(() => {
        this.idled = false;
        this.replace(nextPage);
      });
    }
  }

  moveBy(by: number) {
    if (by === 0) {
      log('[=] moveBy: ', by);
      this.update();
      return;
    }

    log('[>] moveBy: ', by);
    backwardTick(() => {
      log('[<] moveBy: ', by);

      this._nativeGo(by);
    });
  }

  moveTo(to: number) {
    const delta = to - this.index;
    this.moveBy(delta);
  }

  back() {
    this.moveBy(-1);
  }

  reset() {
    this.moveBy(-1 * this.index);
  }

  resetTo(page: Page) {
    this.idled = true;
    this.reset();
    nextTick(() => {
      this.idled = false;
      this.replace(page);
    });
  }

  private _nativeScroll() {
    if ('scrollRestoration' in window.history) {
      window.history.scrollRestoration = 'manual';
    }
  }

  private _nativePush(page: Page) {
    this._nativeScroll();
    window.history.pushState(page, page.url, '#' + page.url);
  }

  private _nativeReplace(page: Page) {
    this._nativeScroll();
    window.history.replaceState(page, page.url, '#' + page.url);
  }

  private _nativeGo(by: number) {
    this._nativeScroll();
    window.history.go(by);
  }

  private _popLocked(e: PopStateEvent) {
    log('[<] lock', e.state);

    if (isPageLike(e.state)) {
      const page = new Page(e.state);

      if (page.index > this.index) {
        this._nativeGo(-1);
      } else {
        this._nativePush(this.current);
      }
    } else {
      this._nativeReplace(this.current);
    }
  }

  private _popDefault(e: PopStateEvent) {
    log('[<] popstate', e.state);

    let shouldReplace = false;

    let page;
    if (isPageLike(e.state)) {
      page = new Page(e.state);
    } else {
      shouldReplace = true;
      page = buildPageFromURL(this.location, this.router.routes, this.router.meta);
    }

    if (
      page.index < this.stack.length &&
      isShallowEqualPage(page, this.stack[page.index])
    ) {
      this.index = page.index;
    } else {
      shouldReplace = true;
      page.index = this.index + 1;
    }

    if (page.index > this.index) {
      this.index = page.index;
      this.stack.push(page);
    } else {
      this.stack.splice(this.index, this.stack.length, page);
    }

    if (this.idled) {
      return;
    }

    if (shouldReplace) {
      this._nativeReplace(page);
    }

    this.update();
  }

  private _initListener() {
    window.addEventListener('popstate', (e = window.event as PopStateEvent) => {
      if (this.locked) {
        this._popLocked(e);
      } else {
        this._popDefault(e);
      }
    });
  }

  private _initUpdater() {
    const emitter = mitt();
    Object.assign(emitter as unknown, {
      once: (type: string, handler: Handler) => {
        const wrappedHandler: Handler = (evt) => {
          handler(evt);
          emitter.off(type, wrappedHandler);
        };
        emitter.on(type, wrappedHandler);
      }
    });
    this.updater = emitter as EnhancedEmitter;
  }

  private _initState() {
    const page = buildPageFromURL(this.location, this.router.routes, this.router.meta);
    this.index = 0;
    this.stack = [page];
    this._nativeReplace(page);
  }
}
