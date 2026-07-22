import { useRef, useState } from "react"

type Box = [number, number, number, number]

export function GuiaOverlay({
  photoUrl, boxes, activeField,
}: {
  photoUrl: string | null
  boxes: Record<string, Box | null>
  activeField: string | null
}) {
  const imgRef = useRef<HTMLImageElement>(null)
  const [scale, setScale] = useState<{ sx: number; sy: number }>({ sx: 1, sy: 1 })

  function onLoad() {
    const img = imgRef.current
    if (!img || !img.naturalWidth) return
    setScale({ sx: img.clientWidth / img.naturalWidth, sy: img.clientHeight / img.naturalHeight })
  }

  if (!photoUrl) return <p className="text-sm text-muted-foreground">Sin imagen.</p>

  return (
    <div className="relative w-full">
      <img
        ref={imgRef}
        src={photoUrl}
        alt="Guía"
        onLoad={onLoad}
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
              left: b[0] * scale.sx,
              top: b[1] * scale.sy,
              width: b[2] * scale.sx,
              height: b[3] * scale.sy,
            }}
          />
        ) : null,
      )}
    </div>
  )
}
