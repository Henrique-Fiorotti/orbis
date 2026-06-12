"use client"

import * as React from "react"
import { CameraIcon, ImageUpIcon, RotateCcwIcon, Trash2Icon } from "lucide-react"
import { toast } from "sonner"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"

const ACCEPTED_IMAGE_TYPES = ["image/png", "image/jpg", "image/jpeg", "image/webp"]
const MAX_IMAGE_SIZE = 15 * 1024 * 1024
const ACTION_BUTTON_CLASS =
  "flex min-h-[56px] w-full cursor-pointer items-center gap-3 rounded-lg border border-border bg-card px-4 py-3 text-left transition-colors hover:border-[#5E17EB]/60 hover:bg-muted/40 disabled:cursor-not-allowed disabled:opacity-45"

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max)
}

function getCoverCropRect(imageWidth, imageHeight, positionX, positionY) {
  const sourceSize = Math.min(imageWidth, imageHeight)

  return {
    sx: clamp((imageWidth - sourceSize) * (positionX / 100), 0, imageWidth - sourceSize),
    sy: clamp((imageHeight - sourceSize) * (positionY / 100), 0, imageHeight - sourceSize),
    sourceSize,
  }
}

function getCoverOverflow(imageWidth, imageHeight, frameSize) {
  if (!imageWidth || !imageHeight || !frameSize) {
    return { overflowX: 0, overflowY: 0 }
  }

  const scale = Math.max(frameSize / imageWidth, frameSize / imageHeight)

  return {
    overflowX: Math.max(0, imageWidth * scale - frameSize),
    overflowY: Math.max(0, imageHeight * scale - frameSize),
  }
}

function getDraggedPosition(startPosition, delta, overflow) {
  if (overflow <= 0.5) {
    return 50
  }

  return clamp(startPosition - (delta / overflow) * 100, 0, 100)
}

async function cropAvatar(file, positionX, positionY) {
  const imageUrl = URL.createObjectURL(file)
  const image = new Image()

  image.src = imageUrl
  await image.decode()

  const outputSize = 512
  const { sx, sy, sourceSize } = getCoverCropRect(image.naturalWidth, image.naturalHeight, positionX, positionY)
  const canvas = document.createElement("canvas")
  canvas.width = outputSize
  canvas.height = outputSize

  const ctx = canvas.getContext("2d")
  ctx.drawImage(image, sx, sy, sourceSize, sourceSize, 0, 0, outputSize, outputSize)

  URL.revokeObjectURL(imageUrl)

  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (!blob) {
          reject(new Error("Não foi possível preparar a imagem."))
          return
        }

        resolve(new File([blob], "foto-perfil.webp", { type: "image/webp" }))
      },
      "image/webp",
      0.9
    )
  })
}

