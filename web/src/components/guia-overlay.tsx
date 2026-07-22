import { useEffect, useRef, useState } from "react"

type Box = [number, number, number, number]

type ContainScale = { s: number; offsetX: number; offsetY: number }

const IDENTITY_SCALE: ContainScale = { s: 1, offsetX: 0, offsetY: 0 }

export function GuiaOverlay({
  photoUrl, boxes, activeField,
}: {
  photoUrl: string | null
  boxes: Record<string, Box | null>
  activeField: string | null
}) {
  const imgRef = useRef<HTMLImageElement>(null)
  const [scale, setScale] = useState<ContainScale>(IDENTITY_SCALE)

  function computeScale() {
    const img = imgRef.current
    if (!img || !img.naturalWidth) return
    const s = Math.min(img.clientWidth / img.naturalWidth, img.clientHeight / img.naturalHeight)
    const offsetX = (img.clientWidth - img.naturalWidth * s) / 2
    const offsetY = (img.clientHeight - img.naturalHeight * s) / 2
    setScale({ s, offsetX, offsetY })
  }

  useEffect(() => {
    window.addEventListener("resize", computeScale)
    return () => window.removeEventListener("resize", computeScale)
  }, [])

  if (!photoUrl) return <p className="text-sm text-muted-foreground">Sin imagen.</p>

  return (
    <div className="relative w-full">
      <img
        ref={imgRef}
        src={photoUrl}
        alt="Guía"
        onLoad={computeScale}
        className="max-h-[520px] w-full rounded-md object-contain"
      />
      {Object.entries(boxes).map(([field, b]) =>
        b ? (
          <div
            key={field}
            className={
              "pointer-events-none absolute rounded-sm border-2 transition-colors " +
              (field === activeField ? "border-amber-500 bg-amber-400/20" : "border-sky-500/50")
            }
            style={{
              left: scale.offsetX + b[0] * scale.s,
              top: scale.offsetY + b[1] * scale.s,
              width: b[2] * scale.s,
              height: b[3] * scale.s,
            }}
          />
        ) : null,
      )}
    </div>
  )
}
