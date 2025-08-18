'use client'

import * as React from 'react'
import { cn } from '../../lib/utils'
import { Button } from './button'
import { 
  Bold, 
  Italic, 
  Underline, 
  Link, 
  List, 
  ListOrdered,
  Heading1,
  Heading2,
  Quote,
  Code,
  Undo,
  Redo
} from 'lucide-react'

export interface EditorProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  className?: string
  disabled?: boolean
}

export const Editor = React.forwardRef<HTMLDivElement, EditorProps>(
  ({ value, onChange, placeholder, className, disabled }, ref) => {
    const editorRef = React.useRef<HTMLDivElement>(null)
    const [selection, setSelection] = React.useState<Range | null>(null)

    // Save selection before toolbar actions
    const saveSelection = () => {
      const sel = window.getSelection()
      if (sel && sel.rangeCount > 0) {
        setSelection(sel.getRangeAt(0))
      }
    }

    // Restore selection after toolbar actions
    const restoreSelection = () => {
      if (selection && editorRef.current) {
        const sel = window.getSelection()
        if (sel) {
          sel.removeAllRanges()
          sel.addRange(selection)
        }
      }
    }

    // Execute formatting command
    const execCommand = (command: string, value?: string) => {
      restoreSelection()
      document.execCommand(command, false, value)
      if (editorRef.current) {
        onChange(editorRef.current.innerHTML)
      }
      editorRef.current?.focus()
    }

    // Format block-level elements
    const formatBlock = (tag: string) => {
      restoreSelection()
      document.execCommand('formatBlock', false, tag)
      if (editorRef.current) {
        onChange(editorRef.current.innerHTML)
      }
      editorRef.current?.focus()
    }

    // Handle content changes
    const handleInput = () => {
      if (editorRef.current) {
        onChange(editorRef.current.innerHTML)
      }
    }

    // Set initial content
    React.useEffect(() => {
      if (editorRef.current && editorRef.current.innerHTML !== value) {
        editorRef.current.innerHTML = value || ''
      }
    }, [value])

    // Toolbar buttons
    const ToolbarButton = ({ 
      icon: Icon, 
      command, 
      value,
      title 
    }: { 
      icon: React.ElementType
      command?: string
      value?: string
      title: string
    }) => (
      <Button
        type="button"
        variant="ghost"
        size="sm"
        className="h-8 w-8 p-0"
        onClick={() => command && execCommand(command, value)}
        onMouseDown={saveSelection}
        disabled={disabled}
        title={title}
      >
        <Icon className="h-4 w-4" />
      </Button>
    )

    return (
      <div className={cn("border rounded-lg overflow-hidden", className)}>
        {/* Toolbar */}
        <div className="border-b bg-muted/50 p-1 flex flex-wrap gap-1">
          <div className="flex gap-0.5">
            <ToolbarButton icon={Bold} command="bold" title="Bold" />
            <ToolbarButton icon={Italic} command="italic" title="Italic" />
            <ToolbarButton icon={Underline} command="underline" title="Underline" />
          </div>
          
          <div className="w-px bg-border" />
          
          <div className="flex gap-0.5">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0"
              onClick={() => formatBlock('h1')}
              onMouseDown={saveSelection}
              disabled={disabled}
              title="Heading 1"
            >
              <Heading1 className="h-4 w-4" />
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0"
              onClick={() => formatBlock('h2')}
              onMouseDown={saveSelection}
              disabled={disabled}
              title="Heading 2"
            >
              <Heading2 className="h-4 w-4" />
            </Button>
          </div>
          
          <div className="w-px bg-border" />
          
          <div className="flex gap-0.5">
            <ToolbarButton icon={List} command="insertUnorderedList" title="Bullet List" />
            <ToolbarButton icon={ListOrdered} command="insertOrderedList" title="Numbered List" />
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0"
              onClick={() => formatBlock('blockquote')}
              onMouseDown={saveSelection}
              disabled={disabled}
              title="Quote"
            >
              <Quote className="h-4 w-4" />
            </Button>
          </div>
          
          <div className="w-px bg-border" />
          
          <div className="flex gap-0.5">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0"
              onClick={() => {
                const url = window.prompt('Enter URL:')
                if (url) execCommand('createLink', url)
              }}
              onMouseDown={saveSelection}
              disabled={disabled}
              title="Insert Link"
            >
              <Link className="h-4 w-4" />
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0"
              onClick={() => formatBlock('pre')}
              onMouseDown={saveSelection}
              disabled={disabled}
              title="Code Block"
            >
              <Code className="h-4 w-4" />
            </Button>
          </div>
          
          <div className="w-px bg-border" />
          
          <div className="flex gap-0.5">
            <ToolbarButton icon={Undo} command="undo" title="Undo" />
            <ToolbarButton icon={Redo} command="redo" title="Redo" />
          </div>
        </div>

        {/* Editor */}
        <div
          ref={(el) => {
            editorRef.current = el
            if (ref) {
              if (typeof ref === 'function') ref(el)
              else ref.current = el
            }
          }}
          contentEditable={!disabled}
          className={cn(
            "min-h-[300px] p-4 focus:outline-none prose prose-sm max-w-none",
            "prose-headings:font-semibold prose-p:my-2",
            "[&:empty:before]:content-[attr(data-placeholder)] [&:empty:before]:text-muted-foreground",
            disabled && "opacity-50 cursor-not-allowed"
          )}
          onInput={handleInput}
          onMouseUp={saveSelection}
          onKeyUp={saveSelection}
          data-placeholder={placeholder || "Start typing..."}
          suppressContentEditableWarning
        />
      </div>
    )
  }
)

Editor.displayName = 'Editor'