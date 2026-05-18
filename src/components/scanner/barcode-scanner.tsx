"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { Camera, CameraOff } from "lucide-react";

interface BarcodeScannerProps {
  onScan: (barcode: string) => void;
  active: boolean;
}

const SCANNER_DIV_ID = "qr-barcode-region";
const DEBOUNCE_MS = 2000;

export function BarcodeScanner({ onScan, active }: BarcodeScannerProps) {
  const [error, setError] = useState<string | null>(null);
  const [isReady, setIsReady] = useState(false);
  const scannerRef = useRef<{ stop: () => Promise<void>; clear: () => void } | null>(null);
  const lastScanRef = useRef<string>("");
  const lastScanTimeRef = useRef<number>(0);

  const handleScan = useCallback(
    (decodedText: string) => {
      const now = Date.now();
      if (
        decodedText === lastScanRef.current &&
        now - lastScanTimeRef.current < DEBOUNCE_MS
      ) {
        return;
      }
      lastScanRef.current = decodedText;
      lastScanTimeRef.current = now;
      onScan(decodedText);
    },
    [onScan],
  );

  useEffect(() => {
    if (!active) {
      if (scannerRef.current) {
        scannerRef.current.stop().then(() => {
          scannerRef.current?.clear();
          scannerRef.current = null;
          setIsReady(false);
          setError(null);
        }).catch(() => {});
      }
      return;
    }

    let cancelled = false;

    import("html5-qrcode").then(({ Html5Qrcode }) => {
      if (cancelled) return;

      const scanner = new Html5Qrcode(SCANNER_DIV_ID);
      scannerRef.current = scanner;

      scanner
        .start(
          { facingMode: "environment" },
          { fps: 10, qrbox: { width: 280, height: 120 } },
          handleScan,
          () => {},
        )
        .then(() => {
          if (!cancelled) setIsReady(true);
        })
        .catch(() => {
          if (!cancelled) {
            setError("No se pudo acceder a la camara. Verifica los permisos en tu navegador.");
          }
        });
    });

    return () => {
      cancelled = true;
      if (scannerRef.current) {
        scannerRef.current.stop().catch(() => {});
      }
    };
  }, [active, handleScan]);

  if (!active) {
    return (
      <div className="flex flex-col items-center justify-center rounded-xl bg-zinc-100 py-10 text-zinc-400">
        <CameraOff size={36} />
        <p className="mt-2 text-sm">Scanner inactivo</p>
      </div>
    );
  }

  return (
    <div className="relative">
      <div id={SCANNER_DIV_ID} className="w-full overflow-hidden rounded-xl" />
      {!isReady && !error && (
        <div className="absolute inset-0 flex items-center justify-center rounded-xl bg-zinc-900/60">
          <div className="text-center text-white">
            <Camera size={32} className="mx-auto mb-2 animate-pulse" />
            <p className="text-sm">Activando camara...</p>
          </div>
        </div>
      )}
      {error && (
        <div className="mt-2 rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</div>
      )}
    </div>
  );
}
