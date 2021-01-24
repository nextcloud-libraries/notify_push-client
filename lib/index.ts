import { getCapabilities } from '@nextcloud/capabilities';
import axios from '@nextcloud/axios'
import { subscribe } from '@nextcloud/event-bus'

declare global {
	interface Window {
		_notify_push_listeners: { [event: string] : ((string) => void)[] },
		_notify_push_ws: WebSocket | null | true,
		_notify_push_online: boolean,
		_notify_push_available: boolean,
	}
}

/**
 * Register a listener for notify_push events
 *
 * @param name name of the event
 * @param handler callback invoked for every matching event pushed
 * @return boolean whether or not push is setup correctly
 */
export function listen(name: string, handler: (string) => void): boolean {
	setupGlobals();

	if (!window._notify_push_listeners[name]) {
		window._notify_push_listeners[name] = []
	}

	window._notify_push_listeners[name].push(handler);
	setupSocket();

	return window._notify_push_available;
}

function setupGlobals() {
	if (typeof window._notify_push_listeners === "undefined") {
		window._notify_push_listeners = {};
		window._notify_push_ws = null;
		window._notify_push_online = true;
		window._notify_push_available = false;

		subscribe('networkOffline', () => {
			window._notify_push_online = false;
			window._notify_push_ws = null;
		});
		subscribe('networkOnline', () => {
			window._notify_push_online = true;
			setupSocket();
		});
	}
}

interface Capabilities {
	notify_push?: {
		endpoints: {
			pre_auth: string,
			websocket: string,
		}
	}
}


async function setupSocket() {
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

	const response = await axios.post(capabilities.notify_push.endpoints.pre_auth);

	window._notify_push_ws = new WebSocket(capabilities.notify_push.endpoints.websocket)
	window._notify_push_ws.onopen = () => {
		if (typeof window._notify_push_ws === "object" && window._notify_push_ws) {
			window._notify_push_ws.send('')
			window._notify_push_ws.send(response.data)
		}
	}

	window._notify_push_ws.onmessage = message => {
		const event = message.data;

		if (window._notify_push_listeners[event]) {
			for (let cb of window._notify_push_listeners[event]) {
				cb(event);
			}
		}
	}

	window._notify_push_ws.onerror = window._notify_push_ws.onclose = () => {
		window._notify_push_ws = null;

		setTimeout(() => {
			if (window._notify_push_online) {
				setupSocket();
			}
		}, 1000);
	}

	return true;
}
