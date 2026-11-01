# Screen-reader verification — BLOCKED

Task: run the borrower journeys with NVDA and report what is actually announced.

**Status: BLOCKED — NVDA is not installed on this machine, no screen-reader test was performed, and
nothing in this document is a screen-reader result.** Installing software or changing machine-level
settings was outside the authorization for this task, so the installation steps are written for a
human to run.

Captured 2026-11-01 on `VICTUS-LAPTOP`, branch `feat/frappe-borrower-platform`.

## 1. Machine facts, each from a command that can be re-run

| Question | Command | Result |
| --- | --- | --- |
| Is NVDA running? | `Get-Process NVDA` | **0 processes** |
| Is NVDA installed anywhere? | `Test-Path` on `%LOCALAPPDATA%\NVDA`, `%APPDATA%\NVDA`, `C:\Program Files\NVDA`, `C:\Program Files (x86)\NVDA` | **none exist** |
| Any NVDA configuration or uninstall record? | `Test-Path HKCU:\Software\NVDA`; registry uninstall keys matched against `NVDA\|JAWS\|ZoomText\|Window Eyes` | **`False`; no matches** — no other screen reader is installed either |
| Supported browser present? | file version of `msedge.exe` / `chrome.exe` | Edge **156.0.4314.58**, Chrome **156.0.8078.74**. Firefox is **not** installed. |
| Usable desktop session? | `$env:SESSIONNAME` = **Console**, `$env:USERNAME` = `golla`, `Win32_ComputerSystem.UserName` = `VICTUS-LAPTOP\golla` | an interactive, unlocked desktop exists |
| Audio output service? | `(Get-Service Audiosrv).Status` | **Running** |
| Windows version vs NVDA requirement | `(Get-CimInstance Win32_OperatingSystem)` | Windows 11 Home Single Language, build **26200** — NVDA requires Windows 10/11 or Server 2016+, so the OS is supported |
| Accessibility platform | `Test-Path C:\WINDOWS\System32\UIAutomationCore.dll` | present |
| Windows built-in reader | `Test-Path C:\WINDOWS\System32\Narrator.exe` / `Get-Process Narrator` | **present, not running.** It was not started: substituting Narrator for NVDA would not answer the finding, and launching a screen reader changes the machine for the person sitting at it. |
| .NET Framework | `HKLM:\SOFTWARE\Microsoft\NET Framework Setup\NDP\v4\Full` → `Release` | **533509** (.NET 4.8.1) |
| Speech simulation used instead? | — | **No.** No text-to-speech was generated, synthesised, recorded or transcribed for this task. |

Limitation: `query session` returned no rows in this shell, so the session enumeration rests on the
environment variables and WMI values above rather than on Terminal Services output.

Everything the task needed is present except NVDA itself. This is a one-time install decision, not an
architecture gap.

## 2. Why this is not being worked around

Three substitutions were available and all three were refused, because each would produce a claim that
does not mean what it looks like:

- **axe-core is not a screen reader.** It checks the markup and the accessibility tree. It cannot say
  what NVDA speaks, in what order, or how much of it the user hears.
- **The accessibility tree is not the spoken output.** Chrome's AX tree carries nodes, roles and names;
  NVDA adds verbosity settings, keyboard-focus behaviour, layout-table handling, live-region timing and
  its own summarisation. A node that exists in the tree can be skipped, deferred or rephrased in speech.
- **Keyboard-only is not screen-reader-only.** Tab order proves reachability. It proves nothing about
  being told what you have reached.

The findings that remain genuinely open are exactly the ones only speech can close: whether a borrower
who cannot see the page learns the masked PAN/Aadhaar state, the card type of each assistant answer, and
the moment a run finishes.

## 3. Installation instructions (human, authorized)

From the official NV Access distribution only — no third-party mirror, no package manager copy:

1. Open **<https://www.nvaccess.org/download/>**. The current stable release is **NVDA 2026.3**;
   requirements are Windows 10/11 or Server 2016 or later.
2. Press the single **Download** button. The launcher (`nvda_2026.3.exe`) starts automatically when the
   download finishes.
3. The launcher offers three choices, labelled exactly as follows in the 2026.3 user guide:
   - **Install NVDA** — needed for the journeys below, because NVDA must start with Windows and run in
     the background while a browser is used.
   - **Create portable copy** — writes to a chosen folder; useful on a shared test machine.
   - **Continue running** — uses the launcher's temporary copy; nothing is installed. Adequate for a
     single pass, but it does not survive a reboot and keeps no configuration.
4. Accept the default options unless the person testing has their own speech, braille or verbosity
   settings.
5. To record which build is actually speaking: `NVDA+N`, then `h`, then `b` opens the **About NVDA**
   dialog with the version and whether this is an installed or portable copy. That line belongs on the
   sheet below.
6. Release documentation and key reference: the NVDA 2026.3 User Guide,
   <https://download.nvaccess.org/releases/2026.3/documentation/userGuide.html>.

No application code change is needed first. The portal is a set of ordinary HTML pages plus one
CopilotKit island, all reachable from a browser at `http://127.0.0.1:8081` when the acceptance stack is
up ([environment/services-started.txt](environment/services-started.txt) records how it is started).

## 4. Journeys to run, and what to observe

