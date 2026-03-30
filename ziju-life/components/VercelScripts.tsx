import { SpeedInsights } from "@vercel/speed-insights/next";
import { Analytics } from "@vercel/analytics/next";

export default function VercelScripts() {
  return (
    <>
      <SpeedInsights />
      <Analytics />
    </>
  );
}
