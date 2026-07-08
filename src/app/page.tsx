// page.tsx — 根路径重定向至回测主屏
import { redirect } from "next/navigation";

export default function HomeRedirect() {
  redirect("/backtest.html");
}
