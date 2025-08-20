'use client'

import { useEffect, useRef, useState, FormEvent, ReactNode } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from './button'
import { Loader2 } from 'lucide-react'

interface ProgressiveFormProps {
  action?: string
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE'
  onSubmit?: (data: FormData) => Promise<void>
  onSuccess?: (response: any) => void
  onError?: (error: Error) => void
  className?: string
  children: ReactNode
  enableOptimisticUI?: boolean
  enableOfflineQueue?: boolean
  validationSchema?: Record<string, (value: any) => string | undefined>
}

/**
 * Progressive Enhancement Form Component
 * Works without JavaScript and progressively enhances when JS is available
 */
export function ProgressiveForm({
  action,
  method = 'POST',
  onSubmit,
  onSuccess,
  onError,
  className,
  children,
  enableOptimisticUI = true,
  enableOfflineQueue = false,
  validationSchema = {}
}: ProgressiveFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [isOnline, setIsOnline] = useState(true)
  const [queuedSubmissions, setQueuedSubmissions] = useState<FormData[]>([])
  const formRef = useRef<HTMLFormElement>(null)
  const router = useRouter()
  
  // Monitor online/offline status
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true)
      processOfflineQueue()
    }
    
    const handleOffline = () => {
      setIsOnline(false)
    }
    
    setIsOnline(navigator.onLine)
    
    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)
    
    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])
  
  // Process offline queue when coming back online
  const processOfflineQueue = async () => {
    if (queuedSubmissions.length === 0) return
    
    const queue = [...queuedSubmissions]
    setQueuedSubmissions([])
    
    for (const formData of queue) {
      try {
        await submitForm(formData)
      } catch (error) {
        console.error('Failed to process queued submission:', error)
      }
    }
  }
  
  // Validate form data
  const validateForm = (formData: FormData): boolean => {
    const newErrors: Record<string, string> = {}
    
    Object.entries(validationSchema).forEach(([field, validator]) => {
      const value = formData.get(field)
      const error = validator(value)
      if (error) {
        newErrors[field] = error
      }
    })
    
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }
  
  // Submit form data
  const submitForm = async (formData: FormData) => {
    if (onSubmit) {
      await onSubmit(formData)
    } else if (action) {
      const response = await fetch(action, {
        method,
        body: method === 'GET' ? undefined : formData,
        headers: {
          'X-Progressive-Enhancement': 'true'
        }
      })
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      
      const data = await response.json()
      return data
    }
  }
  
  // Handle form submission
  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    // Don't prevent default if JS is disabled (progressive enhancement)
    if (!(window as any).JS_ENABLED) return
    
    e.preventDefault()
    
    const formData = new FormData(e.currentTarget)
    
    // Validate form
    if (!validateForm(formData)) {
      return
    }
    
    // Handle offline mode
    if (!isOnline && enableOfflineQueue) {
      setQueuedSubmissions(prev => [...prev, formData])
      onSuccess?.({ queued: true })
      return
    }
    
    setIsSubmitting(true)
    setErrors({})
    
    try {
      // Optimistic UI update
      if (enableOptimisticUI && onSuccess) {
        const optimisticData = Object.fromEntries(formData.entries())
        onSuccess(optimisticData)
      }
      
      // Submit form
      const response = await submitForm(formData)
      
      // Handle successful submission
      if (!enableOptimisticUI && onSuccess) {
        onSuccess(response)
      }
      
      // Reset form
      formRef.current?.reset()
      
      // Refresh router if needed
      router.refresh()
    } catch (error) {
      console.error('Form submission error:', error)
      
      // Revert optimistic update on error
      if (enableOptimisticUI) {
        // Implement revert logic here
      }
      
      if (onError) {
        onError(error as Error)
      } else {
        setErrors({ form: (error as Error).message })
      }
    } finally {
      setIsSubmitting(false)
    }
  }
  
  return (
    <form
      ref={formRef}
      action={action}
      method={method}
      onSubmit={handleSubmit}
      className={className}
      noValidate // Use custom validation
    >
      {/* Hidden field for progressive enhancement detection */}
      <input type="hidden" name="_pe" value="1" />
      
      {/* Show offline indicator */}
      {!isOnline && (
        <div className="mb-4 p-3 bg-yellow-100 text-yellow-800 rounded-md">
          You are offline. Form submissions will be queued and sent when you're back online.
          {queuedSubmissions.length > 0 && (
            <span className="ml-2 font-semibold">
              ({queuedSubmissions.length} pending)
            </span>
          )}
        </div>
      )}
      
      {/* Show form-level errors */}
      {errors.form && (
        <div className="mb-4 p-3 bg-red-100 text-red-800 rounded-md">
          {errors.form}
        </div>
      )}
      
      {/* Inject error props into form fields */}
      {children}
      
      {/* Progressive submit button */}
      <noscript>
        <button type="submit" className="btn btn-primary">
          Submit
        </button>
      </noscript>
      
      <div className="hidden js:block">
        <Button
          type="submit"
          disabled={isSubmitting || (!isOnline && !enableOfflineQueue)}
          className="relative"
        >
          {isSubmitting && (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          )}
          {isSubmitting ? 'Submitting...' : 'Submit'}
        </Button>
      </div>
    </form>
  )
}

