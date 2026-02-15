---
description: Verify that multi-column layouts are generated correctly without splitting into separate slides.
---

1. Create a verification markdown file with 2-column layout.
    ```bash
    # This step is manual for now or handled by script, but here is the command
    echo "Creating verification file..."
    ```
2. Build the markdown to HTML.
    ```bash
    npx tsx src/index.ts build examples/verification-layout.md -o examples/verification-layout.html
    ```
3. Run the verification script.
    ```bash
    npx tsx scripts/verify-layout.ts
    ```
// turbo-all
