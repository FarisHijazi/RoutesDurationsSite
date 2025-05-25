1. define project description
2. create the `memory_bank_guide.mdc` file guide: https://github.com/cline/cline/blob/main/docs/prompting/cline-memory-bank.mdx#cline-memory-bank-custom-instructions-copy-this
3. new chat: initialize memory bank
    
    ```markdown
    based on `project_description.mdc` and `memory_bank_guide.mdc`, initialize `memory_bank/`
    ```
    
4. new chat: update memory bank based on codebase
    
    ```markdown
    based on @package.json @src update the `memory_bank/` folder and use mermaid diagrams as much as possible @memory_bank/
    ```
    
5. 🔁 version control
    
    ```bash
    # 5.1: manually commit/stash your changes and create a new branch
    git add . && git commit -m 'VIBECODING: ...'
    git checkout -b vibecoding/cursor
    
    # 5.2: save changes before allowing the AI to mess with the code
    git add . && git commit -m 'VIBECODING: ...'
    ```
    
6. new chat: now start writing features
    
    ```markdown
    based on @progress.mdc, implement step by step (sub-feature by sub-feature)
    ```
    
    ```markdown
    update memory bank @memory_bank/
    ```
    
7. repeaet 5.2 to 7
