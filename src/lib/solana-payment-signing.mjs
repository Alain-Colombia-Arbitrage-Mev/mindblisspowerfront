import { Transaction, PublicKey, SystemProgram } from '@solana/web3.js';
import { getAssociatedTokenAddressSync, decodeTransferCheckedInstruction, TOKEN_PROGRAM_ID, ASSOCIATED_TOKEN_PROGRAM_ID } from '@solana/spl-token';
import { SOLANA_PERSONAL_WALLET, solanaPaymentView, canonicalBase64 } from './solana-wallet-contract.mjs';

const binary = value => Uint8Array.from(atob(value), char => char.charCodeAt(0));
const base64 = value => btoa(String.fromCharCode(...value));
async function messageHash(transaction) {
  const hash = await crypto.subtle.digest('SHA-256', new Uint8Array(transaction.serializeMessage()));
  return [...new Uint8Array(hash)].map(byte => byte.toString(16).padStart(2, '0')).join('');
}
const same = (key, value) => key?.toBase58() === value;
function validateInstructions(transaction, payment) {
  const policy = SOLANA_PERSONAL_WALLET;
  const source = getAssociatedTokenAddressSync(new PublicKey(policy.mintAddress), new PublicKey(payment.walletAddress)).toBase58();
  if (source !== payment.sourceTokenAccount || transaction.instructions.length < 1 || transaction.instructions.length > 2) throw new Error('solana_payment_transaction_mismatch');
  const transfer = transaction.instructions.at(-1);
  let decoded;
  try { decoded = decodeTransferCheckedInstruction(transfer, TOKEN_PROGRAM_ID); } catch { throw new Error('solana_payment_transaction_mismatch'); }
  if (transfer.keys.length !== 4 || !same(decoded.keys.source.pubkey, source) || !same(decoded.keys.mint.pubkey, policy.mintAddress)
    || !same(decoded.keys.destination.pubkey, policy.destinationTokenAccount) || !same(decoded.keys.owner.pubkey, payment.walletAddress)
    || !decoded.keys.owner.isSigner || decoded.keys.multiSigners.length || decoded.data.decimals !== 6 || decoded.data.amount !== BigInt(payment.amountAtomic)) throw new Error('solana_payment_transaction_mismatch');
  if (transaction.instructions.length === 2) {
    const create = transaction.instructions[0];
    const accounts = [payment.feePayerAddress, policy.destinationTokenAccount, policy.recipientAddress, policy.mintAddress,
      SystemProgram.programId.toBase58(), TOKEN_PROGRAM_ID.toBase58()];
    if (!create.programId.equals(ASSOCIATED_TOKEN_PROGRAM_ID) || create.data.length !== 1 || create.data[0] !== 1 || create.keys.length !== accounts.length
      || create.keys.some((key, index) => !same(key.pubkey, accounts[index])) || !create.keys[0].isSigner) throw new Error('solana_payment_transaction_mismatch');
  }
}
/** Read the immutable server-built message; no wallet method or RPC is called. */
export async function inspectSolanaPayment(value, expectedWallet) {
  const payment = solanaPaymentView(value);
  if (!payment || payment.status !== 'prepared' || !payment.transactionBase64 || payment.walletAddress !== expectedWallet
    || Date.parse(payment.expiresAt) <= Date.now()) throw new Error('solana_payment_expired');
  let transaction;
  try { transaction = Transaction.from(binary(payment.transactionBase64)); } catch { throw new Error('solana_payment_transaction_mismatch'); }
  if (!same(transaction.feePayer, payment.feePayerAddress) || transaction.recentBlockhash !== payment.blockhash
    || transaction.signatures.length !== 2 || !same(transaction.signatures[0].publicKey, payment.feePayerAddress)
    || !same(transaction.signatures[1].publicKey, expectedWallet) || transaction.signatures.some(item => item.signature !== null)
    || await messageHash(transaction) !== payment.messageHash) throw new Error('solana_payment_transaction_mismatch');
  validateInstructions(transaction, payment);
  return { transaction, payment };
}
/** Explicit send click only: exactly one owner signature, no provider broadcast. */
export async function signSolanaPayment(value, provider, expectedWallet, assertActive = () => {}) {
  const { transaction, payment } = await inspectSolanaPayment(value, expectedWallet);
  assertActive();
  if (!same(provider?.publicKey, expectedWallet) || typeof provider.signTransaction !== 'function') throw new Error('solana_payment_wallet_not_linked');
  const signed = await provider.signTransaction(transaction);
  assertActive();
  if (!same(provider?.publicKey, expectedWallet) || !signed || typeof signed.serializeMessage !== 'function' || await messageHash(signed) !== payment.messageHash
    || signed.signatures.length !== 2 || !same(signed.signatures[0].publicKey, payment.feePayerAddress) || signed.signatures[0].signature !== null
    || !same(signed.signatures[1].publicKey, expectedWallet) || signed.signatures[1].signature?.length !== 64 || !signed.verifySignatures(false)) throw new Error('solana_payment_transaction_mismatch');
  assertActive();
  const transactionBase64 = base64(signed.serialize({ requireAllSignatures: false, verifySignatures: true }));
  if (!canonicalBase64(transactionBase64, { maxBytes: 1232 })) throw new Error('solana_payment_transaction_mismatch');
  return { paymentId: payment.paymentId, transactionBase64 };
}
