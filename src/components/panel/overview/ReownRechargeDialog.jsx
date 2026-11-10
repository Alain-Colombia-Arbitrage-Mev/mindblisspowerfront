"use client";

import ReownProvider from "@/components/reown/ReownProvider";
import FirstRechargeDialog from "./FirstRechargeDialog";

export default function ReownRechargeDialog(props) {
  return <ReownProvider><FirstRechargeDialog {...props} /></ReownProvider>;
}