Browser: Edge 156 (NVDA's best-supported browser alongside Firefox). Start NVDA, then the browser.
Site: `http://127.0.0.1:8081`. Sign in as a seeded acceptance borrower. The credentials this task used
were deleted when the run finished, so seed a fresh set first — never check them into a document:

```bash
docker exec loanrangers-backend-1 bench --site loanportal.local execute \
  loan_advisory_portal.tests.e2e_seed.seed --kwargs '{"tag": "sr1"}'
docker cp loanrangers-backend-1:/tmp/loanportal-e2e/sr1.json "$TEMP/loanportal-e2e/sr1.json"
docker exec loanrangers-backend-1 rm -f /tmp/loanportal-e2e/sr1.json
```

That creates `sr1-borrower@example.invalid` and `sr1-other@example.invalid`, plus two applications whose
`ACC-LOAP-…` names come from the naming series and are stored in the credentials file at
`victim.application` and `other.application`. Read the borrower email and the application id from that
file, and delete the file when the NVDA session is over. The journeys below were written against the `closure1` fixtures
(`closure1-borrower@example.invalid`, application `ACC-LOAP-2026-00020`), so substitute the new
application id wherever one appears. Afterwards, remove the fixtures:

```bash
docker exec loanrangers-backend-1 bench --site loanportal.local execute \
  loan_advisory_portal.tests.e2e_seed.teardown --kwargs '{"tag": "sr1"}'
```

Do not use the read-only Playwright harnesses for this: they attach a write guard and run headless, and
a screen-reader test needs a real window with real speech.

Record for every row: **what was actually heard**, not what the markup says should be heard.

| # | Journey | Route | Observe specifically |
| --- | --- | --- | --- |
| 1 | Sign in | `/login?redirect-to=%2Fborrower` | Does the `#login-error` alert speak itself when it appears after an empty submit, or only when focus reaches it? Is the field's invalid state announced with the error text, and does the announced order let the user connect message to field? |
| 2 | Dashboard | `/borrower` | Landmark announcement on entry (`banner`/`main`/`contentinfo`), the application status card's name, whether "Skip to content" is announced and usable, and whether the tab bar at 390 px is intelligible by voice alone. |
| 3 | Application wizard | `/borrower/apply` | Per-step: is "Step 1 of 5: About you" announced; does a validation error interrupt or queue; is the "Saving to your profile" state heard at all; does the step change move focus or only the viewport? |
| 4 | Identity (KYC) | `/borrower/kyc` | Whether the masked values are spoken as `PAN ••••••••••` (and what NVDA does with the bullet characters), whether "Not verified"/"Preview only" are heard in context, whether the Aadhaar 4-digit input announces its constraint, and whether the locked step 3 ("Camera and biometric checks are not implemented") is understandable without sight of the badge. |
| 5 | AI advisory workspace | `/borrower/assistant?application=ACC-LOAP-2026-00020` | The important one. Is the progress stage heard while a run is in flight; is the streamed answer read as it grows or only at the end; are the GenUI cards announced as cards (Missing Information, decision, citations) with their content, or flattened into text; is the end of the turn distinguishable from a pause; can the user ask a follow-up without re-reading the page. |

For journey 5 also try the stub-backed path (`STUB_APPLICATION=ACC-LOAP-2026-00020`, runtime `:4200`,
stub `:8096`) so the wording is deterministic and two runs can be compared, and the real model path for
one run so streaming timing is exercised.

### Recording sheet

| Field | Value |
| --- | --- |
| NVDA version and copy type | **About NVDA** dialog: `NVDA+N`, `h`, `b` |
| Browser and version | |
| Windows build | `winver` |
| Speech verbosity / punctuation level used | NVDA default unless changed, then say what changed |
| Date, start and end time | |
| Journey result | one of: worked as expected / announced but confusing / not announced / blocked |
| Problems found | paste the exact NVDA speech where it can be captured (NVDA Log Viewer: `NVDA+n`, `t`, `l`) |
| Retest after each fix | same journey, same prompt, what differed |

## 5. What is and is not established today

| Method | Coverage | Status |
| --- | --- | --- |
| Verified with NVDA | every row in §4 | **BLOCKED — not started; NVDA absent** |
| Verified with another screen reader | Narrator is installed but was not run | **NOT VERIFIED** |
| Accessibility-tree inspection (Chrome AX tree, axe-core 4.14 names/roles) | 103 runs × 5 widths, 0 violations, plus a per-view AX-tree capture in [kyc-contrast/keyboard/keyboard-and-ax-tree.json](kyc-contrast/keyboard/keyboard-and-ax-tree.json) | **VERIFIED for the tree only** — roles, names, landmarks, live-region presence, 0 unnamed controls, 0 dangling ARIA references |
| Keyboard-only walkthrough | 30 page/width walks, 605 tab stops, 605/605 visible focus indicator, no traps, Enter/Space activation checked, focus-after-error checked | **VERIFIED** |
| Spoken output, announcement order, verbosity, interruption behaviour, braille | — | **NOT TESTED** |

The distinction matters for the open finding in particular: the advisory workspace's `role=status`
progress nodes exist in the tree and are counted as live regions in the tree inspection. Whether NVDA
speaks them, and speaks them early enough for a borrower to know the answer is still coming, is unknown
and cannot be inferred from that.
