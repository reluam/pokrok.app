"use client";

import Image from "next/image";
import { motion } from "framer-motion";
import DecorativeShapes from "./DecorativeShapes";

export default function Hero() {
  return (
    <section className="relative flex items-center justify-center pt-20 pb-10 overflow-hidden paper-texture -mt-4 md:-mt-6">
      <div className="w-full px-4 sm:px-6 lg:px-8">
        <motion.div
          className="w-full max-w-7xl mx-auto relative z-10"
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: "easeOut" }}
        >
          <div className="relative overflow-hidden rounded-[32px] border border-white/40 bg-white/60 shadow-xl backdrop-blur-xl backdrop-saturate-150">
            <div className="absolute inset-0 -z-10">
              <Image
                src="/hero-background.jpg"
                alt=""
                fill
                className="object-cover"
                priority
                fetchPriority="high"
                quality={90}
                sizes="100vw"
              />
              <div className="absolute inset-0 bg-[#FDFDF7]/40 backdrop-blur-md" />
            </div>

            <DecorativeShapes variant="hero" />

            <div className="relative px-4 sm:px-8 py-10 md:py-14">
              <div className="max-w-3xl mx-auto text-center">
                <HeroContent />
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

const fadeInUp = {
  initial: { opacity: 0, y: 32 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.7, ease: "easeOut" as const },
};

function HeroContent() {
  return (
    <>
      <motion.h1
        className="text-4xl md:text-5xl lg:text-6xl leading-tight text-foreground"
        {...fadeInUp}
        transition={{ ...fadeInUp.transition, delay: 0.1 }}
      >
        Začni <span className="hand-drawn-underline">žít life</span> podle sebe.
      </motion.h1>

      <motion.p
        className="mt-4 text-lg md:text-xl lg:text-2xl text-foreground/80 leading-relaxed max-w-2xl mx-auto"
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.3, ease: "easeOut" }}
      >
        Tvůj život by měl dávat smysl tobě. Pomůžu ti{" "}
        <span className="font-semibold text-[#ff8c42]">zvědomit realitu</span>,{" "}
        <span className="font-semibold text-[#ff8c42]">najít směr</span> a{" "}
        <span className="font-semibold text-[#ff8c42]">začít žít Tvůj život</span>. Krok za krokem.
      </motion.p>

      <motion.div
        className="mt-8 flex justify-center"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.7, ease: "easeOut" }}
      >
        <a
          href="#home-coaching"
          className="btn-playful px-8 py-4 bg-accent text-white rounded-full text-xl font-bold hover:bg-accent-hover transition-all w-full sm:w-auto shadow-lg hover:shadow-xl hover:scale-[1.02] active:scale-[0.98]"
        >
          Chci převzít řízení
        </a>
      </motion.div>
    </>
  );
}