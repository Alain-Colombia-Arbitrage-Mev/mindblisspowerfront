'use client';

import { useEffect, useState } from 'react';
import { nowpaymentsOrderId, startNOWPaymentsReceiptPolling } from '@/lib/nowpayments-receipt.mjs';

export function useNOWPaymentsReceipt(orderId) {
  const [snapshot, setSnapshot] = useState(() => ({ orderId, receipt: null }));
  useEffect(() => {
    setSnapshot({ orderId, receipt: null });
    if (!nowpaymentsOrderId(orderId)) return undefined;
    return startNOWPaymentsReceiptPolling({ orderId,
      onResult: receipt => setSnapshot({ orderId, receipt }),
      onStop: reason => { if (reason === 'unavailable') setSnapshot({ orderId, receipt: null }); },
    });
  }, [orderId]);
  // A changed URL/account view can never flash the previous order's success.
  return snapshot.orderId === orderId ? snapshot.receipt : null;
}
