import bcrypt
from flask import url_for
import re
import unicodedata
import hashlib
import random

def get_password_hash(password):
    return str((bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt(rounds=12))).decode('utf-8'))


def check_password(password, stored_hash):
    try:
        if bcrypt.checkpw(password.encode('utf-8'), stored_hash.encode('utf-8')): return True
        return False
    except:
        return False


def check_lists_equal(deck_list_1, deck_list_2):
    if deck_list_1 is None and deck_list_2 is not None: return False
    if deck_list_2 is None and deck_list_1 is not None: return False
    if deck_list_1 is None: deck_list_1 = ''
    if deck_list_2 is None: deck_list_2 = ''

    deck_list_1 = deck_list_1.lstrip("\n\r")
    deck_list_1 = deck_list_1.rstrip("\n\r")
    deck_list_2 = deck_list_2.lstrip("\n\r")
    deck_list_2 = deck_list_2.rstrip("\n\r")
    if deck_list_1 == deck_list_2:
        return True

    lines = deck_list_1.splitlines()

    # separar cantidad y nombre
    entries = []
    for line in lines:
        qty, name = line.split(" ", 1)  # separa solo la primera ocurrencia
        entries.append((int(qty), name))

    # ordenar por el nombre
    entries_sorted = sorted(entries, key=lambda x: x[1].lower())

    # reconstruir el texto
    result_1 = "\n".join(f"{qty} {name}" for qty, name in entries_sorted)

    lines = deck_list_2.splitlines()

    # separar cantidad y nombre
    entries = []
    for line in lines:
        qty, name = line.split(" ", 1)  # separa solo la primera ocurrencia
        entries.append((int(qty), name))

    # ordenar por el nombre
    entries_sorted = sorted(entries, key=lambda x: x[1].lower())

    # reconstruir el texto
    result_2 = "\n".join(f"{qty} {name}" for qty, name in entries_sorted)

    if result_1 == result_2:
        return True

    return False


def replace_cards(text):
    if not text:
        return ""

    def repl_card(match):
        code = match.group(1)
        return (
            f'<img src="{url_for("static", filename=f"img/card_images/{code}.webp")}" '
            f'alt="carta" class="card-img-guide">'
        )

    text = re.sub(r'\[(\d{3}-\d{3})\]', repl_card, text)

    text = re.sub(
        r'\*(.*?)\*',
        r'<b>\1</b>',
        text
    )

    return text


def quitar_acentos(texto: str) -> str:
    return ''.join(
        c for c in unicodedata.normalize('NFD', texto)
        if unicodedata.category(c) != 'Mn'
    )


def seed_from_text(text):
    return int(hashlib.sha256(text.encode("utf-8")).hexdigest(), 16) % (2**32)