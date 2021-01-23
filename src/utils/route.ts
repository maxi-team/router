import { Page } from '../entities/Page';

import type { PageParams, Token, RouteMeta, RouteMetaList, InitRouteList, InitPage, PageLike } from '../types';

const parseTokens = (route: string) => {
  let match;
  let token;

  const tokenRegex = /:[\w]+/g;
  const tokens: Token[] = [];

  while ((match = tokenRegex.exec(route)) !== null) {
    token = match[0];

    tokens.push({
      name: token.slice(1),
      raw: token
    });
  }

  return tokens;
};

const routeToRegex = (route: string, tokens: Token[]) => {
  const regex = tokens.reduce((acc, token) => {
    return acc.replace(token.raw, '([\\w-]+)');
  }, route);
  return new RegExp(`^${regex}$`, 'i');
};

const tokensToExclude = (tokens: Token[]) => {
  return tokens.map((token) => token.name);
};

export const parseRoute = (route: string): RouteMeta => {
  const tokens = parseTokens(route);
  const regex = routeToRegex(route, tokens);
  const exclude = tokensToExclude(tokens);

  return {
    regex,
    tokens,
    exclude
  };
};

export const buildURLFromPage = (page: Page, list: RouteMetaList) => {
  const meta = list[page.route];

  const path = meta.tokens.reduce((acc, token) => {
    if (!(token.name in page.params)) {
      throw new Error('Token not found');
    }
    return acc.replace(token.raw, page.params[token.name]);
  }, page.route);

  const partial: string[] = [];
  for (const key in page.params) {
    if (!meta.exclude.includes(key)) {
      partial.push(`${key}=${page.params[key]}`);
    }
  }
  const query = partial.join('&');

  return `${path}?${query}`;
};

export const buildPageFromURL = (url: string, routeList: InitRouteList, metaList: RouteMetaList) => {
  const [path, query] = url.split('?');
  const params: PageParams = {};

  let matchRoute;
  let matchMeta;

  for (const route in metaList) {
    if (metaList[route].regex.test(path)) {
      matchRoute = route;
      matchMeta = metaList[route];
      break;
    }
  }

  if (!matchMeta || !matchRoute) {
    throw new Error('Route for page not found');
  }

  const matchTokens = matchMeta.regex.exec(path);
  if (matchTokens) {
    for (let i = 1; i < matchTokens.length; ++i) {
      params[matchMeta.exclude[i - 1]] = matchTokens[i];
    }
  }

  if (query) {
    let match;

    const paramsRegex = /([\w-]+)=([\w-]+)/g;
    while ((match = paramsRegex.exec(query)) !== null) {
      params[match[1]] = match[2];
    }
  }

  const init = routeList[matchRoute];

  return new Page({
    params,
    route: matchRoute,
    panel: init.panel,
    view: init.view,
    url
  }).compile();
};

export const buildPageFromInit = (route: string, params: PageParams, init: InitPage) => {
  return new Page({
    params,
    route,
    panel: init.panel,
    view: init.view
  }).compile();
};

export const buildMetaListFromInitList = (list: InitRouteList) => {
  const meta: RouteMetaList = {};
  for (const route in list) {
    meta[route] = parseRoute(route);
  }
  return meta;
};

export const isPageLike = (maybeRoute?: PageLike): maybeRoute is PageLike => {
  return !!maybeRoute && 'route' in maybeRoute;
};

export const isShallowEqualPage = (a: Page, b: Page) => {
  return (
    a.panel === b.panel &&
    a.view === b.view &&
    a.modal === b.modal &&
    a.popout === b.popout
  );
};

export const findLastPage = (page: Page, stack: Page[]) => {
  for (let i = stack.length - 1; i >= 0; --i) {
    if (isShallowEqualPage(page, stack[i])) {
      return i;
    }
  }
  return -1;
};
