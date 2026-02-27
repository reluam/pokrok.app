"use client";

import { motion } from "framer-motion";
import type { ReactNode } from "react";

interface RevealSectionProps {
  children: ReactNode;
  className?: string;
  /** Delay in seconds */
  delay?: number;
  /** If true, animace proběhne hned po mountu, ne podle scrollu */
  triggerOnMount?: boolean;
}

export default function RevealSection({
  children,
  className = "",
  delay = 0,
  triggerOnMount = false,
}: RevealSectionProps) {
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y: 48 }}
      {...(triggerOnMount
        ? {
            animate: { opacity: 1, y: 0 },
          }
        : {
            whileInView: { opacity: 1, y: 0 },
            viewport: { once: true, amount: 0.15 },
          })}
      transition={{
        duration: 0.85,
        ease: [0.22, 1, 0.36, 1],
        delay,
      }}
    >
      {children}
    </motion.div>
  );
}

