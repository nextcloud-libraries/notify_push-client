# @nextcloud/event-bus

[![npm](https://img.shields.io/npm/v/@nextcloud/event-bus.svg)](https://www.npmjs.com/package/@nextcloud/notify_push)

A javascript client for notify_push events for Nextcloud apps.

## Installation

```
npm i -S @nextcloud/notify_push
```

## Usage

```js
import { listen } from '@nextcloud/notify_push'

listen('notify_file', () => {
	console.log('A File has been changed')
})
```
