A fact's streaming GET handler. The application receives headersFn and streamFn
alongside its query/read helpers. Await each streamFn call so response drain or
client disconnect propagates through the producing operation. Objects/arrays
are concatenated JSON records; Buffers and scalar data remain raw bytes.
