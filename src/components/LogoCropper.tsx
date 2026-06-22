import Cropper from 'react-easy-crop'
import { useCallback, useState } from 'react'
import { Loader2, X, ZoomIn, ZoomOut, RotateCcw, Check } from 'lucide-react'

interface Props {
  imageSrc: string
  onDone: (blob: Blob) => void
  onCancel: () => void
  uploading?: boolean
}

interface CropArea { x: number; y: number; width: number; height: number }

async function getCroppedBlob(imageSrc: string, pixelCrop: CropArea): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const image = new Image()
    image.onload = () => {
      const canvas = document.createElement('canvas')
      const size   = Math.min(pixelCrop.width, pixelCrop.height)
      canvas.width  = size
      canvas.height = size
      const ctx = canvas.getContext('2d')!
      ctx.drawImage(
        image,
        pixelCrop.x, pixelCrop.y, pixelCrop.width, pixelCrop.height,
        0, 0, size, size,
      )
      canvas.toBlob(blob => blob ? resolve(blob) : reject(new Error('Canvas is empty')), 'image/jpeg', 0.92)
    }
    image.onerror = reject
    image.src = imageSrc
  })
}

export default function LogoCropper({ imageSrc, onDone, onCancel, uploading }: Props) {
  const [crop, setCrop]       = useState({ x: 0, y: 0 })
  const [zoom, setZoom]       = useState(1)
  const [croppedArea, setCroppedArea] = useState<CropArea | null>(null)

  const onCropComplete = useCallback((_: any, pixels: CropArea) => {
    setCroppedArea(pixels)
  }, [])

  async function handleConfirm() {
    if (!croppedArea) return
    const blob = await getCroppedBlob(imageSrc, croppedArea)
    onDone(blob)
  }

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">

        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
          <p className="text-[15px] font-bold text-slate-900">Crop Logo</p>
          <button onClick={onCancel}
            className="h-8 w-8 flex items-center justify-center rounded-xl text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors">
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Crop area */}
        <div className="relative bg-black" style={{ height: 320 }}>
          <Cropper
            image={imageSrc}
            crop={crop}
            zoom={zoom}
            aspect={1}
            cropShape="round"
            showGrid={false}
            onCropChange={setCrop}
            onZoomChange={setZoom}
            onCropComplete={onCropComplete}
          />
        </div>

        {/* Zoom controls */}
        <div className="px-5 py-3 flex items-center gap-3">
          <ZoomOut className="h-4 w-4 text-slate-400 shrink-0" />
          <input type="range" min={1} max={3} step={0.05} value={zoom}
            onChange={e => setZoom(Number(e.target.value))}
            className="flex-1 accent-amber-500" />
          <ZoomIn className="h-4 w-4 text-slate-400 shrink-0" />
        </div>

        <p className="text-center text-[11.5px] text-slate-400 pb-1">Drag to reposition · Pinch or scroll to zoom</p>

        {/* Actions */}
        <div className="flex gap-3 px-5 py-4 border-t border-slate-100">
          <button onClick={() => { setCrop({ x: 0, y: 0 }); setZoom(1) }}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-[13px] font-medium text-slate-500 border border-slate-200 hover:bg-slate-50 transition-colors">
            <RotateCcw className="h-3.5 w-3.5" /> Reset
          </button>
          <button onClick={onCancel}
            className="px-4 py-2 rounded-xl text-[13px] font-medium text-slate-500 border border-slate-200 hover:bg-slate-50 transition-colors">
            Cancel
          </button>
          <button onClick={handleConfirm} disabled={uploading}
            className="flex-1 flex items-center justify-center gap-2 py-2 rounded-xl text-[13.5px] font-semibold text-white transition-all disabled:opacity-60"
            style={{ background: 'linear-gradient(135deg, #f59e0b, #ea580c)' }}>
            {uploading
              ? <><Loader2 className="h-4 w-4 animate-spin" /> Uploading…</>
              : <><Check className="h-4 w-4" /> Use This Crop</>}
          </button>
        </div>
      </div>
    </div>
  )
}
