# @mntm/router

Гибкий событийно-ориентированный роутер для VK Mini Apps.

> Вдохновлен [@happysanta/router](https://github.com/HappySanta/router)

## Мотивация

Из соображений совместимости и простоты на платформе VK Mini Apps лучше использовать роутеры основанные на хэш навигации с помощью History API. Существующие решения, такие как [react-router](https://reactrouter.com) или [router5](https://router5.js.org) не предоставляют полный функционал, необходимый для работы с VKUI, либо расширяют его только с помощью дополнительных плагинов. 

Мы хотим решить проблему навигации и интеграции с VKUI из коробки.

## Концепты

### Страница

Страница - состояние навигации приложения. Описывает структуру и переданные параметры.

```js
const initial = new Page('/');
```

### Роутер

Роутер - интерфейс инкапсулирующий работу со страницами и предоставляющий все необходимые методы работы с историей.

```js
const router = new Router({
  '/': { panel: 'home', view: 'home' }
});
```

### История

История - интерфейс работающий со страницами и History API.

```js
const history = router.history;
```

## Рекомендации по использованию

Рекомендуем создать отдельный файл, который будет описывать структуру приложения:

```js
/**
 * Пути, которые будут использоваться для навигации
 * Пример: https://vk.com/app#/settings, где `/settings` - это путь
 */ 
export const pages = {
  HOME: '/',
  SETTINGS: '/settings',
  OPTIONS: '/settings/options'
};

/**
 * Идентификаторы панелей
 * Используем так: `<Panel id={panels.HOME} />`
 */
export const panels = {
  HOME: 'home',
  SETTINGS: 'settings',
  OPTIONS: 'options'
};

/**
 * Идентификаторы вьюшек
 * Используем так: `<View id={views.HOME} />`
 */
export const views = {
  HOME: 'home',
  SETTINGS: 'settings'
};

/**
 * Структура приложения - для каждого пути соответствующая пара panel и view
 * Используем так: `init(routes);`
 */
export const routes = {
  [pages.HOME]: { panel: panels.HOME, view: views.HOME },
  [pages.SETTINGS]: { panel: panels.SETTINGS, view: views.SETTINGS },
  [pages.OPTIONS]: { panel: panels.OPTIONS, view: views.SETTINGS }
};
```

В этом же файле можно объявить идентификаторы для модалок и всплывающих окон:

```js
/**
 * Идентификаторы модалок
 * Используем так: `<ModalPage id={modals.HELLO} />`
 */
export const modals = {
  HELLO: 'hello'
};

/**
 * Идентификаторы всплывающих окон
 * Используем так: `<ScreenSpinner id={popouts.SPINNER} />`
 */
export const popouts = {
  SPINNER: 'spinner'
};
```

## Использование с React

Прежде чем начать, убедитесь, что роутер проинициализирован до монтирования вашего корневого компонента. Хорошее место для этого - в корневом файле:

```js
import React from 'react';
import ReactDOM from 'react-dom';

import App from './App';

import { init } from '@mntm/router';
import { routes } from './route';

init(routes);

ReactDOM.mount(<App />, document.getElementById('root'));
```

### Хуки

- useRouter: возвращает глобальный роутер.
- useHistory: возвращает глобальную историю.
- usePage: возвращает текущую страницу.
- useParams: возвращает параметры текущей страницы.
- useMemoParams: возвращает параметры страницы с поддержкой swipe back.
- useSubscribe: подписывается на обновления и возвращает текущую страницу.
- useSubscribeOverlay: подписывается на обновления модалок и всплывающих окон и возвращает текущую страницу.
