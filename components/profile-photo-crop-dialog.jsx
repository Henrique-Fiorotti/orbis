"use client"

import * as React from "react"
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max)
}

async function cropAvatar(file, centerX, centerY) {
  const imageUrl = URL.createObjectURL(file)
  const image = new Image()

  image.src = imageUrl
  await image.decode()

  const outputSize = 512
  const sourceSize = Math.min(image.naturalWidth, image.naturalHeight)

  const sx = clamp(
    image.naturalWidth * (centerX / 100) - sourceSize / 2,
    0,
    image.naturalWidth - sourceSize
  )

  const sy = clamp(
    image.naturalHeight * (centerY / 100) - sourceSize / 2,
    0,
    image.naturalHeight - sourceSize
  )

  const canvas = document.createElement("canvas")
  canvas.width = outputSize
  canvas.height = outputSize

  const ctx = canvas.getContext("2d")

  ctx.drawImage(
    image,
    sx,
    sy,
    sourceSize,
    sourceSize,
    0,
    0,
    outputSize,
    outputSize
  )

  URL.revokeObjectURL(imageUrl)

  return new Promise((resolve) => {
    canvas.toBlob(
      (blob) => {
        resolve(
          new File([blob], "foto-perfil.webp", {
            type: "image/webp",
          })
        )
      },
      "image/webp",
      0.9
    )
  })
}

export function ProfilePhotoCropDialog({ file, open, onCancel, onConfirm }) {
  const [previewUrl, setPreviewUrl] = React.useState("")
  const [centerX, setCenterX] = React.useState(50)
  const [centerY, setCenterY] = React.useState(50)
  const [processing, setProcessing] = React.useState(false)

  React.useEffect(() => {
    if (!file) return

    const url = URL.createObjectURL(file)
    setPreviewUrl(url)
    setCenterX(50)
    setCenterY(50)

    return () => URL.revokeObjectURL(url)
  }, [file])

  async function handleConfirm() {
    if (!file) return

    setProcessing(true)

    try {
      const croppedFile = await cropAvatar(file, centerX, centerY)
      onConfirm(croppedFile)
    } finally {
      setProcessing(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={(nextOpen) => !nextOpen && onCancel()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Ajustar foto de perfil</DialogTitle>
        </DialogHeader>

        <div className="flex flex-col items-center gap-5">
          <div className="size-64 overflow-hidden rounded-full border bg-muted">
            {previewUrl ? (
              <img
                src={previewUrl}
                alt="Prévia da foto de perfil"
                className="size-full object-cover"
                style={{
                  objectPosition: `${centerX}% ${centerY}%`,
                }}
              />
            ) : null}
          </div>

          <div className="grid w-full gap-4">
            <label className="grid gap-2 text-sm">
              Centro horizontal
              <input
                type="range"
                min="0"
                max="100"
                value={centerX}
                onChange={(event) => setCenterX(Number(event.target.value))}
              />
            </label>

            <label className="grid gap-2 text-sm">
              Centro vertical
              <input
                type="range"
                min="0"
                max="100"
                value={centerY}
                onChange={(event) => setCenterY(Number(event.target.value))}
              />
            </label>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onCancel} disabled={processing}>
            Cancelar
          </Button>
          <Button onClick={handleConfirm} disabled={processing}>
            {processing ? "Preparando..." : "Usar esta foto"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}