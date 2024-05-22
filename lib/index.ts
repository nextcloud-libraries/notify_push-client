import {getCapabilities} from '@nextcloud/capabilities';
import axios from '@nextcloud/axios'
import {subscribe} from '@nextcloud/event-bus'

declare global {
	interface Window {
		_notify_push_listeners: { [event: string]: ((string, any) => void)[] },
		_notify_push_ws: WebSocket | null | true,
		_notify_push_online: boolean,
		_notify_push_available: boolean,
		_notify_push_error_count: number,
	}
}

type NotifyPushOptions = {
	credentials?: {
		username: string,
		password: string,
	}
}

/**
 * Get the list of supported notification types as reported by the server
 *
 * @return string[]
 */
export function getSupportedTypes(): string[] {
	const capabilities = getCapabilities() as Capabilities;

	if (capabilities.notify_push) {
		return capabilities.notify_push.type
	} else {
		return [];
	}
}

/**
 * Register a listener for notify_push events
 *
 * @param name name of the event
 * @param handler callback invoked for every matching event pushed
 * @param [options]
 * @param [options.credentials] optional credentials used instead of the pre_auth request
 * @param [options.credentials.username] username
 * @param [options.credentials.password] app password
 * @return boolean whether push is set up correctly
 */
export function listen(name: string, handler: (string, any) => void, options: NotifyPushOptions = {}): boolean {
	setupGlobals(options);

	if (!window._notify_push_listeners[name]) {
		window._notify_push_listeners[name] = []
	}

	window._notify_push_listeners[name].push(handler);
	if (window._notify_push_ws !== null && typeof window._notify_push_ws === "object") {
		window._notify_push_ws.send('listen ' + name);
	} else {
		setupSocket(options);
	}

	return window._notify_push_available;
}

function setupGlobals(options: NotifyPushOptions = {}) {
	if (typeof window._notify_push_listeners === "undefined") {
		window._notify_push_listeners = {};
		window._notify_push_ws = null;
		window._notify_push_online = true;
		window._notify_push_available = false;
		window._notify_push_error_count = 0;

		subscribe('networkOffline', () => {
			window._notify_push_online = false;
			window._notify_push_ws = null;
		});
		subscribe('networkOnline', () => {
			window._notify_push_error_count = 0;
			window._notify_push_online = true;
			setupSocket(options);
		});
	}
}

interface Capabilities {
	notify_push?: {
		type: string[],
		endpoints: {
			pre_auth: string,
			websocket: string,
		}
	}
}

async function setupSocket(options: NotifyPushOptions = {}) {
	if (window._notify_push_ws) {
		return true;
	}
	window._notify_push_ws = true;

	const capabilities = getCapabilities() as Capabilities;
	if (!capabilities.notify_push) {
		window._notify_push_available = false;
		window._notify_push_ws = null;
		return false;
	}
	window._notify_push_available = true;

	let preAuth: string
	if (!options.credentials) {
		const response = await axios.post(capabilities.notify_push.endpoints.pre_auth)
		preAuth = response.data
	}

	window._notify_push_ws = new WebSocket(capabilities.notify_push.endpoints.websocket)
	window._notify_push_ws.onopen = () => {
		if (typeof window._notify_push_ws === "object" && window._notify_push_ws) {
			if (preAuth) {
				window._notify_push_ws.send('')
				window._notify_push_ws.send(preAuth)
			} else if (options.credentials) {
				window._notify_push_ws.send(options.credentials.username)
				window._notify_push_ws.send(options.credentials.password)
			}

			for (let name in window._notify_push_listeners) {
				window._notify_push_ws.send('listen ' + name);
			}
		}
	}

	window._notify_push_ws.onmessage = message => {
		if (message.data === "authenticated") {
			window._notify_push_error_count = 0;
		} else {
			const i = message.data.indexOf(' ');
			let [event, body] = i > 0 ? [message.data.slice(0, i), message.data.slice(i + 1)] : [message.data, null];
			if (body) {
				body = JSON.parse(body);
			}

			if (window._notify_push_listeners[event]) {
				for (let cb of window._notify_push_listeners[event]) {
					cb(event, body);
				}
			}
		}
	}

	window._notify_push_ws.onerror = window._notify_push_ws.onclose = () => {
		window._notify_push_ws = null;
		window._notify_push_error_count += 1;

		setTimeout(() => {
			if (window._notify_push_online) {
				setupSocket(options);
			}
		}, 1000 * window._notify_push_error_count);
	}

	return true;
}
