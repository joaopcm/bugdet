"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { authClient } from "@/lib/auth/client";
import { trpc } from "@/lib/trpc/client";
import { ProfilePictureDialog } from "./profile-picture-dialog";

export function ProfilePictureSettings() {
  const {
    data: session,
    isPending,
    refetch: refetchSession,
  } = authClient.useSession();
  const [showUploadDialog, setShowUploadDialog] = useState(false);
  const [isRemoving, setIsRemoving] = useState(false);

  const { mutateAsync: removeProfilePicture } =
    trpc.users.removeProfilePicture.useMutation();

  async function handleRemove() {
    setIsRemoving(true);

    try {
      await removeProfilePicture();
      await refetchSession();
      toast.success("Profile picture removed");
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Failed to remove profile picture";
      toast.error(message);
    } finally {
      setIsRemoving(false);
    }
  }

  if (isPending) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Profile picture</CardTitle>
          <CardDescription>Loading...</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  const user = session?.user;
  const hasProfilePicture = !!user?.image;

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>Profile picture</CardTitle>
          <CardDescription>
            Upload a profile picture to personalize your account.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4">
            <Avatar className="h-16 w-16">
              <AvatarImage alt={user?.name} src={user?.image ?? undefined} />
              <AvatarFallback className="bg-primary text-lg">
                {user?.name?.charAt(0) ?? "U"}
              </AvatarFallback>
            </Avatar>
            <div className="flex flex-wrap gap-2">
              <Button onClick={() => setShowUploadDialog(true)}>
                {hasProfilePicture ? "Change picture" : "Upload picture"}
              </Button>
              {hasProfilePicture && (
                <Button
                  disabled={isRemoving}
                  onClick={handleRemove}
                  variant="outline"
                >
                  Remove
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      <ProfilePictureDialog
        onOpenChange={setShowUploadDialog}
        open={showUploadDialog}
      />
    </>
  );
}
