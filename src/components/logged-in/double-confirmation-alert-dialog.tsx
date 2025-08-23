'use client'

import { useState } from 'react'
import { useHotkeys } from 'react-hotkeys-hook'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '../ui/alert-dialog'
import { Kbd, SHORTCUTS_VALUES } from '../ui/kbd'

interface DoubleConfirmationAlertDialogProps {
  children: React.ReactNode
  title: string
  description: string
  onConfirm: () => void | Promise<void>
}

export function DoubleConfirmationAlertDialog({
  children,
  title,
  description,
  onConfirm,
}: DoubleConfirmationAlertDialogProps) {
  const [isOpen, setIsOpen] = useState(false)

  useHotkeys(['esc'], () => {
    setIsOpen(false)
  })

  useHotkeys(['meta+enter'], () => {
    if (!isOpen) {
      return
    }

    onConfirm()
    setIsOpen(false)
  })

  return (
    <AlertDialog open={isOpen} onOpenChange={setIsOpen}>
      <AlertDialogTrigger asChild>{children}</AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          <AlertDialogDescription>{description}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>
            Cancel <Kbd variant="outline">{SHORTCUTS_VALUES.ESC}</Kbd>
          </AlertDialogCancel>
          <AlertDialogAction onClick={onConfirm} variant="destructive">
            Continue{' '}
            <Kbd variant="destructive">
              {SHORTCUTS_VALUES.CMD} + {SHORTCUTS_VALUES.ENTER}
            </Kbd>
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
