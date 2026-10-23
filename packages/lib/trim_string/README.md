Trims a string to a length in JavaScript UTF-16 code units.

`trim(string, length, { ellipsis = "" })` appends the explicitly supplied ellipsis
when truncating. Choose an ellipsis no longer than the requested length. This
helper does not count grapheme clusters or automatically insert three dots.
