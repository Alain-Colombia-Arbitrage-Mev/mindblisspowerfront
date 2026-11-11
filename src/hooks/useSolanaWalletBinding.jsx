"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { PublicKey } from "@solana/web3.js";
import { useMemberSession } from "@/lib/member-session-context";
import { personalWalletBalanceSessionKey } from "@/lib/personal-wallet-balance-store.mjs";
import { readSolanaWalletLink, requestSolanaWalletLink } from "@/lib/solana-wallet-link-client.mjs";
import { createReownWalletConnectionRequest } from "@/lib/reown-wallet-connection.mjs";
import { createReownFundingOperation } from "@/lib/reown-funding-operation.mjs";

function address(value) {
  if (typeof value !== "string" || value.length < 32 || value.length > 44) return "";
  try { return new PublicKey(value).toBase58() === value ? value : ""; } catch { return ""; }
}
function providerAddress(provider) {
  try { return address(provider?.publicKey?.toBase58()); } catch { return ""; }
}
function usableProvider(provider, expected) {
  return Boolean(expected) && providerAddress(provider) === expected && typeof provider?.signMessage === "function" && typeof provider?.signTransaction === "function";
}
export function solanaWalletBindingError(failure) {
  if (failure?.name === "AbortError") return "";
  if (failure?.code === 4001 || failure?.code === "ACTION_REJECTED") return "wallet_rejected";
  if (failure?.name === "TimeoutError") return "wallet_connection_timeout";
  return new Set(["unauthenticated", "wallet_challenge_invalid", "wallet_signature_invalid", "wallet_address_in_use", "wallet_already_linked",
    "wallet_identity_unavailable", "wallet_link_rate_limited", "invalid_wallet_address", "invalid_origin", "invalid_request",
    "wallet_address_mismatch", "wallet_not_connected", "wallet_connection_timeout", "solana_wallet_unavailable"]).has(failure?.message)
    ? failure.message : "solana_wallet_unavailable";
}
function signatureBase64(signature) {
  if (!(signature instanceof Uint8Array) || signature.byteLength !== 64) throw new Error("wallet_signature_invalid");
  return btoa(String.fromCharCode(...signature));
}

