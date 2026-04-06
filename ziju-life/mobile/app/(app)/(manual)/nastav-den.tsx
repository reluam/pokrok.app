import { useEffect } from "react";
import { useRouter } from "expo-router";

export default function NastavDenScreen() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/(app)/(nastroje)/nastav-den");
  }, [router]);

  return null;
}
