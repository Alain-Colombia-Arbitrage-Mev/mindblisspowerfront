"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createAppKit, useAppKit, useAppKitAccount, useAppKitProvider, useAppKitState, useAppKitTheme, useDisconnect } from "@reown/appkit/react";
import { EthersAdapter } from "@reown/appkit-adapter-ethers";
import { OnRampController } from "@reown/appkit-controllers";
import { mainnet, polygon } from "@reown/appkit/networks";
import { BrowserProvider, getAddress } from "ethers";
import { useMemberSession } from "@/lib/member-session-context";
import { browserOnrampRegion } from "@/lib/browser-onramp-region.mjs";
import { buildReownProductionOnrampUrl, reownFundingSelection } from "@/lib/reown-production-onramp.mjs";
import { createPersonalFundingIntent, fundingRequestId } from "@/lib/wallet-funding-client.mjs";
import { PERSONAL_WALLET_ASSET, PERSONAL_WALLET_MINIMUM_USD } from "@/lib/personal-wallet.mjs";
import { readWalletBinding, requestWalletLink, walletBindingFailure } from "@/lib/wallet-binding.mjs";
import { personalFundingFailure } from "@/lib/personal-funding-errors.mjs";
import { createReownFundingOperation, verifyReownWalletOwnership } from "@/lib/reown-funding-operation.mjs";
import { ReownContext, useReownWallet } from "./ReownContext";

const projectId = process.env.NEXT_PUBLIC_REOWN_PROJECT_ID?.trim() || "";
const configured = /^[a-f0-9]{32}$/i.test(projectId);
const initialWalletTheme = typeof document !== 'undefined' && document.documentElement.dataset.theme === 'dark' ? 'dark' : 'light';

function detectPersonalFundingCountry() {
  const locale = navigator.languages?.[0] || navigator.language || '';
  const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone || '';
  return browserOnrampRegion([...(navigator.languages || [locale])], timeZone);
}

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
  fundingRevision: 0,
  openConnect: async () => { throw new Error("reown_unavailable"); },
  openOnramp: async () => { throw new Error("reown_unavailable"); },
  startOnramp: async () => { throw new Error("reown_unavailable"); },
  cancelOnramp: () => {},
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
      // Funding starts in Mindbliss's country/method-validated, recorded flow.
      onramp: false,
    },
    themeMode: initialWalletTheme,
    themeVariables: themeVariables(initialWalletTheme),
  });
}

export default function ReownProvider({ children }) {
  if (!configured) {
    return <ReownContext.Provider value={unavailable}>{children}</ReownContext.Provider>;
  }

  return <ConfiguredReownProvider>{children}</ConfiguredReownProvider>;
}

