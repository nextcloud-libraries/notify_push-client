<!--
  - SPDX-FileCopyrightText: 2021 Nextcloud GmbH and Nextcloud contributors
  - SPDX-License-Identifier: AGPL-3.0-or-later
-->
# @nextcloud/notify_push

[![REUSE status](https://api.reuse.software/badge/github.com/nextcloud-libraries/notify_push-client)](https://api.reuse.software/info/github.com/nextcloud-libraries/notify_push-client)
[![npm](https://img.shields.io/npm/v/@nextcloud/notify_push.svg)](https://www.npmjs.com/package/@nextcloud/notify_push)

A javascript client for notify_push events for Nextcloud apps.

## Installation

```sh
npm i @nextcloud/notify_push
```

## Usage

```js
import { listen } from '@nextcloud/notify_push'

// Using pre_auth request for web apps
listen('notify_file', () => {
	console.log('A File has been changed')
})

// Using credentials for clients
listen('notify_file', () => {
  console.log('A File has been changed')
}, {
  credentials: {
    username: 'alice',
    password: 'app-password',
  },
})
```
