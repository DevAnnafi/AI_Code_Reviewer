LANGUAGE_MAP = {
    '.py':   'python',
    '.js':   'javascript',
    '.ts':   'typescript',
    '.go':   'go',
    '.java': 'java',
    '.rs':   'rust',
    '.c':    'c',
    '.cpp':  'cpp',
    '.cs':   'csharp',
    '.rb':   'ruby',
    '.php':  'php',
}

MAX_FILE_SIZE = 100_000  # 100kb

def detect_language(filename: str) -> str:
    ext = '.' + filename.rsplit('.', 1)[-1].lower() if '.' in filename else ''
    return LANGUAGE_MAP.get(ext, 'plaintext')

def validate_file(filename: str, size: int) -> str | None:
    """Returns an error message or None if valid."""
    ext = '.' + filename.rsplit('.', 1)[-1].lower() if '.' in filename else ''
    if ext not in LANGUAGE_MAP:
        return f"Unsupported file type: {ext}"
    if size > MAX_FILE_SIZE:
        return f"File too large: max 100kb"
    return None