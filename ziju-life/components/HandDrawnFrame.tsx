import { ReactNode } from "react";

interface HandDrawnFrameProps {
  children: ReactNode;
  className?: string;
}

export default function HandDrawnFrame({ children, className = "" }: HandDrawnFrameProps) {
  return (
    <div className={`hand-drawn-frame ${className}`}>
      {children}
    </div>
  );
}
