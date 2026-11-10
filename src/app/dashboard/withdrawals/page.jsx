import { redirect } from "next/navigation";

export default function WithdrawalsPage() {
  redirect("/dashboard/payments");
}
