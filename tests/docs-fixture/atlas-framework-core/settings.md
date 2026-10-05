---
title: Settings
summary: Typed settings that save atomically.
---
```rust
let settings = Settings::<MyPrefs>::load("net.eterneon.atlas.notes")?;
settings.update(|p| p.font_size = 14)?;
```

```sh
journalctl --user -t atlas-notes
```

```nolang
plain text with no grammar
```
