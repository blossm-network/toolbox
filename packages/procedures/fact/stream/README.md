A fact's streaming GET handler. The application receives headersFn and streamFn
alongside its query/read helpers. Await each streamFn call so response drain or
client disconnect propagates through the producing operation. Objects/arrays
are concatenated JSON records; strings and Buffers pass through unchanged.
Disconnect detection occurs at awaited writes; arbitrary application work is not
automatically cancelled between writes.
