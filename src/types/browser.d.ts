interface Window {
  __mindblissChatwootLoaded?: boolean;
  chatwootSettings?: { position: string; type: string; launcherTitle: string; hideMessageBubble?: boolean };
  chatwootSDK?: { run(options: { websiteToken: string; baseUrl: string }): void };
  $chatwoot?: { toggle(state?: "open" | "close"): void };
}
