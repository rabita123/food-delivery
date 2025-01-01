import { useToast } from "./use-toast"
import { X } from "lucide-react"

export function Toast() {
  const { toasts } = useToast()

  if (toasts.length === 0) return null

  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2">
      {toasts.map((toast, index) => (
        <div
          key={index}
          className={`${
            toast.variant === 'destructive'
              ? 'bg-red-100 text-red-900'
              : 'bg-green-100 text-green-900'
          } p-4 rounded-lg shadow-lg flex items-center justify-between min-w-[300px]`}
        >
          <div>
            <h3 className="font-medium">{toast.title}</h3>
            {toast.description && (
              <p className="text-sm mt-1">{toast.description}</p>
            )}
          </div>
          <button className="text-current">
            <X className="h-4 w-4" />
          </button>
        </div>
      ))}
    </div>
  )
} 