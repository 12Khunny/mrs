!include "LogicLib.nsh"
!include "nsDialogs.nsh"
!include "WinMessages.nsh"

Var DeleteUserData
Var DeleteUserDataCheckbox

Function un.PageDeleteUserData
  nsDialogs::Create 1018
  Pop $0
  ${If} $0 == error
    Abort
  ${EndIf}

  ${NSD_CreateLabel} 0 0 100% 24u "Do you want to remove MRS user data (config, logs) from this PC?"
  Pop $1

  ${NSD_CreateCheckbox} 0 28u 100% 12u "Remove user data in %APPDATA%\\MRS and %LOCALAPPDATA%\\MRS"
  Pop $DeleteUserDataCheckbox
  ${NSD_SetState} $DeleteUserDataCheckbox ${BST_UNCHECKED}

  nsDialogs::Show
FunctionEnd

Function un.PageDeleteUserDataLeave
  ${NSD_GetState} $DeleteUserDataCheckbox $DeleteUserData
FunctionEnd

UninstPage custom un.PageDeleteUserData un.PageDeleteUserDataLeave

!macro customInstall
  DetailPrint "Installing MRS ReaderService"
  SetOutPath "$INSTDIR\\reader-service"

  ${If} ${FileExists} "$INSTDIR\\resources\\reader-service\\MRS.ReaderService.exe"
    nsExec::ExecToLog 'sc.exe query "MRS Reader Service"'
    Pop $0
    ${If} $0 == 0
      nsExec::ExecToLog 'sc.exe stop "MRS Reader Service"'
      nsExec::ExecToLog 'sc.exe delete "MRS Reader Service"'
    ${EndIf}

    nsExec::ExecToLog 'sc.exe create "MRS Reader Service" binPath= "\"$INSTDIR\\resources\\reader-service\\MRS.ReaderService.exe\" --urls http://localhost:5261" start= auto'

    nsExec::ExecToLog 'sc.exe failure "MRS Reader Service" reset= 0 actions= restart/5000'
    nsExec::ExecToLog 'sc.exe start "MRS Reader Service"'
  ${Else}
    DetailPrint "ReaderService binary not found; skipping service install"
  ${EndIf}
!macroend

!macro customUnInstall
  DetailPrint "Removing MRS ReaderService"
  nsExec::ExecToLog 'sc.exe stop "MRS Reader Service"'
  nsExec::ExecToLog 'sc.exe delete "MRS Reader Service"'

  ${If} $DeleteUserData == ${BST_CHECKED}
    DetailPrint "Removing MRS user data"
    RMDir /r "$APPDATA\\MRS"
    RMDir /r "$LOCALAPPDATA\\MRS"
  ${EndIf}
!macroend
