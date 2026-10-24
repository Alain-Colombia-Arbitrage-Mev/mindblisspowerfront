interface Window {
  __mindblissChatwootLoaded?: boolean;
  chatwootSettings?: { position: string; type: string; launcherTitle: string };
  chatwootSDK?: { run(options: { websiteToken: string; baseUrl: string }): void };
}
