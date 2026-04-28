/*
 * SPDX-FileCopyrightText: 2021 Nextcloud GmbH and Nextcloud contributors
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

declare global {
	interface Window {
		_notify_push_listeners: { [event: string]: ((string, any) => void)[] },
		_notify_push_ws: WebSocket | null | true,
		_notify_push_online: boolean,
		_notify_push_available: boolean,
		_notify_push_error_count: number,
		_notify_push_ready: boolean,
	}
}

export {}
