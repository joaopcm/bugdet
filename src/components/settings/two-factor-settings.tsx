'use client'

import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { authClient } from '@/lib/auth/client'
import { useState } from 'react'
import { BackupCodesDialog } from './backup-codes-dialog'
import { DisableTwoFactorDialog } from './disable-two-factor-dialog'
import { EnableTwoFactorDialog } from './enable-two-factor-dialog'

export function TwoFactorSettings() {
  const { data: session, isPending } = authClient.useSession()
  const [showEnableDialog, setShowEnableDialog] = useState(false)
  const [showDisableDialog, setShowDisableDialog] = useState(false)
  const [showBackupCodesDialog, setShowBackupCodesDialog] = useState(false)

  const isTwoFactorEnabled = session?.user?.twoFactorEnabled

  if (isPending) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Two-factor authentication</CardTitle>
          <CardDescription>Loading...</CardDescription>
        </CardHeader>
      </Card>
    )
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>Two-factor authentication</CardTitle>
          <CardDescription>
            Add an extra layer of security to your account by requiring a
            verification code in addition to your password.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-4">
            {isTwoFactorEnabled ? (
              <div className="flex flex-wrap gap-2">
                <Button
                  variant="outline"
                  onClick={() => setShowBackupCodesDialog(true)}
                >
                  View backup codes
                </Button>
                <Button
                  variant="destructive"
                  onClick={() => setShowDisableDialog(true)}
                >
                  Disable 2FA
                </Button>
              </div>
            ) : (
              <div className="flex flex-wrap">
                <Button onClick={() => setShowEnableDialog(true)}>
                  Enable 2FA
                </Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <EnableTwoFactorDialog
        open={showEnableDialog}
        onOpenChange={setShowEnableDialog}
      />

      <DisableTwoFactorDialog
        open={showDisableDialog}
        onOpenChange={setShowDisableDialog}
      />

      <BackupCodesDialog
        open={showBackupCodesDialog}
        onOpenChange={setShowBackupCodesDialog}
      />
    </>
  )
}
