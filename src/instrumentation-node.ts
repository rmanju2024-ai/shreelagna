import { setDefaultResultOrder } from "node:dns";
import { trustSystemCa } from "@/lib/node/trust-system-ca";

setDefaultResultOrder("ipv4first");
trustSystemCa();
