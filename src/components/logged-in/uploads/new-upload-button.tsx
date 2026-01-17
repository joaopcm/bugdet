"use client";

import { useHotkeys } from "react-hotkeys-hook";
import { Button } from "@/components/ui/button";
import { Kbd } from "@/components/ui/kbd";

const NEW_UPLOAD_SHORTCUT = "N";

export function NewUploadButton() {
  function triggerUpload() {
    document.getElementById("bank-statement-upload")?.click();
  }

  useHotkeys(NEW_UPLOAD_SHORTCUT, triggerUpload);

  return (
    <Button onClick={triggerUpload}>
      New upload
      <Kbd className="-mr-2" variant="default">
        {NEW_UPLOAD_SHORTCUT}
      </Kbd>
    </Button>
  );
}