export function ProfilePhotoCropDialog({
  open,
  currentPhotoSrc,
  fallback,
  name,
  saving = false,
  onCancel,
  onConfirm,
  onRemove,
}) {
  const inputRef = React.useRef(null)
  const cropFrameRef = React.useRef(null)
  const dragRef = React.useRef(null)
  const [file, setFile] = React.useState(null)
  const [previewUrl, setPreviewUrl] = React.useState("")
  const [positionX, setPositionX] = React.useState(50)
  const [positionY, setPositionY] = React.useState(50)
  const [imageSize, setImageSize] = React.useState(null)
  const [isDragging, setIsDragging] = React.useState(false)
  const [processing, setProcessing] = React.useState(false)
  const busy = processing || saving

  React.useEffect(() => {
    if (!open) {
      setFile(null)
      setPreviewUrl("")
      setPositionX(50)
      setPositionY(50)
      setImageSize(null)
      setIsDragging(false)
      dragRef.current = null
    }
  }, [open])

  React.useEffect(() => {
    if (!file) {
      setPreviewUrl("")
      setImageSize(null)
      return
    }

    const url = URL.createObjectURL(file)
    setPreviewUrl(url)
    setPositionX(50)
    setPositionY(50)
    setImageSize(null)
    setIsDragging(false)
    dragRef.current = null

    return () => URL.revokeObjectURL(url)
  }, [file])

  function handleFileChange(event) {
    const selectedFile = event.target.files?.[0]
    event.target.value = ""

    if (!selectedFile) {
      return
    }

    if (!ACCEPTED_IMAGE_TYPES.includes(selectedFile.type)) {
      toast.error("Use uma imagem PNG, JPG, JPEG ou WEBP.")
      return
    }

    if (selectedFile.size > MAX_IMAGE_SIZE) {
      toast.error("A imagem deve ter no máximo 15 MB.")
      return
    }

    setFile(selectedFile)
  }

  function handlePreviewImageLoad(event) {
    setImageSize({
      width: event.currentTarget.naturalWidth,
      height: event.currentTarget.naturalHeight,
    })
  }

  function handleCropPointerDown(event) {
    if (!previewUrl || busy || event.button !== 0) {
      return
    }

    const frame = cropFrameRef.current

    if (!frame) {
      return
    }

    event.preventDefault()
    frame.setPointerCapture?.(event.pointerId)

    dragRef.current = {
      pointerId: event.pointerId,
      startClientX: event.clientX,
      startClientY: event.clientY,
      startPositionX: positionX,
      startPositionY: positionY,
      frameSize: frame.getBoundingClientRect().width,
    }
    setIsDragging(true)
  }

  function handleCropPointerMove(event) {
    const drag = dragRef.current

    if (!drag || drag.pointerId !== event.pointerId || !imageSize) {
      return
    }

    event.preventDefault()

    const { overflowX, overflowY } = getCoverOverflow(imageSize.width, imageSize.height, drag.frameSize)

    setPositionX(getDraggedPosition(drag.startPositionX, event.clientX - drag.startClientX, overflowX))
    setPositionY(getDraggedPosition(drag.startPositionY, event.clientY - drag.startClientY, overflowY))
  }

  function finishCropDrag(event) {
    const drag = dragRef.current

    if (!drag || drag.pointerId !== event.pointerId) {
      return
    }

    cropFrameRef.current?.releasePointerCapture?.(event.pointerId)
    dragRef.current = null
    setIsDragging(false)
  }

  async function handleConfirm() {
    if (!file) {
      return
    }

    setProcessing(true)

    try {
      const croppedFile = await cropAvatar(file, positionX, positionY)
      await onConfirm(croppedFile)
    } finally {
      setProcessing(false)
    }
  }

  const displaySrc = previewUrl || currentPhotoSrc
  const hasCurrentPhoto = Boolean(currentPhotoSrc)

  return (
    <Dialog open={open} onOpenChange={(nextOpen) => !nextOpen && onCancel()}>
      <DialogContent className="flex max-h-[calc(100svh-2rem)] w-[min(640px,calc(100vw-2rem))]! max-w-none! flex-col gap-0 overflow-hidden rounded-xl p-0 [&_[data-slot=dialog-close]]:right-3 [&_[data-slot=dialog-close]]:top-3">
        <DialogHeader className="shrink-0 border-b px-5 py-4 pr-14">
          <DialogTitle>Foto de perfil</DialogTitle>
          <p className="text-xs font-medium text-muted-foreground">
            PNG, JPG, JPEG ou WEBP. Tamanho máximo: 15 MB.
          </p>
        </DialogHeader>

        <div className="grid min-h-0 overflow-y-auto md:grid-cols-[220px_minmax(0,1fr)]">
          <div className="flex flex-col items-center justify-center gap-3 border-b bg-muted/20 px-5 py-6 md:border-b-0 md:border-r">
            <div className="relative">
              <div
                ref={cropFrameRef}
                data-profile-photo-crop-frame
                className={`relative size-36 overflow-hidden rounded-full border bg-muted select-none sm:size-40 ${previewUrl && !busy ? isDragging ? "cursor-grabbing" : "cursor-grab" : ""}`}
                onContextMenu={(event) => event.preventDefault()}
                onPointerDown={handleCropPointerDown}
                onPointerMove={handleCropPointerMove}
                onPointerUp={finishCropDrag}
                onPointerCancel={finishCropDrag}
                style={{
                  WebkitTouchCallout: "none",
                  WebkitUserSelect: "none",
                  touchAction: previewUrl ? "none" : undefined,
                  userSelect: "none",
                }}
              >
                {displaySrc ? (
                  <img
                    src={displaySrc}
                    alt={name ? `Prévia da foto de ${name}` : "Prévia da foto de perfil"}
                    draggable={false}
                    className="pointer-events-none size-full select-none object-cover"
                    onLoad={handlePreviewImageLoad}
                    onContextMenu={(event) => event.preventDefault()}
                    onDragStart={(event) => event.preventDefault()}
                    style={{
                      objectPosition: previewUrl ? `${positionX}% ${positionY}%` : undefined,
                      WebkitTouchCallout: "none",
                      WebkitUserDrag: "none",
                      WebkitUserSelect: "none",
                      userSelect: "none",
                    }}
                  />
                ) : (
                  <Avatar className="size-full! text-4xl font-bold">
                    <AvatarImage src={undefined} alt={name || "Foto do perfil"} />
                    <AvatarFallback className="bg-[#5E17EB] text-4xl font-bold text-white">
                      {fallback}
                    </AvatarFallback>
                  </Avatar>
                )}

                {isDragging ? (
                  <>
                    <div
                      aria-hidden="true"
                      data-profile-photo-crop-grid
                      className="pointer-events-none absolute inset-0 rounded-full transition-opacity"
                      style={{
                        backgroundImage:
                          "linear-gradient(to right, rgba(255,255,255,.55) 1px, transparent 1px), linear-gradient(to bottom, rgba(255,255,255,.55) 1px, transparent 1px)",
                        backgroundSize: "33.333% 33.333%",
                        boxShadow: "inset 0 0 0 1px rgba(0,0,0,.2)",
                      }}
                    />
                    <div className="pointer-events-none absolute left-1/2 top-0 h-full w-px -translate-x-1/2 bg-[#5E17EB]/80" />
                    <div className="pointer-events-none absolute left-0 top-1/2 h-px w-full -translate-y-1/2 bg-[#5E17EB]/80" />
                  </>
                ) : null}
              </div>

              <button
                type="button"
                className="absolute bottom-1 right-1 flex size-8 cursor-pointer items-center justify-center rounded-full border-2 border-background bg-[#5E17EB] text-white shadow-sm transition-colors hover:bg-[#4c11cc] disabled:cursor-not-allowed disabled:opacity-60"
                disabled={busy}
                onClick={() => inputRef.current?.click()}
                aria-label="Carregar nova foto"
              >
                <CameraIcon className="size-4" />
              </button>
            </div>

            <span className="rounded-full bg-muted px-3 py-1 text-xs text-muted-foreground">
              {previewUrl ? "Prévia" : "Foto atual"}
            </span>
          </div>

          <div className="flex min-w-0 flex-col gap-3 p-5">
            <input
              ref={inputRef}
              type="file"
              accept="image/png,image/jpg,image/jpeg,image/webp"
              className="hidden"
              onChange={handleFileChange}
            />

            <button
              type="button"
              className={ACTION_BUTTON_CLASS}
              disabled={busy}
              onClick={() => inputRef.current?.click()}
            >
              <span className="flex size-9 shrink-0 items-center justify-center rounded-md bg-[#5E17EB]/10 text-[#5E17EB]">
                <ImageUpIcon className="size-4" />
              </span>
              <span className="min-w-0">
                <span className="block text-sm font-semibold text-foreground">Carregar nova foto</span>
                <span className="block text-xs font-medium text-muted-foreground">PNG, JPG, JPEG ou WEBP</span>
              </span>
            </button>

            <button
              type="button"
              className={ACTION_BUTTON_CLASS}
              disabled={busy || !previewUrl}
              onClick={() => {
                setPositionX(50)
                setPositionY(50)
              }}
            >
              <span className="flex size-9 shrink-0 items-center justify-center rounded-md bg-muted text-muted-foreground">
                <RotateCcwIcon className="size-4" />
              </span>
              <span className="min-w-0">
                <span className="block text-sm font-semibold text-foreground">Centralizar imagem</span>
                <span className="block text-xs font-medium text-muted-foreground">Restaurar posição padrão</span>
              </span>
            </button>

            <button
              type="button"
              className={`${ACTION_BUTTON_CLASS} border-destructive/35 bg-destructive/5 hover:border-destructive/60 hover:bg-destructive/10`}
              disabled={busy || !hasCurrentPhoto}
              onClick={onRemove}
            >
              <span className="flex size-9 shrink-0 items-center justify-center rounded-md bg-destructive/15 text-destructive">
                <Trash2Icon className="size-4" />
              </span>
              <span className="min-w-0">
                <span className="block text-sm font-semibold text-destructive">Remover foto</span>
                <span className="block text-xs font-medium text-destructive/75">Voltar ao avatar padrão</span>
              </span>
            </button>

            {previewUrl ? (
              <div className="grid w-full gap-3 rounded-lg border bg-muted/20 p-3">
                <label className="grid gap-2 text-sm">
                  Centro horizontal
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={positionX}
                    className="cursor-pointer"
                    disabled={busy}
                    onChange={(event) => setPositionX(Number(event.target.value))}
                  />
                </label>

                <label className="grid gap-2 text-sm">
                  Centro vertical
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={positionY}
                    className="cursor-pointer"
                    disabled={busy}
                    onChange={(event) => setPositionY(Number(event.target.value))}
                  />
                </label>
              </div>
            ) : null}
          </div>
        </div>

        {previewUrl ? (
          <DialogFooter className="m-0! shrink-0 rounded-none border-t bg-muted/50 p-3 sm:flex-row sm:justify-end">
            <Button
              variant="outline"
              className="min-h-9 w-full px-3! py-2! sm:w-auto"
              onClick={onCancel}
              disabled={busy}
            >
              Cancelar
            </Button>
            <Button
              className="min-h-9 w-full px-3! py-2! sm:w-auto"
              onClick={handleConfirm}
              disabled={busy}
            >
              {busy ? "Salvando..." : "Salvar foto"}
            </Button>
          </DialogFooter>
        ) : null}
      </DialogContent>
    </Dialog>
  )
}
