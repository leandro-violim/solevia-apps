// The menu background theme ("Brazil Football Carnival Samba Music", Pixabay — see
// ../assets/audio/LICENCES.md), inlined as a base64 data URI (see
// sample-data.ts for why bytes are bundled, not fetched). Kept in its own module so
// the ~0.7 MB clip is code-split into its own chunk — loaded lazily on the first
// menu, not parsed as part of the initial bundle.
import menuTheme from "../assets/audio/menu-theme.m4a?inline";

export default menuTheme as string;
