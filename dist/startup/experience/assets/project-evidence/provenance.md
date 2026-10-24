# Project evidence assets

Verified 22 October 2026. These are unmodified existing project assets, not generated imagery, mock screenshots or Lusion assets. They are being reused for Sharon's own portfolio under the user's authorization to showcase these projects. No public-reuse licence is invented: the two public project repositories currently expose no root LICENSE file. Required source credits are retained below.

## Current Lions Robotics photograph

`lions-worlds-robot.jpg` is the actual 1605 × 1906 robot photograph from
https://raw.githubusercontent.com/sharonbasovich/828555Sworlds/main/robot.jpg,
linked by Sharon's public Worlds repository README. It shows the physical VEX V5
robot on the field. It replaces the unrelated drawing-robot project image.
The image is copied unmodified. The source repository distinguishes experimental
MCL from the odometry/IMU competition stack; no claim of Worlds MCL deployment is
added. Current project bullets copy the approved résumé verbatim.

`marble-workflows.svg` is a code-native explanatory diagram based on the approved
résumé, covering the research graph, news extraction, and Python pair screener.
It is labeled illustrative and is not a screenshot or measured output. The
project-title photo-through-type effect now follows this first project asset.

## Historical drawing-robot source (not shipped)

- **Kind:** actual hackathon prototype photograph.
- **Dimensions / bytes:** 1417 × 667; 1,602,687 bytes.
- **SHA-256:** `f1fa23c85321e77a2bcbe739fd1aaab2d66c0216ff032817edb01ddda93eb5e7`.
- **Public image:** https://github.com/user-attachments/assets/a292e0cc-53e4-427b-acbb-894699e0bfe8
- **Pinned repository context:** https://github.com/sharonbasovich/undercity/blob/6c3d920e2efef726b4260d848923d5abd8d5987b/README.md
- **Ownership/context:** public, non-fork repository owned by `sharonbasovich`. The README calls the team project **404: Drink Not Found**, created at Hack Club Undercity. It combines a Tic-Tac-Toe drawing machine, AI character, collaborative mosaic and vending hardware.
- **Visible content:** the laptop game/mosaic interface on the left; the blue Blot plotter and paper in the centre; touch display and vending prototype on the right. This is a photograph of the team's actual setup, not a clean render of an industrial robot arm.
- **Suggested use:** preserve the full photograph in a wide frame. If a tighter CSS crop is needed, favour the central plotter and left laptop rather than implying the vending turntable is the drawing robot. The complete native ratio is approximately 2.12:1. Avoid severe portrait crops that remove both the interface and plotter.
- **Suggested caption:** “Undercity prototype · React interface and physical Blot plotter.”
- **Source credits:** the README credits the Auto character inspiration to [Paolo](https://www.youtube.com/watch?v=M4BQyCwvZE4) and identifies the plotting hardware as the [Hack Club Blot kit](https://blot.hackclub.com/). The photo includes ordinary drink packaging incidentally; no standalone product/brand artwork from the repository was copied.

Code-backed architecture details, if a companion vector diagram is useful:

1. React/TypeScript game frontend, linked by the project README to [blot-board-blitz](https://github.com/sharonbasovich/blot-board-blitz).
2. Flask game endpoints `/start`, `/move`, `/ai-move`, `/state` in [ttt_backend_corner5.py](https://github.com/sharonbasovich/undercity/blob/6c3d920e2efef726b4260d848923d5abd8d5987b/blot-backend/ttt_backend_corner5.py).
3. `send_message` packs a command and payload, COBS-encodes the message, appends a zero delimiter and places it on a queue. A worker writes queued messages to serial.
4. Coordinate commands drive `go(x, y)` and servo pen-up/pen-down operations. The same source contains game-board and mosaic drawing functions.

These verified files do not establish a computer-vision pipeline. Do not add one to a diagram based on this source.

## skycell-replay.jpg

- **Kind:** actual screenshot of the project's archived flight replay dashboard.
- **Dimensions / bytes:** 1280 × 1500; 137,870 bytes.
- **SHA-256:** `63724b7362688a22c44408439a5ef3dd103d63ff7465e708998aca4687f9e7c4`.
- **Pinned public source:** https://github.com/sharonbasovich/skycell/blob/16d83f3405f9e38387cebdcf664a531a1de5f232/docs/demo.jpg
- **Raw image:** https://raw.githubusercontent.com/sharonbasovich/skycell/16d83f3405f9e38387cebdcf664a531a1de5f232/docs/demo.jpg
- **Ownership/context:** public, non-fork repository owned by `sharonbasovich`; README describes a four-student team project. The local file's Git blob hash `7313ed16a655bdca50f7d0355885f465c9dac2db` exactly matches the public tree at the pinned revision.
- **Visible content:** archive provenance, recorded summary metrics, replay controls, altitude/speed/temperature plots, 3D flight trajectory and current tracker values.
- **Suggested use:** treat this as a genuine tall software screenshot. A contained tall view preserves the real interface. For a wide detail frame, crop approximately the replay-control/charts region, retaining both the altitude plot and 3D path; pair it with a caption that explicitly identifies the archive. Do not stretch it or relabel the displayed values as SkyCell payload measurements.
- **Suggested caption:** “Flight replay · Archived APEX / SondeHub tracker data.”
- **Data boundary:** the screenshot replays actual APEX-2-T / SondeHub tracker data, confirmed by the team. It is not a live receiver dashboard and not a recording of SkyCell's separate 915 MHz Meshtastic payload. The [data documentation](https://github.com/sharonbasovich/skycell/blob/16d83f3405f9e38387cebdcf664a531a1de5f232/docs/data.md) states that the community export has no independently asserted exclusive ownership/licence.

Code/documentation-backed software flow:

`CSV archive → validated UTC observations → shared replay clock → synchronized charts, trajectory and current readings`.

The [README](https://github.com/sharonbasovich/skycell/blob/16d83f3405f9e38387cebdcf664a531a1de5f232/README.md) and data documentation describe timestamp sorting/deduplication, binary-search sample selection, short-gap position interpolation and preserved reception gaps above 60 seconds.

An additional actual payload photo is available at [public/gallery/1000004195.jpg](https://github.com/sharonbasovich/skycell/blob/16d83f3405f9e38387cebdcf664a531a1de5f232/public/gallery/1000004195.jpg), 605,949 bytes, but was not duplicated here because the dashboard is the stronger software proof and the implementation should avoid unused production assets.

## Marble: evidence limit and safe diagram brief

The current portfolio links Marble details to the resume, not a public implementation repository. A bounded inspection of Sharon's public repository list did not identify a clearly attributable Marble codebase or screenshot. No private investment dashboard, unrelated finance image, sample company data or claimed code screenshot was copied.

If a third visual is needed, make it an explicitly labelled **workflow diagram**, with two separate lanes based on the user's confirmed project description:

1. **Research relationships → React relationship graph.** Roughly 500 companies and 1,500+ manually identified relationships. Abstract nodes are illustrative; do not invent real company names or imply the illustrated graph is a production screenshot.
2. **News feed → deduplication → LLM extraction → structured event fields.** Fields include relevance, sentiment, affected companies and event category. The confirmed approximate throughput is 1,000–2,000 articles/day.

Do not draw an automatic connection from extracted news directly into the manually researched relationship graph unless that integration is confirmed. Do not invent a graph database, cloud provider, scheduling system, API design or measured latency. These Marble facts are **user-confirmed, not independently code-verified**. The diagram must remain clearly distinguishable from actual software evidence.

## Presentation consistency

Use the existing cobalt/paper typography, one consistent evidence frame and small factual captions around these assets. Preserve original pixels; use CSS framing for presentation. The robot photo demonstrates the physical prototype, the SkyCell image demonstrates working software, and a labelled Marble diagram would explain the research workflow without manufacturing missing product imagery.

## Compressed delivery derivative

drawing-robot-prototype.webp preserves the full photograph at 1417 × 667, encoded at WebP quality 86 for delivery (110120 bytes). SHA-256: f178a7288747248df4f8e763c4f7be568129cd3c54e0210488591aa82f264d68. The PNG above remains the source reference; the delivered image is not retouched or cropped.
