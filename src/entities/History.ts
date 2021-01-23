import mitt from 'mitt';
import type { Emitter, Handler } from 'mitt';

import { Page } from './Page';
import { nextTick, scheduleBackwardTick, scheduleStateTick } from './scheduler';

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

  constructor(router: Router) {
    this.router = router;

    this.initUpdater();
    this.initState();
    this.initListener();
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
        return [null, page.panel];
      } else {
        return constSwipeList;
      }
    }

    return constSwipeList;
  }

  update() {
    this.updater.emit('update');
  }

  afterUpdate(callback: VoidFunction) {
    this.updater.once('update', callback);
  }

  push(page: Page) {
    log('[>] push: ', page.route, page.params);
    nextTick(() => {
      log('[<] push: ', page.route, page.params);

      page.url = buildURLFromPage(page, this.router.meta);
      page.index = ++this.index;
      this.stack.push(page);

      this.nativePush(page);

      this.update();
    });
  }

  replace(page: Page) {
    log('[>] replace: ', page.route, page.params);
    nextTick(() => {
      log('[<] replace: ', page.route, page.params);

      page.url = buildURLFromPage(page, this.router.meta);
      page.index = this.index;
      this.stack[this.index] = page;

      this.nativeReplace(page);

      this.update();
    });
  }

  pushAfterMove(prevPage: Page, nextPage: Page) {
    const index = findLastPage(prevPage, this.stack);
    if (index === -1) {
      this.push(nextPage);
    } else {
      this.moveTo(index);
      this.replace(nextPage);
    }
  }

  moveBy(by: number) {
    if (by === 0) {
      log('[=] moveBy: ', by);
      this.update();
      return;
    }

    log('[>] moveBy: ', by);
    scheduleBackwardTick(() => {
      log('[<] moveBy: ', by);

      this.nativeGo(by);
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
    this.reset();
    this.replace(page);
  }

  private nativeScroll() {
    window.history.scrollRestoration = 'manual';
  }

  private nativePush(page: Page) {
    this.nativeScroll();
    window.history.pushState(page, page.url, '#' + page.url);
  }

  private nativeReplace(page: Page) {
    this.nativeScroll();
    window.history.replaceState(page, page.url, '#' + page.url);
  }

  private nativeGo(by: number) {
    this.nativeScroll();
    window.history.go(by);
  }

  private initUpdater() {
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

  private initState() {
    this.index = 0;

    let page;
    try {
      const url = this.location;
      page = buildPageFromURL(url, this.router.routes, this.router.meta);
    } catch {
      page = new Page({
        route: '/'
      });
    }

    this.stack = [page];
    this.nativeReplace(page);
  }

  private initListener() {
    window.addEventListener('popstate', (e = window.event as PopStateEvent) => {
      log('[>] popstate', e.state);
      scheduleStateTick(() => {
        log('[<] popstate', e.state);

        let shouldReplace = false;

        let page;
        if (isPageLike(e.state)) {
          page = new Page(e.state);
        } else {
          shouldReplace = true;
          try {
            const url = this.location;
            page = buildPageFromURL(url, this.router.routes, this.router.meta);
          } catch {
            page = new Page({
              route: '/'
            });
          }
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

        if (shouldReplace) {
          this.nativeReplace(page);
        }

        this.update();
      });
    });
  }
}