/**
 * Progressive field component with validation
 */
interface ProgressiveFieldProps {
  name: string
  label: string
  type?: string
  required?: boolean
  error?: string
  defaultValue?: string
  placeholder?: string
  autoComplete?: string
}

export function ProgressiveField({
  name,
  label,
  type = 'text',
  required,
  error,
  defaultValue,
  placeholder,
  autoComplete
}: ProgressiveFieldProps) {
  const [value, setValue] = useState(defaultValue || '')
  const [touched, setTouched] = useState(false)
  
  return (
    <div className="mb-4">
      <label htmlFor={name} className="block text-sm font-medium mb-1">
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </label>
      
      <input
        id={name}
        name={name}
        type={type}
        required={required}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onBlur={() => setTouched(true)}
        placeholder={placeholder}
        autoComplete={autoComplete}
        aria-invalid={!!error}
        aria-describedby={error ? `${name}-error` : undefined}
        className={`
          w-full px-3 py-2 border rounded-md
          ${error && touched ? 'border-red-500' : 'border-gray-300'}
          focus:outline-none focus:ring-2 focus:ring-blue-500
        `}
      />
      
      {error && touched && (
        <p id={`${name}-error`} className="mt-1 text-sm text-red-600">
          {error}
        </p>
      )}
    </div>
  )
}

/**
 * Auto-save form component
 */
interface AutoSaveFormProps extends Omit<ProgressiveFormProps, 'onSubmit'> {
  saveInterval?: number
  onAutoSave?: (data: FormData) => Promise<void>
}

export function AutoSaveForm({
  saveInterval = 5000,
  onAutoSave,
  children,
  ...props
}: AutoSaveFormProps) {
  const [lastSaved, setLastSaved] = useState<Date | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  
  // Auto-save logic
  const autoSave = async () => {
    const formElement = containerRef.current?.querySelector('form')
    if (!formElement || !onAutoSave) return
    
    setIsSaving(true)
    const formData = new FormData(formElement)
    
    try {
      await onAutoSave(formData)
      setLastSaved(new Date())
    } catch (error) {
      console.error('Auto-save failed:', error)
    } finally {
      setIsSaving(false)
    }
  }
  
  // Handle input changes
  const handleChange = () => {
    // Clear existing timeout
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current)
    }
    
    // Set new timeout
    saveTimeoutRef.current = setTimeout(autoSave, saveInterval)
  }
  
  useEffect(() => {
    const form = containerRef.current?.querySelector('form')
    if (!form) return
    
    // Add change listeners to all inputs
    const inputs = form.querySelectorAll('input, textarea, select')
    inputs.forEach(input => {
      input.addEventListener('change', handleChange)
      input.addEventListener('input', handleChange)
    })
    
    return () => {
      // Clean up listeners
      inputs.forEach(input => {
        input.removeEventListener('change', handleChange)
        input.removeEventListener('input', handleChange)
      })
      
      // Clear timeout
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current)
      }
    }
  }, [])
  
  return (
    <div ref={containerRef}>
      {/* Auto-save indicator */}
      {(isSaving || lastSaved) && (
        <div className="mb-2 text-sm text-gray-500">
          {isSaving ? (
            <span className="flex items-center">
              <Loader2 className="mr-1 h-3 w-3 animate-spin" />
              Saving...
            </span>
          ) : lastSaved ? (
            <span>Last saved: {lastSaved.toLocaleTimeString()}</span>
          ) : null}
        </div>
      )}
      
      <ProgressiveForm {...props}>
        {children}
      </ProgressiveForm>
    </div>
  )
}

// Mark that JS is enabled
if (typeof window !== 'undefined') {
  ;(window as any).JS_ENABLED = true
}