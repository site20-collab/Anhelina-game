#!/usr/bin/env python3
"""Assembles src/ into a single self-contained index.html (and an artifact page when given a path)."""
import pathlib
import sys

ROOT = pathlib.Path(__file__).parent
SRC = ROOT / 'src'

HEAD = '''<title>Світ Ангеліни</title>
<meta name="description" content="Кубиковий світ, де Ангеліна будує, дружить з тваринками і грає в гонки, картинки та цукеркову битву.">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Comfortaa:wght@700&family=Nunito:wght@600;800&display=swap">
'''
THREE = '<script src="https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js"></script>\n'


def page():
    css = (SRC / 'style.css').read_text()
    body = (SRC / 'body.html').read_text()
    js = '\n'.join(p.read_text() for p in sorted(SRC.glob('*.js')))
    return css, body, f"<script>\n(() => {{\n'use strict';\n{js}\n}})();\n</script>\n"


def main():
    css, body, script = page()
    full = ('<!doctype html>\n<html lang="uk">\n<head>\n<meta charset="utf-8">\n'
            '<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover, user-scalable=no">\n'
            f'{HEAD}<style>\n{css}</style>\n</head>\n<body>\n{body}\n{THREE}{script}</body>\n</html>\n')
    (ROOT / 'index.html').write_text(full)
    if len(sys.argv) > 1:
        pathlib.Path(sys.argv[1]).write_text(f'{HEAD}<style>\n{css}</style>\n{body}\n{THREE}{script}')


if __name__ == '__main__':
    main()
