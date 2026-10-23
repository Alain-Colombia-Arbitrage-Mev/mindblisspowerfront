const isNode = typeof window === 'undefined';
const legacyEnv = import.meta.env ?? {};

const toSnakeCase = (str) => {
	return str.replace(/([A-Z])/g, '_$1').toLowerCase();
}

const getAppParamValue = (paramName, { defaultValue = undefined, removeFromUrl = false } = {}) => {
	if (isNode) {
		return defaultValue;
	}
	const storageKey = `base44_${toSnakeCase(paramName)}`;
	const urlParams = new URLSearchParams(window.location.search);
	const searchParam = urlParams.get(paramName);
	if (removeFromUrl) {
		urlParams.delete(paramName);
		const newUrl = `${window.location.pathname}${urlParams.toString() ? `?${urlParams.toString()}` : ""
			}${window.location.hash}`;
		window.history.replaceState({}, document.title, newUrl);
	}
	const value = searchParam || defaultValue;
	try {
		const storage = window.localStorage;
		if (value) {
			storage.setItem(storageKey, value);
			return value;
		}
		return storage.getItem(storageKey) || null;
	} catch {
		// Private browsing or a full storage quota must not prevent rendering.
		return value || null;
	}
}

const getAppParams = () => {
	if (getAppParamValue("clear_access_token") === 'true') {
		try {
			window.localStorage.removeItem('base44_access_token');
			window.localStorage.removeItem('token');
		} catch {
			// Storage may be disabled in the browser.
		}
	}
	return {
		appId: getAppParamValue("app_id", { defaultValue: legacyEnv.VITE_BASE44_APP_ID }),
		token: getAppParamValue("access_token", { removeFromUrl: true }),
		fromUrl: getAppParamValue("from_url", { defaultValue: isNode ? undefined : window.location.href }),
		functionsVersion: getAppParamValue("functions_version", { defaultValue: legacyEnv.VITE_BASE44_FUNCTIONS_VERSION }),
		appBaseUrl: getAppParamValue("app_base_url", { defaultValue: legacyEnv.VITE_BASE44_APP_BASE_URL }),
	}
}


export const appParams = {
	...getAppParams()
}
