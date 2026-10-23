A gateway server that manages command issuing access.

Multipart commands authenticate and authorize before uploads are parsed. Uploads
use memory storage with defaults of 10 MiB per file, 10 files, 100 text fields,
1 MiB per text field and 110 total parts. A command may override individual
limits with `uploadLimits`, for example `{ fileSize: 1024 * 1024, files: 1 }`.
Applications should choose limits appropriate for their service memory and
concurrency. Anonymous commands still enforce these upload limits.
