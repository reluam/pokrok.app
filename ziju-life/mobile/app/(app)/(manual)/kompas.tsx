import { useEffect } from "react";
import { useRouter } from "expo-router";

export default function KompasScreen() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/(app)/(nastroje)/kompas");
  }, [router]);

  return null;
}
