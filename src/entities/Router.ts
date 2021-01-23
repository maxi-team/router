import { History } from './History';
import { Page } from './Page';
import { buildMetaListFromInitList, buildPageFromInit } from '../utils/route';

import type { InitRouteList, PageParams, RouteMetaList, Structure } from '../types';

export class Router {
  routes: InitRouteList;
  meta: RouteMetaList;

  history: History;

  constructor(routes: InitRouteList) {
    this.routes = routes;
    this.meta = buildMetaListFromInitList(routes);
    this.history = new History(this);
  }

  pickRoute(route: string) {
    return this.routes[route] || {
      panel: Page.defaultPanel,
      view: Page.defaultView
    };
  }

  buildPage(route: string, params: PageParams = {}) {
    return buildPageFromInit(route, params, this.pickRoute(route));
  }

  buildModal(modal: Structure, params: PageParams = {}) {
    const nextPage = this.history.current.clone();
    nextPage.modal = modal;
    Object.assign(nextPage.params, params);
    return nextPage.compile();
  }

  buildPopout(popout: Structure, params: PageParams = {}) {
    const nextPage = this.history.current.clone();
    nextPage.popout = popout;
    Object.assign(nextPage.params, params);
    return nextPage.compile();
  }

  push(route: string, params?: PageParams) {
    this.history.push(this.buildPage(route, params));
  }

  replace(route: string, params?: PageParams) {
    this.history.replace(this.buildPage(route, params));
  }

  pop() {
    this.history.back();
  }

  popTo(to: number) {
    this.history.moveTo(to);
  }

  popBy(by: number) {
    this.history.moveBy(by);
  }

  reset() {
    this.history.reset();
  }

  resetTo(route: string, params?: PageParams) {
    this.history.resetTo(this.buildPage(route, params));
  }

  pushAfterMove(prevRoute: string, nextRoute: string, params?: PageParams) {
    this.history.pushAfterMove(this.buildPage(prevRoute), this.buildPage(nextRoute, params));
  }

  pushModal(modal: Structure, params?: PageParams) {
    this.history.push(this.buildModal(modal, params));
  }

  replaceModal(modal: Structure, params?: PageParams) {
    const nextPage = this.buildModal(modal, params);
    if (this.history.current.hasModal) {
      this.history.replace(nextPage);
    } else {
      this.history.push(nextPage);
    }
  }

  pushPopup(popup: Structure, params?: PageParams) {
    this.history.push(this.buildPopout(popup, params));
  }

  replacePopup(popup: Structure, params?: PageParams) {
    const nextPage = this.buildPopout(popup, params);
    if (this.history.current.hasPopout) {
      this.history.replace(nextPage);
    } else {
      this.history.push(nextPage);
    }
  }

  popModal() {
    if (this.history.current.hasModal) {
      this.history.back();
    }
  }

  popPopup() {
    if (this.history.current.hasPopout) {
      this.history.back();
    }
  }

  popOverlay() {
    if (this.history.current.hasOverlay) {
      this.history.back();
    }
  }
}
