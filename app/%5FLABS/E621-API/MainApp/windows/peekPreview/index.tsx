import { useEffect, useState } from "react"
import { _app } from "@/app/_app"
import { E621 } from "@/app/%5FLABS/E621-API/types/e621"
import React from "react"
import { disableWindowKeyEvent, wmRef } from "../../core/globals"
import { getWindowTitle } from "../../core/helpers"
import { ViewerWindow } from "../viewerWindow"

export const peekPreview = function () {
  const windowID = `peek-preview`;
  const thisWindow = wmRef.current?.getWindow(windowID);

  const savedData = thisWindow?.customData?.type === "preview"
    ? thisWindow.customData.data
    : undefined;

  const [fetchedPost] = useState<E621.Post>(savedData!);

  useEffect(() => {
    thisWindow?.setTitle(getWindowTitle({ type: "preview", data: fetchedPost }))
  }, [])

  useEffect(() => {
    const keydown = (e: KeyboardEvent) => {
      if (disableWindowKeyEvent) return;
      if (!thisWindow?.isFocused) return;

      if (e.code === "Escape") thisWindow.close();
    }

    const keyup = (e: KeyboardEvent) => {
      if (!thisWindow?.isFocused) return;

      if (e.code === "Space") thisWindow.close();
    }

    document.addEventListener("keydown", keydown)
    document.addEventListener("keyup", keyup)
    thisWindow?.addEventListener("blur", () => thisWindow.close())

    return () => {
      document.removeEventListener("keydown", keydown)
      document.removeEventListener("keyup", keyup)
    }
  }, [])

  return (<ViewerWindow post={fetchedPost} winID="peek-preview" notViewer={true} />);

}
