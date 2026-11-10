"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createAppKit, useAppKit, useAppKitAccount, useAppKitProvider, useAppKitState, useAppKitTheme, useDisconnect } from "@reown/appkit/react";
import { EthersAdapter } from "@reown/appkit-adapter-ethers";
import { OnRampController } from "@reown/appkit-controllers";
import { mainnet, polygon } from "@reown/appkit/networks";
import { BrowserProvider, getAddress } from "ethers";
import { useMemberSession } from "@/lib/member-session-context";
import { browserOnrampRegion } from "@/lib/meld-onramp.mjs";
import { buildReownProductionOnrampUrl } from "@/lib/reown-production-onramp.mjs";
import { createPersonalFundingIntent, fundingRequestId } from "@/lib/wallet-funding-client.mjs";
import { PERSONAL_WALLET_ASSET, PERSONAL_WALLET_MINIMUM_USD } from "@/lib/personal-wallet.mjs";
import { readWalletBinding, walletBindingFailure } from "@/lib/wallet-binding.mjs";
import { ReownContext, useReownWallet } from "./ReownContext";

const projectId = process.env.NEXT_PUBLIC_REOWN_PROJECT_ID?.trim() || "";
const configured = /^[a-f0-9]{32}$/i.test(projectId);

const unavailable = Object.freeze({
  configured: false,
  isConnected: false,
  address: "",
  status: "unavailable",
  linkedAddress: "",
  linkStatus: "unavailable",
  linkError: "configuration",
  isLinked: false,
  isLinking: false,
  onrampStatus: "idle",
  onrampError: "configuration",
  openConnect: async () => { throw new Error("reown_unavailable"); },
  openOnramp: async () => { throw new Error("reown_unavailable"); },
  startOnramp: async () => { throw new Error("reown_unavailable"); },
  reconnectWallet: async () => { throw new Error("reown_unavailable"); },
  linkWallet: async () => { throw new Error("reown_unavailable"); },
  refreshLink: async () => { throw new Error("reown_unavailable"); },
  openAccount: async () => { throw new Error("reown_unavailable"); },
});

if (configured) {
  createAppKit({
    adapters: [new EthersAdapter()],
    projectId,
    networks: [polygon, mainnet],
    defaultNetwork: polygon,
    defaultAccountTypes: { eip155: "eoa" },
    metadata: {
      name: "Mindbliss Power",
      description: "Conecta tu wallet personal y recarga fondos de forma segura.",
      url: "https://app.mindblisspower.com",
      icons: ["https://app.mindblisspower.com/mindbliss/mindbliss-favicon.png"],
    },
    enableEIP6963: true,
    enableInjected: true,
    enableWallets: true,
    enableNetworkSwitch: false,
    enableMobileFullScreen: true,
    allowUnsupportedChain: false,
    allWallets: "SHOW",
    features: {
      email: true,
      socials: ["google", "apple"],
      emailShowWallets: false,
      analytics: false,
      swaps: false,
      send: false,
      receive: false,
      history: false,
      onramp: true,
    },
    themeMode: "dark",
    themeVariables: themeVariables("dark"),
  });
}

export default function ReownProvider({ children }) {
  if (!configured) {
    return <ReownContext.Provider value={unavailable}>{children}</ReownContext.Provider>;
  }

  return <ConfiguredReownProvider>{children}</ConfiguredReownProvider>;
}

