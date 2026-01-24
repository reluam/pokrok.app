"use client";

import Image from "next/image";
import { useState } from "react";

interface Certificate {
  id: string;
  title: string;
  image: string;
  alt: string;
}

const certificates: Certificate[] = [
  {
    id: "mindset",
    title: "Certifikovaný Mindset Coach",
    image: "/certifikat-mindset.png",
    alt: "Certifikát - Certifikovaný Mindset Coach",
  },
  {
    id: "vyjednavani",
    title: "Vyjednávací a prodejní dovednosti (S&N Institut, pod vedením Adama Dolejše)",
    image: "/certifikat-vyjednavani.png",
    alt: "Certifikát - Vyjednávací a prodejní dovednosti",
  },
];

export default function Certificates() {
  const [lightboxImage, setLightboxImage] = useState<string | null>(null);

  const openLightbox = (image: string) => {
    setLightboxImage(image);
  };

  const closeLightbox = () => {
    setLightboxImage(null);
  };

  return (
    <>
      <div className="w-full md:w-auto">
        <div className="flex flex-row justify-center items-center gap-3 md:gap-4 flex-wrap">
          {certificates.map((cert) => (
            <a
              key={cert.id}
              href={cert.image}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => {
                e.preventDefault();
                openLightbox(cert.image);
              }}
              className="certificate-badge group"
              aria-label={cert.title}
            >
              <Image
                src={cert.image}
                alt={cert.alt}
                width={70}
                height={52}
                className="certificate-image h-10 md:h-12 w-auto object-contain"
              />
            </a>
          ))}
        </div>
      </div>

      {/* Simple Lightbox */}
      {lightboxImage && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-sm p-4"
          onClick={closeLightbox}
        >
          <div className="relative max-w-[98rem] w-full max-h-[95vh] flex items-center justify-center">
            <button
              onClick={closeLightbox}
              className="absolute top-4 right-4 text-white hover:text-accent transition-colors text-4xl font-bold z-10 bg-black/50 rounded-full w-10 h-10 flex items-center justify-center"
              aria-label="Zavřít"
            >
              ×
            </button>
            <div className="w-full h-full flex items-center justify-center">
              <Image
                src={lightboxImage}
                alt="Certifikát"
                width={1680}
                height={1260}
                className="max-w-full max-h-[95vh] w-auto h-auto object-contain rounded-lg shadow-2xl"
                style={{ transform: 'scale(1.4)' }}
              />
            </div>
          </div>
        </div>
      )}
    </>
  );
}
