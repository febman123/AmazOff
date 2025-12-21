#!/bin/sh

launch_target() {
  require_root
  log "launch: luna launch id=$TARGET_ID"
  command -v luna-send >/dev/null 2>&1 || die "luna-send not found"
  luna-send -n 1 luna://com.webos.applicationManager/launch "{"id":"$TARGET_ID"}" >>"$LOG" 2>&1 || die "launch failed"
}