function ConfiguredReownProvider({ children }) {
  const { open } = useAppKit();
  const appKitState = useAppKitState();
  const { disconnect } = useDisconnect();
  const account = useAppKitAccount({ namespace: "eip155" });
  const { walletProvider } = useAppKitProvider("eip155");
  const appKitTheme = useAppKitTheme();
  const memberSession = useMemberSession();
  const appKitThemeRef = useRef(appKitTheme);
  appKitThemeRef.current = appKitTheme;
  const [binding, setBinding] = useState({ status: "loading", address: "", error: "" });
  const [isLinking, setIsLinking] = useState(false);
  const [onrampState, setOnrampState] = useState({ status: "idle", error: "" });
  const linking = useRef(null);
  const onrampIntent = useRef(false);
  const onrampFlow = useRef(null);
  const onrampSelection = useRef(null);
  const onrampAbort = useRef(null);
  const mounted = useRef(true);
  const connectModalSeen = useRef(false);
  const bindingRequest = useRef(null);
  const sessionRetryEmail = useRef("");

  useEffect(() => {
    mounted.current = true;
    return () => { mounted.current = false; onrampAbort.current?.abort(); };
  }, []);

  useEffect(() => {
    const root = document.documentElement;
    const syncTheme = () => {
      const mode = root.dataset.theme === "light" ? "light" : "dark";
      appKitThemeRef.current.setThemeMode(mode);
      appKitThemeRef.current.setThemeVariables(themeVariables(mode));
    };

    syncTheme();
    const observer = new MutationObserver(syncTheme);
    observer.observe(root, { attributes: true, attributeFilter: ["data-theme"] });
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    document.body.classList.toggle("vp-appkit-modal-open", appKitState.open === true);
    return () => document.body.classList.remove("vp-appkit-modal-open");
  }, [appKitState.open]);

  const refreshLink = useCallback(() => {
    if (bindingRequest.current) return bindingRequest.current.promise;
    const controller = new AbortController();
    setBinding(current => ({ status: "loading", address: current.address, error: "" }));
    const request = { controller, promise: null };
    request.promise = readWalletBinding({ signal: controller.signal })
      .then(data => {
        const next = data.linked
          ? { status: "linked", address: getAddress(data.address), error: "" }
          : { status: "unlinked", address: "", error: "" };
        setBinding(next);
        return next;
      })
      .catch(error => {
        const failure = walletBindingFailure(error);
        if (failure !== "aborted") setBinding({ status: "error", address: "", error: failure });
        throw error;
      })
      .finally(() => { if (bindingRequest.current === request) bindingRequest.current = null; });
    bindingRequest.current = request;
    return request.promise;
  }, []);

  useEffect(() => {
    void refreshLink().catch(() => {});
    return () => bindingRequest.current?.controller.abort();
  }, [refreshLink]);

  // The dashboard session projection loads independently from AppKit. If the
  // first status read raced session establishment, retry once when that verified
  // projection becomes available instead of leaving the wallet stuck in error.
  useEffect(() => {
    const email = typeof memberSession?.email === "string" ? memberSession.email.trim().toLowerCase() : "";
    if (email && email !== sessionRetryEmail.current && binding.status === "error") {
      sessionRetryEmail.current = email;
      void refreshLink().catch(() => {});
    }
  }, [binding.status, memberSession?.email, refreshLink]);

  useEffect(() => {
    const retryWhenOnline = () => {
      if (binding.status === "error") void refreshLink().catch(() => {});
    };
    window.addEventListener("online", retryWhenOnline);
    return () => window.removeEventListener("online", retryWhenOnline);
  }, [binding.status, refreshLink]);

  const openConnect = useCallback(
    () => open({ view: "Connect", namespace: "eip155" }),
    [open],
  );
  const currentAddress = typeof account.address === "string" && isAddress(account.address) ? getAddress(account.address) : "";
  const boundAddress = binding.status === "linked" && isAddress(binding.address) ? getAddress(binding.address) : "";
  const isLinked = account.isConnected === true && Boolean(currentAddress) && binding.status === "linked"
    && binding.address.toLowerCase() === currentAddress.toLowerCase();

  const linkWallet = useCallback(() => {
    if (linking.current) return linking.current;
    const operation = (async () => {
      if (account.isConnected !== true || !currentAddress || !walletProvider) throw new Error("wallet_not_connected");
      if (binding.status === "linked") {
        if (binding.address.toLowerCase() !== currentAddress.toLowerCase()) throw new Error("wallet_already_linked");
        return { linked: true, address: binding.address };
      }
      setIsLinking(true);
      const challenge = await walletRequest("/api/member/wallet-link/challenge", { address: currentAddress });
      if (challenge.linked === true) {
        if (!sameAddress(challenge.address, currentAddress)) throw new Error("wallet_address_mismatch");
        const linked = { status: "linked", address: getAddress(challenge.address), error: "" };
        setBinding(linked);
        return challenge;
      }
      if (!sameAddress(challenge.address, currentAddress) || typeof challenge.message !== "string"
        || challenge.message.length > 4096 || !/^[0-9a-f-]{36}$/i.test(challenge.challengeId || "")) {
        throw new Error("wallet_challenge_invalid");
      }
      const provider = new BrowserProvider(walletProvider);
      const signer = await provider.getSigner();
      if (!sameAddress(await signer.getAddress(), currentAddress)) throw new Error("wallet_address_mismatch");
      const signature = await signer.signMessage(challenge.message);
      const confirmed = await walletRequest("/api/member/wallet-link/confirm", {
        challengeId: challenge.challengeId,
        signature,
      });
      if (confirmed.linked !== true || !sameAddress(confirmed.address, currentAddress)) throw new Error("wallet_link_unconfirmed");
      setBinding({ status: "linked", address: getAddress(confirmed.address), error: "" });
      return confirmed;
    })().finally(() => {
      linking.current = null;
      setIsLinking(false);
    });
    linking.current = operation;
    return operation;
  }, [account.isConnected, binding.address, binding.status, currentAddress, walletProvider]);

  const runOnramp = useCallback((selection = onrampSelection.current || {}) => {
    if (onrampFlow.current) return onrampFlow.current;
    const operation = (async () => {
      let verifiedAddress = boundAddress;
      if (!verifiedAddress) {
        if (account.isConnected !== true || !currentAddress || !walletProvider) throw new Error("wallet_not_connected");
        setOnrampState({ status: "linking", error: "" });
        const currentBinding = ["loading", "error"].includes(binding.status) ? await refreshLink() : binding;
        if (currentBinding.status === "linked") {
          if (!sameAddress(currentBinding.address, currentAddress)) throw new Error("wallet_already_linked");
          verifiedAddress = getAddress(currentBinding.address);
        } else {
          const confirmed = await linkWallet();
          if (!sameAddress(confirmed?.address, currentAddress)) throw new Error("wallet_link_unconfirmed");
          verifiedAddress = getAddress(confirmed.address);
        }
      }
      if (selection.walletAddress && !sameAddress(selection.walletAddress, verifiedAddress)) {
        throw new Error("wallet_address_mismatch");
      }
      if (!mounted.current) throw new DOMException("Aborted", "AbortError");
      setOnrampState({ status: "opening", error: "" });
      const locale = navigator.languages?.[0] || navigator.language || "";
      const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone || "";
      const countryCode = selection.countryCode || browserOnrampRegion([...(navigator.languages || [locale])], timeZone);
      const provider = OnRampController.state.providers.find(item => item.name === "meld");
      if (!provider) throw new Error("onramp_provider_unavailable");
      OnRampController.setSelectedProvider(provider);
      const controller = new AbortController();
      onrampAbort.current = controller;
      const intent = await createPersonalFundingIntent({
        requestId: selection.requestId || fundingRequestId(), walletAddress: verifiedAddress, country: countryCode,
        amount: selection.amount ?? PERSONAL_WALLET_MINIMUM_USD,
      }, { signal: controller.signal });
      if (controller.signal.aborted || !mounted.current) throw new DOMException("Aborted", "AbortError");
      const checkoutUrl = buildReownProductionOnrampUrl({
        providerUrl: OnRampController.state.selectedProvider?.url,
        address: verifiedAddress,
        projectId,
        checkoutReference: intent.checkoutReference,
        countryCode,
        amount: intent.requestedAmount,
      });
      const checkout = window.open(checkoutUrl, "_blank");
      if (checkout) checkout.opener = null;
      else window.location.assign(checkoutUrl);
      onrampIntent.current = false;
      onrampSelection.current = null;
      setOnrampState({ status: "open", error: "" });
      return { opened: true, provider: "reown", checkoutReference: intent.checkoutReference, asset: PERSONAL_WALLET_ASSET, minimumUsd: PERSONAL_WALLET_MINIMUM_USD };
    })().catch(error => {
      onrampIntent.current = false;
      onrampSelection.current = null;
      setOnrampState({ status: "error", error: onrampErrorCode(error) });
      throw error;
    }).finally(() => {
      onrampFlow.current = null;
      onrampAbort.current = null;
    });
    onrampFlow.current = operation;
    return operation;
  }, [account.isConnected, binding, boundAddress, currentAddress, linkWallet, refreshLink, walletProvider]);

  const openOnramp = useCallback(() => runOnramp(), [runOnramp]);

  const startOnramp = useCallback(async (selection = {}) => {
    onrampSelection.current = selection;
    if (selection.walletAddress && !isAddress(selection.walletAddress)) {
      onrampSelection.current = null;
      setOnrampState({ status: "error", error: "mismatch" });
      throw new Error("wallet_address_mismatch");
    }
    if (boundAddress && selection.walletAddress && !sameAddress(selection.walletAddress, boundAddress)) {
      onrampSelection.current = null;
      setOnrampState({ status: "error", error: "mismatch" });
      throw new Error("wallet_address_mismatch");
    }
    const boundReady = Boolean(boundAddress)
      && (!selection.walletAddress || sameAddress(selection.walletAddress, boundAddress));
    const connectionReady = account.isConnected === true && Boolean(currentAddress) && Boolean(walletProvider);
    setOnrampState({ status: boundReady ? "opening" : connectionReady ? "linking" : "connecting", error: "" });
    if (boundReady || connectionReady) return runOnramp(selection);
    onrampIntent.current = true;
    connectModalSeen.current = false;
    if (account.isConnected === true) return { pending: true };
    try {
      await openConnect();
      return { pending: true };
    } catch (error) {
      onrampIntent.current = false;
      setOnrampState({ status: "error", error: onrampErrorCode(error) });
      throw error;
    }
  }, [account.isConnected, boundAddress, currentAddress, openConnect, runOnramp, walletProvider]);

  const reconnectWallet = useCallback(async () => {
    onrampIntent.current = true;
    connectModalSeen.current = false;
    setOnrampState({ status: "connecting", error: "" });
    try {
      await disconnect({ namespace: "eip155" });
      await openConnect();
      return { pending: true };
    } catch (error) {
      onrampIntent.current = false;
      setOnrampState({ status: "error", error: onrampErrorCode(error) });
      throw error;
    }
  }, [disconnect, openConnect]);

  useEffect(() => {
    if (!onrampIntent.current || account.isConnected !== true || !currentAddress || !walletProvider) return;
    void runOnramp().catch(() => {});
  }, [account.isConnected, currentAddress, runOnramp, walletProvider]);

  useEffect(() => {
    if (!onrampIntent.current || onrampState.status !== "connecting" || account.isConnected !== true
      || (currentAddress && walletProvider)) return;
    const timeout = window.setTimeout(() => {
      if (!onrampIntent.current) return;
      onrampIntent.current = false;
      setOnrampState({ status: "error", error: "connection" });
    }, 10_000);
    return () => window.clearTimeout(timeout);
  }, [account.isConnected, currentAddress, onrampState.status, walletProvider]);

  useEffect(() => {
    if (!onrampIntent.current || onrampState.status !== "connecting") return;
    if (appKitState.open) {
      connectModalSeen.current = true;
      return;
    }
    if (connectModalSeen.current && account.isConnected !== true) {
      onrampIntent.current = false;
      connectModalSeen.current = false;
      setOnrampState({ status: "idle", error: "" });
    }
  }, [account.isConnected, appKitState.open, onrampState.status]);
  const openAccount = useCallback(
    () => open({ view: account.isConnected ? "Account" : "Connect", namespace: "eip155" }),
    [account.isConnected, open],
  );

  const value = useMemo(() => ({
    configured: true,
    isConnected: account.isConnected === true,
    address: currentAddress,
    status: account.status || "disconnected",
    linkedAddress: binding.address,
    linkStatus: binding.status,
    linkError: binding.error,
    isLinked,
    isLinking,
    onrampStatus: onrampState.status,
    onrampError: onrampState.error,
    openConnect,
    openOnramp,
    startOnramp,
    reconnectWallet,
    linkWallet,
    refreshLink,
    openAccount,
  }), [account.isConnected, account.status, binding.address, binding.error, binding.status, currentAddress, isLinked, isLinking,
    linkWallet, onrampState.error, onrampState.status,
    openAccount, openConnect, openOnramp, reconnectWallet, refreshLink, startOnramp]);

  return <ReownContext.Provider value={value}>{children}</ReownContext.Provider>;
}

