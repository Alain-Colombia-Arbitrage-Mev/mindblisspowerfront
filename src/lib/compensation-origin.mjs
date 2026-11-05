// A beneficiary's membership method is not necessarily the method of the sale
// that generated the commission. Binary mixed provenance comes from consumed PV.
export function compensationOriginLabel(value) {
  return ({ nowpayments: 'NOWPayments', manual: 'Pago manual', mixed: 'Mixto por PV emparejados' })[value] || 'Origen sin atribuir';
}
