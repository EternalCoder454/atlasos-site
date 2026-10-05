---
title: PrimaryButton
summary: The one accent pill button for a page's main action.
order: 1
since: "1.0.0"
section: Controls
---
A pill in the accent colour. Use **one** per page.

```qml
import Atlas.Ui

PrimaryButton {
    text: qsTr("Share")
    symbol: Symbols.Share
    onClicked: shareDialog.open()
}
```

> [!TIP]
> Pair it with a quiet secondary button for the other choices.

> [!WARNING]
> Two primary buttons on one page compete.

## Properties

| Name | Type | Default | Description |
|---|---|---|---|
| `text` | string | `""` | The label. |
| `symbol` | Symbols | none | An icon before the label. |

## Properties

The same heading twice gets `-1`. Jump to [text](#properties) or the [springs](spring-animation.md#standard).

![The button in Light and Dark](images/button.svg)

<script>alert(1)</script>
<b onclick="alert(1)">raw html</b>

[bad](javascript:alert(1)) [outside](https://doc.qt.io/qt-6/qml-qtquick-springanimation.html) [missing](nope/../../etc/passwd)

![remote](https://example.com/x.png)

- [x] task one
- [ ] task two

Footnote here[^1].

[^1]: The footnote.

## Edge cases

| In a table | |
|---|---|
| [a page](spring-animation.md) | ![remote](https://example.com/x.png) |
| ![local](images/button.svg) | [outside](//evil.example/x) |

### See [the springs](spring-animation.md) ![icon](images/button.svg)

## main

## a

## a

## a-1
