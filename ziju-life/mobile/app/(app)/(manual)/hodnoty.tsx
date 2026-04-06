import { useEffect } from "react";
import { useRouter } from "expo-router";

export default function HodnotyScreen() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/(app)/(nastroje)/hodnoty");
  }, [router]);

  return null;
}
