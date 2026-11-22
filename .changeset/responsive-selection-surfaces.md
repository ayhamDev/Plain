---
'@plain/ui': minor
---

Add `presentation="auto" | "popover" | "sheet"` to Select, Combobox, MultiSelect and PhoneInput. Phone country search adapts to a bottom sheet on mobile by default; the other controls preserve their default popover and allow opting into adaptive or forced sheets. Searchable sheets have a bounded scrolling list, keyboard-aware height, localized actions and stable focus/form ownership. Preserve the active searchable surface during viewport changes, scope local direction through portals, and apply provider direction to generic popover, dialog and alert-dialog content.