function ConfiguredReownProvider({ children }) {
  const { open, close } = useAppKit();
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
  const [verificationError, setVerificationError] = useState("");
  const [fundingRevision, setFundingRevision] = useState(0);
  const [onrampState, setOnrampState] = useState({ status: "idle", error: "" });
  const linking = useRef(null);
  const onrampIntent = useRef(false);
  const onrampFlow = useRef(null);
  const onrampSelection = useRef(null);
  const onrampOperation = useRef(null);
  const linkingOperation = useRef(null);
  const mounted = useRef(true);
  const connectModalSeen = useRef(false);
  const bindingRequest = useRef(null);
  const sessionRetryEmail = useRef("");

  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
      onrampOperation.current?.cancel();
      linkingOperation.current?.cancel();
    };
  }, []);

  useEffect(() => {
    const root = document.documentElement;
    const syncTheme = () => {
      const mode = root.dataset.theme === "dark" ? "dark" : "light";
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
        if (controller.signal.aborted || !mounted.current) throw new DOMException("Aborted", "AbortError");
        setBinding(next);
        return next;
      })
      .catch(error => {
        const failure = walletBindingFailure(error);
        if (failure !== "aborted" && mounted.current) setBinding(current => ({ status: "error", address: current.address, error: failure }));
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

  const beginOnrampOperation = useCallback(() => {
    if (onrampOperation.current?.active) return onrampOperation.current;
    const scope = createReownFundingOperation({ onStop(error) {
      if (onrampOperation.current !== scope) return;
      onrampOperation.current = null;
      onrampFlow.current = null;
      onrampIntent.current = false;
      onrampSelection.current = null;
      connectModalSeen.current = false;
      if (linkingOperation.current === scope) {
        linkingOperation.current = null;
        linking.current = null;
      }
      if (!mounted.current) return;
      setIsLinking(false);
      setVerificationError("");
      setOnrampState(error.name === "TimeoutError"
        ? { status: "error", error: "connection_timeout" } : { status: "idle", error: "" });
    } });
    onrampOperation.current = scope;
    return scope;
  }, []);

  const cancelOnramp = useCallback(() => {
    const ownsModal = onrampIntent.current && appKitState.open === true;
    const pendingLink = linkingOperation.current;
    const pendingFunding = onrampOperation.current;
    pendingFunding?.cancel();
    if (pendingLink !== pendingFunding) pendingLink?.cancel();
    if (ownsModal) {
      try { void Promise.resolve(close()).catch(() => {}); } catch { /* SDK UI cleanup does not disconnect or unlink a wallet. */ }
    }
  }, [appKitState.open, close]);

  const openConnect = useCallback(async (parentOperation) => {
    const scope = parentOperation || beginOnrampOperation();
    try { return await scope.wait(() => open({ view: "Connect", namespace: "eip155" })); }
    finally {
      if (!parentOperation && onrampOperation.current === scope) {
        scope.finish(); onrampOperation.current = null;
      }
    }
  }, [beginOnrampOperation, open]);
  const currentAddress = typeof account.address === "string" && isAddress(account.address) ? getAddress(account.address) : "";
  const boundAddress = binding.status === "linked" && isAddress(binding.address) ? getAddress(binding.address) : "";
  const isLinked = account.isConnected === true && Boolean(currentAddress) && binding.status === "linked"
    && binding.address.toLowerCase() === currentAddress.toLowerCase();

  const linkWallet = useCallback((parentOperation) => {
    if (linking.current) return linking.current;
    const scope = parentOperation || beginOnrampOperation();
    linkingOperation.current = scope;
    const operation = (async () => {
      scope.assertActive();
      setVerificationError("");
      if (account.isConnected !== true || !currentAddress || !walletProvider) throw new Error("wallet_not_connected");
      if (binding.status === "linked") {
        if (binding.address.toLowerCase() !== currentAddress.toLowerCase()) throw new Error("wallet_already_linked");
        return { linked: true, address: binding.address };
      }
      setIsLinking(true);
      return await verifyReownWalletOwnership(scope, {
        address: currentAddress, requestLink: requestWalletLink,
        createSigner: () => new BrowserProvider(walletProvider).getSigner(),
        onLinked(address) {
          if (!mounted.current) throw new DOMException("Aborted", "AbortError");
          setBinding({ status: "linked", address: getAddress(address), error: "" });
          window.dispatchEvent(new Event('vp:personal-wallet-linked'));
        },
      });
    })().catch(error => {
      if (linkingOperation.current === scope && mounted.current) setVerificationError(personalFundingFailure(error, 'link'));
      throw error;
    }).finally(() => {
      if (linking.current === operation) {
        linking.current = null;
        linkingOperation.current = null;
        if (mounted.current) setIsLinking(false);
      }
      if (!parentOperation && onrampOperation.current === scope) {
        scope.finish(); onrampOperation.current = null;
      }
    });
    linking.current = operation;
    return operation;
  }, [account.isConnected, beginOnrampOperation, binding.address, binding.status, currentAddress, walletProvider]);

  const runOnramp = useCallback((selection = onrampSelection.current || {}) => {
    let context;
    try {
      context = reownFundingSelection(selection, detectPersonalFundingCountry);
    } catch (error) {
      setOnrampState({ status: "error", error: personalFundingFailure(error) });
      return Promise.reject(error);
    }
    selection = Object.freeze({ ...selection });
    const { sourceCurrencyCode, countryCode } = context;
    if (onrampFlow.current) return onrampFlow.current;
    const scope = beginOnrampOperation();
    let phase = 'link';
    const operation = (async () => {
      scope.assertActive();
      if (!/^[A-Z0-9_]{2,40}$/.test(selection.paymentMethodType || '')) throw new Error('wallet_funding_method_unavailable');
      let verifiedAddress = boundAddress;
      if (!verifiedAddress) {
        if (account.isConnected !== true || !currentAddress || !walletProvider) throw new Error("wallet_not_connected");
        setOnrampState({ status: "linking", error: "" });
        const currentBinding = ["loading", "error"].includes(binding.status) ? await scope.wait(() => refreshLink()) : binding;
        scope.assertActive();
        if (currentBinding.status === "linked") {
          if (!sameAddress(currentBinding.address, currentAddress)) throw new Error("wallet_already_linked");
          verifiedAddress = getAddress(currentBinding.address);
        } else {
          const confirmed = await scope.wait(() => linkWallet(scope));
          if (!sameAddress(confirmed?.address, currentAddress)) throw new Error("wallet_link_unconfirmed");
          verifiedAddress = getAddress(confirmed.address);
        }
      }
      scope.assertActive();
      if (selection.walletAddress && !sameAddress(selection.walletAddress, verifiedAddress)) {
        throw new Error("wallet_address_mismatch");
      }
      if (!mounted.current) throw new DOMException("Aborted", "AbortError");
      setOnrampState({ status: "opening", error: "" });
      const provider = OnRampController.state.providers.find(item => item.name === "meld");
      if (!provider) throw new Error("onramp_provider_unavailable");
      OnRampController.setSelectedProvider(provider);
      phase = 'intent';
      const requestId = selection.requestId || fundingRequestId();
      const requestedAmount = selection.amount ?? PERSONAL_WALLET_MINIMUM_USD;
      const intent = await scope.wait(() => createPersonalFundingIntent({
        requestId, walletAddress: verifiedAddress, country: countryCode,
        sourceCurrencyCode,
        amount: requestedAmount,
        paymentMethodType: selection.paymentMethodType,
      }, { signal: scope.signal }));
      scope.assertActive();
      if (!mounted.current) throw new DOMException("Aborted", "AbortError");
      if (intent.checkoutReference !== requestId || intent.requestedAmount !== requestedAmount
        || (intent.sourceCurrencyCode ?? 'USD') !== sourceCurrencyCode || intent.paymentMethodType !== selection.paymentMethodType) {
        throw new Error('wallet_funding_invalid_acknowledgement');
      }
      setFundingRevision(current => current + 1);
      phase = 'checkout';
      const checkoutUrl = buildReownProductionOnrampUrl({
        providerUrl: OnRampController.state.selectedProvider?.url,
        address: verifiedAddress,
        projectId,
        checkoutReference: intent.checkoutReference,
        countryCode,
        sourceCurrencyCode,
        amount: intent.requestedAmount,
        paymentMethodType: intent.paymentMethodType,
        allowedProviders: intent.allowedProviders,
      });
      scope.run(() => {
        const checkout = window.open(checkoutUrl, "_blank");
        if (checkout) checkout.opener = null;
        else window.location.assign(checkoutUrl);
      });
      onrampIntent.current = false;
      onrampSelection.current = null;
      setOnrampState({ status: "open", error: "" });
      return { opened: true, provider: "reown", checkoutReference: intent.checkoutReference, asset: PERSONAL_WALLET_ASSET,
        sourceCurrencyCode, minimumUsd: sourceCurrencyCode === 'USD' ? PERSONAL_WALLET_MINIMUM_USD : null };
    })().catch(error => {
      if (onrampOperation.current === scope) {
        onrampIntent.current = false;
        onrampSelection.current = null;
        if (mounted.current) setOnrampState({ status: "error", error: personalFundingFailure(error, phase) });
      }
      throw error;
    }).finally(() => {
      if (onrampFlow.current === operation) onrampFlow.current = null;
      if (onrampOperation.current === scope) {
        scope.finish(); onrampOperation.current = null;
      }
    });
    onrampFlow.current = operation;
    return operation;
  }, [account.isConnected, beginOnrampOperation, binding, boundAddress, currentAddress, linkWallet, refreshLink, walletProvider]);

  const openOnramp = useCallback(() => runOnramp(), [runOnramp]);

  const startOnramp = useCallback(async (selection = {}) => {
    try {
      reownFundingSelection(selection, detectPersonalFundingCountry);
    } catch (error) {
      setOnrampState({ status: "error", error: personalFundingFailure(error) });
      throw error;
    }
    if (onrampOperation.current?.active) return onrampFlow.current || { pending: true };
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
    const scope = beginOnrampOperation();
    onrampSelection.current = { ...selection };
    setOnrampState({ status: boundReady ? "opening" : connectionReady ? "linking" : "connecting", error: "" });
    if (boundReady || connectionReady) return runOnramp(selection);
    onrampIntent.current = true;
    connectModalSeen.current = false;
    if (account.isConnected === true) return { pending: true };
    try {
      await openConnect(scope);
      scope.assertActive();
      return { pending: true };
    } catch (error) {
      if (onrampOperation.current === scope) {
        onrampIntent.current = false;
        onrampSelection.current = null;
        scope.finish(); onrampOperation.current = null;
        if (mounted.current) setOnrampState({ status: "error", error: onrampErrorCode(error) });
      }
      throw error;
    }
  }, [account.isConnected, beginOnrampOperation, boundAddress, currentAddress, openConnect, runOnramp, walletProvider]);

  const reconnectWallet = useCallback(async () => {
    if (onrampOperation.current?.active) return onrampFlow.current || { pending: true };
    const scope = beginOnrampOperation();
    onrampIntent.current = true;
    connectModalSeen.current = false;
    setOnrampState({ status: "connecting", error: "" });
    try {
      await scope.wait(() => disconnect({ namespace: "eip155" }));
      await openConnect(scope);
      scope.assertActive();
      return { pending: true };
    } catch (error) {
      if (onrampOperation.current === scope) {
        onrampIntent.current = false;
        onrampSelection.current = null;
        scope.finish(); onrampOperation.current = null;
        if (mounted.current) setOnrampState({ status: "error", error: onrampErrorCode(error) });
      }
      throw error;
    }
  }, [beginOnrampOperation, disconnect, openConnect]);

  useEffect(() => {
    if (!onrampIntent.current || account.isConnected !== true || !currentAddress || !walletProvider) return;
    void runOnramp().catch(() => {});
  }, [account.isConnected, currentAddress, runOnramp, walletProvider]);

  useEffect(() => {
    if (!onrampIntent.current || onrampState.status !== "connecting") return;
    if (appKitState.open) {
      connectModalSeen.current = true;
      return;
    }
    if (connectModalSeen.current && account.isConnected !== true) {
      cancelOnramp();
    }
  }, [account.isConnected, appKitState.open, cancelOnramp, onrampState.status]);
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
    linkError: verificationError || binding.error,
    isLinked,
    isLinking,
    onrampStatus: onrampState.status,
    onrampError: onrampState.error,
    fundingRevision,
    openConnect,
    openOnramp,
    startOnramp,
    cancelOnramp,
    reconnectWallet,
    linkWallet,
    refreshLink,
    openAccount,
  }), [account.isConnected, account.status, binding.address, binding.error, binding.status, currentAddress, isLinked, isLinking,
    linkWallet, verificationError, fundingRevision, onrampState.error, onrampState.status,
    cancelOnramp, openAccount, openConnect, openOnramp, reconnectWallet, refreshLink, startOnramp]);

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

function onrampErrorCode(error) {
  return personalFundingFailure(error);
}
