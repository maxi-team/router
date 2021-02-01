import type {
  PageLike,
  PageParams
} from '../types';

export class Page {
  static defaultView = 'home';
  static defaultPanel = 'home';

  index: number;

  url: string;
  route: string;

  view: string;
  panel: string;

  modal?: string | null | undefined;
  get hasModal() {
    return typeof this.modal === 'string';
  }

  popout?: string | null | undefined;
  get hasPopout() {
    return typeof this.popout === 'string';
  }

  get hasOverlay() {
    return this.hasModal || this.hasPopout;
  }

  params: PageParams;

  constructor(pageLike: PageLike) {
    this.index = pageLike.index || 0;

    this.view = pageLike.view || Page.defaultView;
    this.panel = pageLike.panel || Page.defaultPanel;

    this.params = pageLike.params || {};

    this.modal = pageLike.modal || this.params['m'] || null;
    this.popout = pageLike.popout || this.params['p'] || null;

    this.route = pageLike.route || '/';
    this.url = pageLike.url || this.route;
  }

  compile() {
    if (this.hasModal) {
      this.params['m'] = this.modal as string;
    }

    if (this.hasPopout) {
      this.params['p'] = this.popout as string;
    }

    return this;
  }

  clone() {
    return new Page(this);
  }
}