/** A second, owner-bound namespace. Connection alone never links or transfers funds. */
export function useSolanaWalletBinding({ account, walletProvider, appKitState, open, switchNetwork }) {
  const sessionKey = personalWalletBalanceSessionKey(useMemberSession());
  const currentAddress = address(account?.address);
  const ownerEpoch = useRef({ sessionKey, generation: 0 });
  if (ownerEpoch.current.sessionKey !== sessionKey) ownerEpoch.current = { sessionKey, generation: ownerEpoch.current.generation + 1 };
  const generation = ownerEpoch.current.generation;
  const signerEpoch = useRef({ sessionKey, currentAddress, walletProvider, isConnected: account?.isConnected, generation: 0 });
  if (signerEpoch.current.sessionKey !== sessionKey || signerEpoch.current.currentAddress !== currentAddress || signerEpoch.current.walletProvider !== walletProvider
    || signerEpoch.current.isConnected !== account?.isConnected) {
    signerEpoch.current = { sessionKey, currentAddress, walletProvider, isConnected: account?.isConnected, generation: signerEpoch.current.generation + 1 };
  }
  const signerGeneration = signerEpoch.current.generation;
  const mounted = useRef(false), statusRequest = useRef(null), linkOperation = useRef(null), connectRequest = useRef(null);
  const connectionSnapshot = useRef({ status: "disconnected", modalOpen: false });
  const [binding, setBinding] = useState({ sessionKey, status: sessionKey ? "loading" : "unavailable", address: "", error: "" });
  const [linking, setLinking] = useState(false), [connecting, setConnecting] = useState(false), [verificationError, setVerificationError] = useState("");
  const [restorationTimedOut, setRestorationTimedOut] = useState(false);
  const live = useCallback(() => mounted.current && ownerEpoch.current.generation === generation && Boolean(sessionKey), [generation, sessionKey]);
  const visible = binding.sessionKey === sessionKey;
  const boundAddress = visible && binding.status === "linked" ? binding.address : "";
  const providerReady = account?.isConnected === true && usableProvider(walletProvider, currentAddress);
  const isLinked = providerReady && Boolean(boundAddress) && currentAddress === boundAddress;
  const restoring = appKitState?.initialized === false || appKitState?.loading === true || ["connecting", "reconnecting"].includes(account?.status)
    || (account?.isConnected === true && !providerReady);
  const connectionStatus = providerReady ? boundAddress && boundAddress !== currentAddress ? "mismatch" : "connected"
    : restoring && !restorationTimedOut ? "restoring" : "disconnected";
  connectionSnapshot.current = { status: connectionStatus, modalOpen: appKitState?.open === true };

  useEffect(() => {
    mounted.current = true;
    return () => { mounted.current = false; statusRequest.current?.controller.abort(); linkOperation.current?.scope.cancel(); connectRequest.current?.cancel(); };
  }, []);
  useEffect(() => {
    statusRequest.current?.controller.abort(); statusRequest.current = null;
    linkOperation.current?.scope.cancel(); linkOperation.current = null;
    connectRequest.current?.cancel(); connectRequest.current = null;
    setBinding({ sessionKey, status: sessionKey ? "loading" : "unavailable", address: "", error: "" });
    setLinking(false); setConnecting(false); setVerificationError("");
  }, [sessionKey, generation]);
  useEffect(() => { linkOperation.current?.scope.cancel(); linkOperation.current = null; setLinking(false); setVerificationError(""); }, [signerGeneration]);
  useEffect(() => {
    if (!restoring) { setRestorationTimedOut(false); return undefined; }
    const timer = setTimeout(() => { if (mounted.current) setRestorationTimedOut(true); }, 15_000);
    return () => clearTimeout(timer);
  }, [restoring]);
  useEffect(() => { connectRequest.current?.update(connectionSnapshot.current); }, [connectionStatus, appKitState?.open]);

  const refreshLink = useCallback(() => {
    if (!live()) return Promise.reject(new Error("unauthenticated"));
    if (statusRequest.current?.generation === generation) return statusRequest.current.promise;
    const controller = new AbortController(), operation = { generation, controller, promise: null };
    setBinding(current => ({ ...current, sessionKey, status: "loading", error: "" }));
    operation.promise = readSolanaWalletLink({ signal: controller.signal }).then(value => {
      if (!live() || controller.signal.aborted || statusRequest.current !== operation) throw new DOMException("Aborted", "AbortError");
      if (value.linked && !address(value.address)) throw new Error("solana_wallet_unavailable");
      const next = { sessionKey, status: value.linked ? "linked" : "unlinked", address: value.linked ? value.address : "", error: "" };
      setBinding(next); return next;
    }).catch(failure => {
      if (live() && !controller.signal.aborted && statusRequest.current === operation) {
        setBinding(current => ({ ...current, sessionKey, status: "error", error: solanaWalletBindingError(failure) }));
      }
      throw failure;
    }).finally(() => { if (statusRequest.current === operation) statusRequest.current = null; });
    statusRequest.current = operation; return operation.promise;
  }, [live, generation, sessionKey]);

  useEffect(() => { if (sessionKey) void refreshLink().catch(() => {}); }, [sessionKey, refreshLink]);

  const connectWallet = useCallback(() => {
    if (!live()) return Promise.reject(new Error("unauthenticated"));
    if (connectionSnapshot.current.status === "connected") return Promise.resolve({ connected: true });
    if (connectRequest.current) return connectRequest.current.promise;
    setConnecting(true); setVerificationError("");
    const request = createReownWalletConnectionRequest({ open: () => open({ view: "Connect", namespace: "solana" }),
      onSettled() { if (connectRequest.current === request) { connectRequest.current = null; if (live()) setConnecting(false); } } });
    request.promise = request.promise.catch(failure => {
      if (live() && !connectRequest.current) setVerificationError(solanaWalletBindingError(failure));
      throw failure;
    });
    connectRequest.current = request; return request.promise;
  }, [live, open]);

  const linkWallet = useCallback(() => {
    if (!live()) return Promise.reject(new Error("unauthenticated"));
    if (linkOperation.current) return linkOperation.current.promise;
    const scope = createReownFundingOperation(), operation = { scope, promise: null };
    const assertSigner = () => {
      scope.assertActive();
      if (!live() || signerEpoch.current.generation !== signerGeneration) throw new DOMException("Aborted", "AbortError");
      if (account?.isConnected !== true || !usableProvider(walletProvider, currentAddress)) throw new Error("wallet_address_mismatch");
    };
    setLinking(true); setVerificationError("");
    operation.promise = (async () => {
      assertSigner();
      const previous = !visible || ["loading", "error"].includes(binding.status) ? await scope.wait(refreshLink) : binding;
      assertSigner();
      if (previous.status === "linked") {
        if (previous.address !== currentAddress) throw new Error("wallet_already_linked");
        return { linked: true, address: previous.address };
      }
      const challenge = await scope.wait(() => requestSolanaWalletLink("challenge", { address: currentAddress }, { signal: scope.signal }));
      assertSigner();
      if (challenge?.address !== currentAddress) throw new Error("wallet_address_mismatch");
      let confirmed = challenge;
      if (challenge?.linked !== true) {
        if (typeof challenge.message !== "string" || !challenge.message.length || challenge.message.length > 4096 || !Number.isFinite(Date.parse(challenge.expiresAt))
          || Date.parse(challenge.expiresAt) <= Date.now()) throw new Error("wallet_challenge_invalid");
        const signature = signatureBase64(await scope.wait(() => walletProvider.signMessage(new TextEncoder().encode(challenge.message))));
        assertSigner();
        confirmed = await scope.wait(() => requestSolanaWalletLink("confirm", { challengeId: challenge.challengeId, signature }, { signal: scope.signal }));
        assertSigner();
      }
      if (confirmed?.linked !== true || confirmed.address !== currentAddress) throw new Error("wallet_signature_invalid");
      scope.run(() => {
        setBinding({ sessionKey, status: "linked", address: confirmed.address, error: "" });
        window.dispatchEvent(new Event("vp:personal-solana-wallet-linked"));
      });
      return confirmed;
    })().catch(failure => {
      if (live() && signerEpoch.current.generation === signerGeneration && linkOperation.current === operation) setVerificationError(solanaWalletBindingError(failure));
      throw failure;
    }).finally(() => {
      scope.finish();
      if (linkOperation.current === operation) { linkOperation.current = null; if (live()) setLinking(false); }
    });
    linkOperation.current = operation; return operation.promise;
  }, [live, signerGeneration, account?.isConnected, walletProvider, currentAddress, visible, binding, refreshLink, sessionKey]);

  const getProvider = useCallback(() => {
    if (!live() || signerEpoch.current.generation !== signerGeneration || !isLinked || !usableProvider(walletProvider, boundAddress)) throw new Error("solana_wallet_unavailable");
    return walletProvider;
  }, [live, signerGeneration, isLinked, walletProvider, boundAddress]);
  const changeNetwork = useCallback(async () => {
    if (!live()) throw new Error("unauthenticated");
    await switchNetwork();
  }, [live, switchNetwork]);
  const openAccount = useCallback(() => {
    if (!live()) return Promise.reject(new Error("unauthenticated"));
    return open({ view: providerReady ? "Account" : "Connect", namespace: "solana" });
  }, [live, open, providerReady]);

  return useMemo(() => ({ namespace: "solana", configured: true, address: sessionKey ? currentAddress : "", isConnected: Boolean(sessionKey) && providerReady,
    linkedAddress: boundAddress, linkStatus: visible ? binding.status : sessionKey ? "loading" : "unavailable", linkError: visible ? verificationError || binding.error : "",
    isLinked: Boolean(sessionKey) && isLinked, isLinking: linking, isRestoring: connecting || connectionStatus === "restoring", connectionStatus,
    needsVerification: Boolean(sessionKey) && providerReady && visible && binding.status === "unlinked",
    connectWallet, openConnect: connectWallet, linkWallet, refreshLink, getProvider, switchNetwork: changeNetwork, openAccount,
  }), [sessionKey, currentAddress, providerReady, boundAddress, visible, binding.status, binding.error, verificationError, isLinked, linking, connecting,
    connectionStatus, connectWallet, linkWallet, refreshLink, getProvider, changeNetwork, openAccount]);
}