function themeVariables(mode) {
  return {
    "--apkt-font-family": "Manrope, ui-sans-serif, system-ui, sans-serif",
    "--apkt-accent": "#4959E8",
    "--apkt-color-mix": mode === "light" ? "#EBF2F4" : "#20333F",
    "--apkt-color-mix-strength": mode === "light" ? 18 : 30,
    "--apkt-border-radius-master": "4px",
    "--apkt-z-index": 10000,
  };
}

export { useReownWallet };

function isAddress(value) {
  return typeof value === "string" && /^0x[a-f0-9]{40}$/i.test(value);
}

function sameAddress(left, right) {
  return isAddress(left) && isAddress(right) && left.toLowerCase() === right.toLowerCase();
}

async function walletRequest(path, body) {
  const response = await fetch(path, {
    method: "POST",
    credentials: "same-origin",
    cache: "no-store",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(typeof data?.error === "string" ? data.error : "wallet_link_unavailable");
  return data;
}

function onrampErrorCode(error) {
  const message = typeof error?.message === "string" ? error.message.toLowerCase() : "";
  if (message.includes("wallet_already_linked") || message.includes("wallet_address_mismatch")
    || message.includes("wallet_address_in_use")) return "mismatch";
  if (message.includes("unauthenticated")) return "session";
  if (message.includes("invalid_origin")) return "origin";
  if (message.includes("user rejected") || message.includes("action_rejected") || message.includes("denied")) return "rejected";
  if (message.includes("wallet_not_connected") || message.includes("provider is undefined")) return "connection";
  if (message.includes("reown_unavailable")) return "configuration";
  return "provider";
}
