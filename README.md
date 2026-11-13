# CartPath

Mobile-first planning map for standard golf carts in Winter Garden and Oakland, Florida.

The map distinguishes municipal corridors, restricted roads, authorized Oakland Avenue crossings, and Oakland Park community roads. Community-provided access information indicates that Oakland Park roads and exits permit golf-cart use; current HOA rules and posted signs still control. Oakland Avenue remains crossing-only, including the community-reported crossing into McKinnon Square.

Drive mode follows the device's live GPS position and displays a glanceable status: green near a mapped permitted corridor, red near a mapped restriction, and amber where the current road is not yet classified. The January 2026 connection from Civitas Way through Tildenville School Road, Brick Road, West Story Road, and West Plant Street is shown as part of the permitted network rather than as a required route.

Oakland Park is modeled as one continuous community road network spanning the Oakland/Winter Garden municipal boundary. The public route begins at the Oakland Park Community House, 1000 Civitas Way, and continues east on Civitas without exposing a resident's home street. There is no physical gap at the jurisdiction line.

Open `dist/index.html` through a web server. Browser geolocation requires HTTPS (or localhost) and user permission. Drive mode requests a screen wake lock where supported; a mobile browser may suspend GPS if the page is closed or the phone is locked.

Append `?survey=1` to open Road Review. It loads named OpenStreetMap road segments so a user can tap an exact segment and mark it permitted, restricted, crossing-only, or uncertain without drawing. Choices remain in that browser's local storage until the user explicitly shares or downloads a GeoJSON export; Road Review does not record continuous GPS history. Winter Garden designations should be classified from the official City map, while this review tool is primarily for unresolved Oakland segments.
