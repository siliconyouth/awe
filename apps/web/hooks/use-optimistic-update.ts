import { useState, useCallback, useTransition } from 'react'
import { toast } from 'sonner'

interface OptimisticUpdateOptions<T> {
  onSuccess?: (data: T) => void
  onError?: (error: Error) => void
  successMessage?: string
  errorMessage?: string
  revertOnError?: boolean
}

export function useOptimisticUpdate<T>(
  initialData: T,
  updateFn: (optimisticData: T) => Promise<T>,
  options: OptimisticUpdateOptions<T> = {}
) {
  const [data, setData] = useState<T>(initialData)
  const [isUpdating, setIsUpdating] = useState(false)
  const [isPending, startTransition] = useTransition()
  const [previousData, setPreviousData] = useState<T | null>(null)

  const {
    onSuccess,
    onError,
    successMessage = 'Updated successfully',
    errorMessage = 'Failed to update',
    revertOnError = true,
  } = options

  const optimisticUpdate = useCallback(
    async (newData: T | ((prev: T) => T)) => {
      const optimisticData = typeof newData === 'function' 
        ? (newData as (prev: T) => T)(data)
        : newData

      // Store previous data for potential revert
      setPreviousData(data)
      
      // Optimistically update UI
      startTransition(() => {
        setData(optimisticData)
      })

      setIsUpdating(true)

      try {
        // Perform actual update
        const result = await updateFn(optimisticData)
        
        // Update with server response
        setData(result)
        
        // Show success message
        if (successMessage) {
          toast.success(successMessage)
        }
        
        // Call success callback
        onSuccess?.(result)
        
        // Clear previous data
        setPreviousData(null)
        
        return result
      } catch (error) {
        console.error('Optimistic update failed:', error)
        
        // Revert to previous data if configured
        if (revertOnError && previousData !== null) {
          setData(previousData)
        }
        
        // Show error message
        if (errorMessage) {
          toast.error(errorMessage)
        }
        
        // Call error callback
        onError?.(error as Error)
        
        throw error
      } finally {
        setIsUpdating(false)
      }
    },
    [data, updateFn, onSuccess, onError, successMessage, errorMessage, revertOnError, previousData]
  )

  const reset = useCallback(() => {
    if (previousData !== null) {
      setData(previousData)
      setPreviousData(null)
    }
  }, [previousData])

  return {
    data,
    setData,
    optimisticUpdate,
    isUpdating: isUpdating || isPending,
    reset,
  }
}

// Example usage for lists
export function useOptimisticList<T extends { id: string | number }>(
  initialItems: T[],
  handlers: {
    add: (item: T) => Promise<T>
    update: (id: string | number, updates: Partial<T>) => Promise<T>
    remove: (id: string | number) => Promise<void>
  }
) {
  const [items, setItems] = useState<T[]>(initialItems)
  const [isUpdating, setIsUpdating] = useState(false)

  const optimisticAdd = useCallback(
    async (newItem: T) => {
      // Optimistically add item
      setItems(prev => [...prev, newItem])
      setIsUpdating(true)

      try {
        const result = await handlers.add(newItem)
        // Replace optimistic item with server response
        setItems(prev => prev.map(item => 
          item.id === newItem.id ? result : item
        ))
        toast.success('Item added successfully')
        return result
      } catch (error) {
        // Remove optimistic item on error
        setItems(prev => prev.filter(item => item.id !== newItem.id))
        toast.error('Failed to add item')
        throw error
      } finally {
        setIsUpdating(false)
      }
    },
    [handlers]
  )

  const optimisticUpdate = useCallback(
    async (id: string | number, updates: Partial<T>) => {
      // Store original item
      const originalItem = items.find(item => item.id === id)
      if (!originalItem) throw new Error('Item not found')

      // Optimistically update item
      setItems(prev => prev.map(item => 
        item.id === id ? { ...item, ...updates } : item
      ))
      setIsUpdating(true)

      try {
        const result = await handlers.update(id, updates)
        // Update with server response
        setItems(prev => prev.map(item => 
          item.id === id ? result : item
        ))
        toast.success('Item updated successfully')
        return result
      } catch (error) {
        // Revert to original item on error
        setItems(prev => prev.map(item => 
          item.id === id ? originalItem : item
        ))
        toast.error('Failed to update item')
        throw error
      } finally {
        setIsUpdating(false)
      }
    },
    [items, handlers]
  )

  const optimisticRemove = useCallback(
    async (id: string | number) => {
      // Store original items
      const originalItems = items
      
      // Optimistically remove item
      setItems(prev => prev.filter(item => item.id !== id))
      setIsUpdating(true)

      try {
        await handlers.remove(id)
        toast.success('Item removed successfully')
      } catch (error) {
        // Restore original items on error
        setItems(originalItems)
        toast.error('Failed to remove item')
        throw error
      } finally {
        setIsUpdating(false)
      }
    },
    [items, handlers]
  )

  return {
    items,
    setItems,
    optimisticAdd,
    optimisticUpdate,
    optimisticRemove,
    isUpdating,
  }
}