import datetime

from flask import Flask, request, render_template_string, redirect, url_for, render_template
from flask_login import LoginManager
from flask_login import login_user, login_required, logout_user, current_user
from web_app.utils.database import DatabaseManager
from web_app.utils.database_tavern import DatabaseTavernManager
from flask import Flask, jsonify, g, flash, send_file
from web_app.utils.config import config
import os
from web_app.utils.user import User
from web_app.utils.utils import get_password_hash, check_password, check_lists_equal, replace_cards, quitar_acentos, seed_from_text
import json
from reportlab.pdfgen import canvas
from PyPDF2 import PdfReader, PdfWriter
import io
import random

app = Flask(__name__)
app.secret_key = config['App']['SecretKey']
app.config['SESSION_PERMANENT'] = False  # La sesión no es permanente
login_manager = LoginManager()
login_manager.init_app(app)
databaseManager = DatabaseManager(config["Database"]["DatabaseName"])
databaseTavernManager = DatabaseTavernManager(config["DatabaseTavern"]["DatabaseName"])

basedir = os.path.abspath(os.path.dirname(__file__))
current_dir = os.path.dirname(os.path.abspath(__file__))
cards_path = os.path.join(current_dir, "utils", "cards.json")
sets_path = os.path.join(current_dir, "utils", "sets.json")

metadata_cards = json.load(open(cards_path))
metadata_sets = json.load(open(sets_path))
metadata_card_types = list(set([x['type'] for x in metadata_cards]))

@app.teardown_appcontext
def close_db(exception):
    db = g.pop("db", None)
    if db is not None:
        db.close()


@login_manager.user_loader
def load_user(user_id):
    guest_info = databaseManager.get_user(user_id)
    if guest_info is None: return None
    return User(guest_info)

@login_manager.unauthorized_handler
def unauthorized():
    return redirect("/")

@app.route('/')
def view_index():
    return render_template("index.html")


@app.route('/login', methods=['POST'])
def login():
    user = request.form.get("user")
    password = request.form.get("pass")

    new_user = databaseManager.get_user_by_name(user)
    if new_user is None:
        flash('El usuario y/o contraseñas son incorrectos')
        return redirect("/", code=302)
    is_correct = check_password(password, new_user['player_password'])
    if is_correct:
        login_user(User(new_user))
        return redirect("home", code=302)
    flash('El usuario y/o contraseñas son incorrectos')
    return redirect("/", code=302)


@app.route('/signup', methods=['POST'])
def signup():
    user = request.form.get("user")
    password = request.form.get("pass")
    secret = request.form.get("secret")

    code = databaseManager.get_signup_code()
    alredy_exists = databaseManager.alredy_exists_user(user)
    if alredy_exists:
        flash('¡El usuario ya existe!')
        return redirect("/", code=302)
    elif secret == code:
        user = databaseManager.get_user(databaseManager.create_new_user(user,get_password_hash(password)))
        login_user(User(user))
        return redirect("home", code=302)
    else:
        flash('¡No has dicho la palabra mágica!')

    return redirect("/", code=302)


@app.route('/decks', methods=['GET'])
@login_required
def view_decks():
    all_decks = databaseManager.get_all_decks(id_player_order=current_user.id, team=current_user.team)
    return render_template('decks.html', all_decks=all_decks, youtube=False)


@app.route('/decks-youtube', methods=['GET'])
@login_required
def view_decks_youtube():
    all_decks = databaseManager.get_all_decks(team=current_user.team)
    return render_template('decks.html', all_decks=all_decks, youtube=True)


@app.route('/dashboard', methods=['GET'])
@login_required
def view_dashboard():
    data_deck = databaseManager.get_all_results_for_dashboard(current_user.team)
    return render_template('dashboard.html', data_deck=data_deck)


@app.route('/profile', methods=['GET'])
@login_required
@login_required
def view_profile():
    data_deck = databaseManager.get_all_results_by_player(current_user.id)
    return render_template('profile.html', data_deck=data_deck)


@app.route('/home', methods=['GET'])
@login_required
def view_home():
    all_comments = databaseManager.get_last_comments(current_user.team)
    all_results = databaseManager.get_last_results(current_user.team)
    all_last_decks = databaseManager.get_last_updates_on_decks(current_user.team)
    return render_template('home.html', all_comments=all_comments, all_results=all_results, all_last_decks=all_last_decks)


@app.route('/mulligan/<deck_id>', methods=['GET'])
@login_required
def view_mulligan(deck_id):
    deck = get_deck_for_web(deck_id)
    all_cards = []
    for card in deck['all_cards']:
        for qty in range(card['qty']):
            all_cards.append(card['image'])
    return render_template('mulligan.html', all_cards=all_cards, deck=deck)


def get_deck_for_web(deck_id, version=None):
    if version is not None:
        deck = databaseManager.get_deck_by_version(deck_id, version)
    else:
        deck = databaseManager.get_deck(deck_id)
    deck['all_cards'] = []
    if deck['deck_list'] != '' and deck['deck_list'] is not None:
        lineas = [line.strip() for line in deck['deck_list'].splitlines() if line.strip()]
        for line in lineas:
            card = dict()
            card['card'] = line[2:]
            card['qty'] = line[0]
            if not card['qty'].isdigit():
                card['qty'] = 0
            else:
                card['qty'] = int(card['qty'])
            card['image'] = "back.webp"
            card['type'] = "unknown"
            card['cost'] = 0
            for c in metadata_cards:
                if c['name'].upper() == card['card'].upper():
                    card['image'] = c['image']
                    card['type'] = c['type']
                    card['cost'] = c['cost']
                    break
            deck['all_cards'].append(card)
    deck['all_cards'] = sorted(
        deck['all_cards'],
        key=lambda card: (card['type'], card['cost'])
    )
    return deck


@app.route('/deck/<deck_id>', methods=['GET'])
@login_required
def view_deck(deck_id):

    deck = get_deck_for_web(deck_id)

    user_info = databaseManager.get_user(deck['id_player'])
    if user_info['team'] != current_user.team and deck['status']!='Public':
        return redirect("/decks")

    all_comments = databaseManager.get_all_comments_from_deck(deck_id)
    data_deck = databaseManager.get_all_results_by_deck(deck_id)

    return render_template('deck.html', deck=deck, all_comments=all_comments, data_deck=data_deck)


@app.route('/deck-youtube/<deck_id>', methods=['GET'])
@login_required
def view_deck_youtube(deck_id):

    deck = get_deck_for_web(deck_id)

    user_info = databaseManager.get_user(deck['id_player'])
    if user_info['team'] != current_user.team and deck['status']!='Public':
        return redirect("/decks")

    all_comments = databaseManager.get_all_comments_from_deck(deck_id)
    data_deck = databaseManager.get_all_results_by_deck(deck_id)

    return render_template('deck-youtube.html', deck=deck, all_comments=all_comments, data_deck=data_deck)


@app.route('/event/<event_id>', methods=['GET'])
@login_required
def view_event(event_id):
    event = databaseManager.get_tournament_by_id(event_id)
    results = databaseManager.get_all_results_in_tournament_by_player(event_id, current_user.id)
    all_my_decks = databaseManager.get_all_decks(current_user.id, event['set_tournament'], current_user.team)
    all_players_on_event = databaseManager.get_all_players_on_event(event_id)

    total_win = 0
    total_draw = 0
    total_loose = 0

    for game in results:
        if game['result_win'] > game['result_loose']:
            total_win += 1
        elif game['result_win'] == game['result_loose']:
            total_draw += 1
        elif game['result_win'] < game['result_loose']:
            total_loose += 1

    final_result = str(total_win) + "-" + str(total_loose) + "-" + str(total_draw)

    return render_template('event-detail.html', event=event, results=results,
                           all_decks=all_my_decks, all_players_on_event=all_players_on_event,
                           final_result=final_result)


@app.route('/event-youtube/<event_id>', methods=['GET'])
@login_required
def view_event_youtube(event_id):
    event = databaseManager.get_tournament_by_id(event_id)
    results = databaseManager.get_all_results_in_tournament_by_player(event_id, current_user.id)
    all_my_decks = databaseManager.get_all_decks(current_user.id, event['set_tournament'], current_user.team)
    all_players_on_event = databaseManager.get_all_players_on_event(event_id)

    total_win = 0
    total_draw = 0
    total_loose = 0

    for game in results:
        if game['result_win'] > game['result_loose']:
            total_win += 1
        elif game['result_win'] == game['result_loose']:
            total_draw += 1
        elif game['result_win'] < game['result_loose']:
            total_loose += 1

    final_result = str(total_win) + "-" + str(total_loose) + "-" + str(total_draw)

    return render_template('event-detail-youtube.html', event=event, results=results,
                           all_decks=all_my_decks, all_players_on_event=all_players_on_event,
                           final_result=final_result)

@app.route('/event/<event_id>/<player_id>', methods=['GET'])
@login_required
def view_event_by_player(event_id, player_id):
    event = databaseManager.get_tournament_by_id(event_id)
    results = databaseManager.get_all_results_in_tournament_by_player(event_id, player_id)
    all_players_on_event = databaseManager.get_all_players_on_event(event_id)
    player = [x for x in all_players_on_event if int(x['id_player'])==int(player_id)][0]

    total_win = 0
    total_draw = 0
    total_loose = 0

    for game in results:
        if game['result_win']>game['result_loose']:
            total_win += 1
        elif game['result_win']==game['result_loose']:
            total_draw += 1
        elif game['result_win']<game['result_loose']:
            total_loose += 1

    final_result = str(total_win) + "-" + str(total_loose) + "-"+ str(total_draw)

    return render_template('event-detail-player.html', event=event, results=results,
                           all_players_on_event=all_players_on_event, player=player,
                           final_result=final_result)


@app.route("/see-event/<event_id>", methods=["POST"])
@login_required
def see_event(event_id):
    player_id = request.form.get("player")
    return redirect("/event/"+str(event_id)+"/"+str(player_id))


@app.route("/add-round/<event_id>", methods=["POST"])
@login_required
def add_round(event_id):
    new_register = dict()
    new_register['id_player'] = current_user.id
    new_register['id_tournament'] = event_id
    new_register['id_deck'] = request.form.get('my_deck')
    version = databaseManager.get_deck(new_register['id_deck'])['version']
    new_register['version'] = version
    if request.form.get('game_1') == '':
        new_register['win_first_game'] = None
    else:
        new_register['win_first_game'] = request.form.get('game_1')
    if request.form.get('game_2') == '':
        new_register['win_second_game'] = None
    else:
        new_register['win_second_game'] = request.form.get('game_2')
    if request.form.get('game_3') == '':
        new_register['win_third_game'] = None
    else:
        new_register['win_third_game'] = request.form.get('game_3')
    new_register['faction'] = request.form.get('enemy_faction')
    if request.form.get('starting')== 'OTP':
        new_register['is_otp'] = 1
    else:
        new_register['is_otp'] = 0
    if request.form.get('won_dice') == 'yes':
        new_register['has_won_dice'] = 1
    else:
        new_register['has_won_dice'] = 0
    new_register['comment'] = request.form.get('notes')
    new_register['replay_link'] = request.form.get('link')
    if request.form.get('link') == '':
        new_register['replay_link'] = None

    databaseManager.create_new_result_in_tournament(new_register)
    return redirect("/event/"+str(event_id))


@app.route("/edit-round/<id_result>", methods=["POST"])
@login_required
def edit_round(id_result):
    actual_result = databaseManager.get_result_in_tournament_by_id(id_result)
    new_register = dict()
    new_register['id_player'] = current_user.id
    new_register['id_result'] = id_result
    new_register['id_tournament'] = actual_result['id_tournament']
    new_register['id_deck'] = request.form.get('my_deck')
    version = databaseManager.get_deck(new_register['id_deck'])['version']
    new_register['version'] = version
    if request.form.get('game_1') == '':
        new_register['win_first_game'] = None
    else:
        new_register['win_first_game'] = request.form.get('game_1')
    if request.form.get('game_2') == '':
        new_register['win_second_game'] = None
    else:
        new_register['win_second_game'] = request.form.get('game_2')
    if request.form.get('game_3') == '':
        new_register['win_third_game'] = None
    else:
        new_register['win_third_game'] = request.form.get('game_3')
    new_register['faction'] = request.form.get('enemy_faction')
    if request.form.get('starting')== 'OTP':
        new_register['is_otp'] = 1
    else:
        new_register['is_otp'] = 0
    if request.form.get('won_dice') == 'yes':
        new_register['has_won_dice'] = 1
    else:
        new_register['has_won_dice'] = 0
    new_register['comment'] = request.form.get('notes')
    new_register['replay_link'] = request.form.get('link')
    if request.form.get('link') == '':
        new_register['replay_link'] = None


    databaseManager.update_result(new_register)
    return redirect("/event/"+str(actual_result['id_tournament']))


@app.route("/comment/<deck_id>", methods=["POST"])
@login_required
def comment_deck(deck_id):
    deck = dict()
    deck['comment'] = request.form.get('comentario')
    deck['id_player'] = current_user.id
    deck['id_deck'] = deck_id
    databaseManager.add_comment_to_deck(deck)
    return redirect("/deck/"+str(deck_id))


@app.route("/create-new-deck", methods=["POST"])
@login_required
def create_new_deck():
    deck = dict()
    deck['deck_name'] = request.form["nombre"]
    deck['set_deck'] = request.form["set"]
    deck['faction'] = request.form["faction"]
    deck['image'] = request.form["imagen"]
    deck['deck_list'] = request.form["lista"]
    deck['version'] = 1
    deck['id_player'] = current_user.id
    deck['id_deck'] = databaseManager.create_new_deck(deck)
    if deck['deck_list'] != '':
    #TODO: si la deck_list está vacía, no se coge -> comprobar entonces que luego al guardar no se aumente la version
        databaseManager.add_deck_list(deck)

    return redirect("/decks")


@app.route('/new-deck', methods=['GET'])
@login_required
def view_new_deck():
    return render_template('new-deck.html')


@app.route('/new-tournament', methods=['GET'])
@login_required
def view_new_tournament():
    return render_template('new-tournament.html')


@app.route("/create-new-tournament", methods=["POST"])
@login_required
def create_new_tournament():
    tournament = dict()
    tournament['name'] = request.form["nombre"]
    tournament['set'] = request.form["set"]
    tournament['image'] = request.form["imagen"]

    databaseManager.create_new_tournament(tournament)
    return redirect("/events")


@app.route('/events', methods=['GET'])
@login_required
def view_events():
    all_tournaments = databaseManager.get_all_tournaments()
    return render_template('events.html', all_tournaments = all_tournaments, youtube=False)

@app.route('/events-youtube', methods=['GET'])
@login_required
def view_events_youtube():
    all_tournaments = databaseManager.get_all_tournaments()
    return render_template('events.html', all_tournaments = all_tournaments, youtube=True)


@app.route('/guide/<id_deck>', methods=['GET'])
@login_required
def view_guide(id_deck):
    actual_deck = databaseManager.get_deck(id_deck)
    deck = get_deck_for_web(id_deck)

    if databaseManager.get_user(deck['id_player'])['team'] != current_user.team and deck['status']!='Public':
        return redirect("/decks")

    deck_guide = databaseManager.get_guide_content_from_deck(id_deck)
    matchups = databaseManager.get_guide_matchups_from_deck(id_deck)
    is_preview = True
    if 'preview' in request.args:
        is_preview = bool(request.args['preview'])
    elif int(actual_deck['id_player']) == int(current_user.id):
        is_preview = False

    # Si es para visualizarlo en bonito y hay una guía
    if is_preview and deck_guide is not None:
        deck_guide['introduction'] = replace_cards(deck_guide['introduction'])
        deck_guide['general_description'] = replace_cards(deck_guide['general_description'])
        deck_guide['card_analysis'] = replace_cards(deck_guide['card_analysis'])
        deck_guide['main_lines'] = replace_cards(deck_guide['main_lines'])
        deck_guide['mulligan'] = replace_cards(deck_guide['mulligan'])

        for mu in matchups:
            mu['content'] = replace_cards(mu['content'])

    return render_template('guide.html', is_preview =is_preview,
                                         deck=deck,
                                         deck_guide=deck_guide,
                                         matchups=matchups)


@app.route("/save-guide/<deck_id>", methods=["POST"])
@login_required
def save_guide(deck_id):
    info = dict()
    info['id_deck'] = deck_id
    info['introduction'] = request.form["introduction"]
    info['general_description'] = request.form["general_description"]
    info['card_analysis'] = request.form["card_analysis"]
    info['main_lines'] = request.form["main_lines"]
    info['mulligan'] = request.form["mulligan"]

    all_factions = request.form.getlist("faction[]")
    all_content = request.form.getlist("content[]")
    all_deck_name = request.form.getlist("deck_name[]")

    databaseManager.delete_all_matchups_from_deck(deck_id)
    for i in range(len(all_factions)):
        new_data = dict()
        new_data['id_deck'] = deck_id
        new_data['faction'] = all_factions[i]
        new_data['deck_name'] = all_deck_name[i]
        new_data['content'] = all_content[i]
        databaseManager.add_matchups_to_deck(new_data)

    databaseManager.save_guide_deck_content(info)
    return redirect("/guide/"+str(deck_id))


@app.route('/edit-result/<id_result>', methods=['GET'])
@login_required
def view_edit_results(id_result):
    result = databaseManager.get_result_in_tournament_by_id(id_result)
    event = databaseManager.get_tournament_by_id(result['id_tournament'])
    all_my_decks = databaseManager.get_all_decks(id_player_order = current_user.id, team=current_user.team)
    return render_template('event-edit-detail.html', result=result, event=event, all_decks = all_my_decks)


@app.route('/edit-deck/<deck_id>', methods=['POST'])
@login_required
def view_edit_deck_post(deck_id):
    deck = databaseManager.get_deck(deck_id)
    if deck['id_player'] == current_user.id:
        return redirect('/edit-deck/'+str(deck_id))
    return redirect('/deck/'+str(deck_id))

@app.route('/edit-deck-lab/<deck_id>', methods=['POST'])
@login_required
def view_edit_deck_lab_post(deck_id):
    return redirect('/edit-deck-lab/'+str(deck_id))


@app.route('/delete-deck/<deck_id>', methods=['POST'])
@login_required
def view_delete_deck(deck_id):
    databaseManager.delete_deck(deck_id)
    return redirect('/decks')


@app.route('/action-over-result/<event_id>', methods=['POST'])
@login_required
def action_over_result(event_id):
    if request.form.get('action')=='edit':
        return redirect("/edit-result/"+str(request.form.get('id')))
    elif request.form.get('action') == 'delete':
        databaseManager.delete_result_in_tournament(request.form.get('id'))
        redirect("/event/" + str(event_id))
    return redirect("/event/" + str(event_id))


@app.route('/save-deck/<deck_id>', methods=['POST'])
@login_required
def view_save_deck(deck_id):

    actual_deck = databaseManager.get_deck(deck_id)
    deck_image = request.form.get('imagen')
    if actual_deck['image']!=deck_image:
        databaseManager.update_image_from_deck(deck_id, deck_image)
    deck_name = request.form.get('nombre')
    if actual_deck['deck_name'] != deck_name:
        databaseManager.update_name_from_deck(deck_id, deck_name)
    status = request.form.get('status')
    if actual_deck['status'] != status:
        databaseManager.update_status_from_deck(deck_id, status)
    deck_list_new = request.form.get('lista')
    if deck_list_new != '' and deck_list_new is not None:
        is_equal = check_lists_equal(actual_deck['deck_list'], request.form.get('lista'))
        if not is_equal:
            new_deck = dict()
            new_deck['id_deck'] = deck_id
            new_deck['deck_list'] = request.form.get('lista')
            new_deck['version'] = actual_deck['version'] + 1
            databaseManager.add_deck_list(new_deck)
    return redirect('/deck/'+str(deck_id))


@app.route('/edit-deck/<deck_id>', methods=['GET'])
@login_required
def view_edit_deck_get(deck_id):
    deck = databaseManager.get_deck(deck_id)
    if deck['id_player'] != current_user.id:
        return redirect("/decks")
    return render_template('edit-deck.html', deck=deck)


@app.route('/edit-deck-lab/<deck_id>', methods=['GET'])
@login_required
def view_edit_deck_lab_get(deck_id):
    deck = databaseManager.get_deck(deck_id)

    if deck['id_player'] != current_user.id:
        return redirect("/decks")

    cards = metadata_cards
    all_sets = metadata_sets

    all_card_types = metadata_card_types

    deck_list = []
    if deck['deck_list'] != '' and deck['deck_list'] is not None:
        lineas = [line.strip() for line in deck['deck_list'].splitlines() if line.strip()]
        for line in lineas:
            card_name = line[2:]
            card_qty = line[0]
            if not card_qty.isdigit():
                continue
            for c in metadata_cards:
                if c['name'].upper() == card_name.upper():
                    deck_list.append([c, card_qty])
                    break


    return render_template('edit-deck-lab.html', deck=deck, cards=cards,
                           deck_list=deck_list, all_sets=all_sets , all_card_types=all_card_types)


@app.route('/save-deck-lab/<deck_id>', methods=['POST'])
@login_required
def save_deck_lab(deck_id):
    actual_deck = databaseManager.get_deck(deck_id)
    string_deck = ""
    deck_json = json.loads(request.form['deck'])
    for key, card in deck_json.items():
        card_name = card['card']['name']
        card_qty = card['qty']
        string_deck += str(card_qty) + " " + str(card_name)+"\n"

    string_deck = string_deck[:-1]

    is_equal = check_lists_equal(actual_deck['deck_list'], string_deck)
    if not is_equal and string_deck is not None and string_deck != '':
        new_deck = dict()
        new_deck['id_deck'] = deck_id
        new_deck['deck_list'] = string_deck
        if actual_deck['version'] is None:
            new_deck['version'] = 1
        else:
            new_deck['version'] = actual_deck['version'] + 1
        databaseManager.add_deck_list(new_deck)

    return redirect("/deck/"+str(deck_id))


@app.route('/view-deck/<deck_id>', methods=['POST'])
@login_required
def view_deck_with_version(deck_id):
    deck = get_deck_for_web(deck_id, request.form.get('version'))

    user_info = databaseManager.get_user(deck['id_player'])
    if user_info['team'] != current_user.team and deck['status']!='Public':
        return redirect("/decks")

    all_comments = databaseManager.get_all_comments_from_deck(deck_id)
    data_deck = databaseManager.get_all_results_by_deck(deck_id)
    return render_template('deck.html', deck=deck, all_comments=all_comments, data_deck=data_deck)


@app.route('/logout', methods=['GET'])
@login_required
def logout():
    logout_user()
    return redirect("/", code=302)


@login_required
@app.route("/pdf/<deck_id>", methods=["GET"])
def generate_pdf(deck_id):
    base_pdf = PdfReader(os.path.join(current_dir, "static","pdf", "decklist.pdf"))
    deck = get_deck_for_web(deck_id)
    num_total_cards = 0

    output = PdfWriter()

    packet = io.BytesIO()
    c = canvas.Canvas(packet)

    c.setFont("Helvetica", 10)
    i = 0
    for card in deck['all_cards']:
        num_total_cards += card['qty']
        c.drawString(90, 610 - i*19.5, str(card['qty']))
        c.drawString(130, 610 - i*19.5, card['card'])
        i+=1

    c.drawString(315, 91, str(num_total_cards))
    c.save()
    packet.seek(0)

    overlay_pdf = PdfReader(packet)

    for page in base_pdf.pages:
        page.merge_page(overlay_pdf.pages[0])
        output.add_page(page)

    output_stream = io.BytesIO()
    output.write(output_stream)
    output_stream.seek(0)

    file_name = quitar_acentos(str(deck['deck_name'])).replace(' ', '-').lower()+"-set-"+str(deck['set_deck'])+".pdf"

    return send_file(
        output_stream,
        mimetype="application/pdf",
        as_attachment=True,
        download_name=file_name
    )


@login_required
@app.route("/guide-pdf/<deck_id>", methods=["GET"])
def generate_guide(deck_id):
    from reportlab.pdfbase import pdfmetrics
    from reportlab.pdfbase.ttfonts import TTFont
    from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, PageBreak, Flowable, Image
    from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
    from reportlab.lib.enums import TA_CENTER, TA_JUSTIFY
    from reportlab.lib.pagesizes import A4
    from reportlab.lib.units import inch
    from reportlab.lib.utils import ImageReader
    from reportlab import rl_config
    import os, re
    from PIL import Image as PILImage
    from io import BytesIO
    from reportlab.platypus import HRFlowable

    rl_config.warnOnMissingFontGlyphs = 0

    ruta_ttf = os.path.join(current_dir, "utils", "DejaVuSans.ttf")
    ruta_ttf_bold = os.path.join(current_dir, "utils", "DejaVuSans-Bold.ttf")
    pdfmetrics.registerFont(TTFont('DejaVu', ruta_ttf))
    pdfmetrics.registerFont(TTFont('DejaVu-Bold', ruta_ttf_bold))

    pdfmetrics.registerFontFamily(
        'DejaVu',
        normal='DejaVu',
        bold='DejaVu-Bold'
    )

    deck_guide = databaseManager.get_guide_content_from_deck(deck_id)
    matchups = databaseManager.get_guide_matchups_from_deck(deck_id)
    deck = get_deck_for_web(deck_id)

    output_stream = BytesIO()
    doc = SimpleDocTemplate(output_stream, pagesize=A4)
    elements = []

    styles = getSampleStyleSheet()
    for style_name in styles.byName:
        styles[style_name].fontName = 'DejaVu'

    title_style = styles["Heading1"]
    body_style = styles["BodyText"]

    centered_title_style = ParagraphStyle(name="CenteredTitle", parent=styles["Heading1"], alignment=TA_CENTER, fontName='DejaVu')
    centered_body_style = ParagraphStyle(name="CenteredBody", parent=styles["BodyText"], alignment=TA_CENTER, fontName='DejaVu')
    justified_body_style = ParagraphStyle(name="JustifiedBody", parent=styles["BodyText"], alignment=TA_JUSTIFY, fontName='DejaVu')

    def safe_text(texto):
        if not texto:
            return ""
        return str(texto).encode('utf-8', errors='replace').decode('utf-8')

    def add_watermark(canvas, doc):
        canvas.saveState()
        ruta_logo = os.path.join(current_dir, "static", "img", "logo.webp")
        if os.path.exists(ruta_logo):
            logo = ImageReader(ruta_logo)
            canvas.setFillAlpha(0.08)
            width, height = 2*inch, 1*inch
            x = doc.pagesize[0] - width - 0.1*inch
            y = doc.pagesize[1] - height - 0.1*inch
            canvas.drawImage(logo, x, y, width=width, height=height, mask='auto')
        canvas.setFillAlpha(1)
        canvas.drawCentredString(doc.pagesize[0]/2, 0.5*inch, str(doc.page))
        canvas.restoreState()

    class InlineImages(Flowable):
        _image_cache = {}

        def __init__(self, image_paths, width=50, height=70, spacing=5):
            super().__init__()
            self.image_paths = image_paths
            self.width = width
            self.height = height
            self.spacing = spacing
            self.flowable_width = len(image_paths) * (width + spacing) - spacing
            self.flowable_height = height

        def wrap(self, availWidth, availHeight):
            self.start_x = max((availWidth - self.flowable_width) / 2, 0)
            return availWidth, self.flowable_height

        @classmethod
        def get_cached_image(cls, path):
            if path in cls._image_cache:
                return cls._image_cache[path]

            try:
                im = PILImage.open(path)

                if im.mode in ("RGBA", "P"):
                    im = im.convert("RGB")

                im.thumbnail((300, 300))  # reducimos tamaño real

                bio = BytesIO()
                im.save(bio, format="PNG", optimize=True)
                bio.seek(0)

                reader = ImageReader(bio)
                cls._image_cache[path] = reader
                return reader

            except Exception as e:
                print("Error imagen:", path, e)
                return None

        def draw(self):
            x = self.start_x
            for path in self.image_paths:
                if path:
                    img = self.get_cached_image(path)
                    if img:
                        self.canv.drawImage(
                            img,
                            x,
                            0,
                            width=self.width,
                            height=self.height
                        )
                x += self.width + self.spacing

    # --- Procesar contenido
    def procesar_contenido(texto, style=body_style):
        flowables = []
        if not texto:
            return flowables
        lineas = texto.split("\n")
        for linea in lineas:
            if not linea.strip():
                flowables.append(Spacer(1, 0.2*inch))
                continue
            linea = re.sub(r'\*(.+?)\*', r'<b>\1</b>', safe_text(linea))
            imagenes = []
            def reemplazar_imagen(match):
                codigo = match.group(1)
                ruta_img = os.path.join(current_dir, "static", "img", "card_images", codigo+".webp")
                if os.path.exists(ruta_img):
                    imagenes.append(ruta_img)
                    return ""
                return match.group(0)
            linea = re.sub(r'\[([A-Z0-9\-]+)\]', reemplazar_imagen, linea)
            if imagenes:
                flowables.append(InlineImages(imagenes))
                flowables.append(Spacer(1, 0.2*inch))
            if linea.strip():
                flowables.append(Paragraph(linea, style))
        return flowables

    # --- Bloque de imágenes del deck
    deck_images = []
    for card in deck['all_cards']:
        ruta_img = os.path.join(current_dir, "static", "img", "card_images", card['image'])
        if os.path.exists(ruta_img):
            deck_images.append(ruta_img)

    # Agrupamos cartas de 6 en 6
    grouped_card_images = [deck_images[i:i + 8] for i in range(0, len(deck_images), 8)]

    # Logo encima de todo
    grouped_images = []  # lista con logo como primer "grupo"
    grouped_images.extend(grouped_card_images)

    if deck_guide is not None:
        # --- Secciones
        secciones = [
            (deck['deck_name'], [[""]], True),
            ("", grouped_images, True),
            ("Introducción", deck_guide.get("introduction"), False),
            ("Descripción General", deck_guide.get("general_description"), False),
            ("Análisis de Cartas", deck_guide.get("card_analysis"), False),
            ("Líneas Principales", deck_guide.get("main_lines"), False),
            ("Mulligan", deck_guide.get("mulligan"), False),
        ]
    else:
        secciones = [
            (deck['deck_name'], [[""]], True),
            ("", grouped_images, True),
        ]


    for mu in matchups:
        def color_circle(ink):
            colores = {1:"yellow",2:"purple",3:"green",4:"red",5:"blue",6:"grey"}
            return f"<font color='{colores.get(ink,'yellow')}'>●</font>"
        titulo_matchup = f"vs {color_circle(mu['faction'])} {mu['deck_name']}"
        secciones.append((titulo_matchup, mu['content'], False))

    # --- Generar documento
    first_image = True
    for i, (titulo, contenido, is_centered) in enumerate(secciones):
        if not contenido:
            continue
        elements.append(Paragraph(safe_text(titulo), centered_title_style if is_centered else title_style))
        elements.append(HRFlowable(width="100%", thickness=1))
        elements.append(Spacer(1, 0.3*inch))
        if isinstance(contenido, list):
            for grupo in contenido:
                if first_image:
                    elements.append(Image(os.path.join(current_dir, "static", "img", "logo.png"), width=230, height=150))
                    first_image = False
                else:
                    elements.append(InlineImages(grupo))
                elements.append(Spacer(1, 0.2*inch))
        else:
            elements.extend(procesar_contenido(contenido, centered_body_style if is_centered else justified_body_style))
        if i < len(secciones)-1 and i > 0:
            elements.append(PageBreak())

    doc.build(elements, onLaterPages=add_watermark)
    output_stream.seek(0)

    file_name = quitar_acentos(deck['deck_name']).replace(' ','-').lower()
    file_name = re.sub(r'[^a-z0-9\-]','',file_name)+f"-set-{deck['set_deck']}.pdf"

    return send_file(output_stream, mimetype="application/pdf", as_attachment=True, download_name=file_name)


@app.route('/tavern', methods=['GET'])
@login_required
def view_tavern():
    all_games = databaseTavernManager.get_all_active_games()
    all_reviews = databaseTavernManager.get_all_games()
    all_checkpoints = databaseTavernManager.get_all_checkpoints()
    return render_template('tavern.html', all_games=all_games, all_reviews=all_reviews, all_checkpoints=all_checkpoints)


@app.route('/analysis', methods=['GET'])
@login_required
def view_analysis():
    all_replays = databaseManager.get_all_replays()
    return render_template('analysis.html', all_replays=all_replays)


@app.route('/analysis/<analysis_id>', methods=['GET'])
@login_required
def view_analysis_details(analysis_id):
    if str(analysis_id[0])=='t':
        analysis_id = int(analysis_id.replace('t', '-'))
        all_comments = databaseManager.get_all_comments_from_replay(analysis_id)
        replay = databaseManager.get_replay_from_id_events(analysis_id)
    else:
        all_comments = databaseManager.get_all_comments_from_replay(analysis_id)
        replay = databaseManager.get_replay_from_id(analysis_id)

    return render_template('analysis-detail.html', all_comments=all_comments, replay=replay)


@app.route('/create-new-replay', methods=['POST'])
@login_required
def add_new_replay():
    new_info = dict()
    new_info['name'] = request.form.get('name')
    new_info['id_player'] = current_user.id
    new_info['link'] = request.form.get('link')

    databaseManager.add_replay(new_info)
    return redirect('/analysis', code=302)


@app.route('/comment-replay/<analysis_id>', methods=['POST'])
@login_required
def add_new_replay_comment(analysis_id):
    actual_id = analysis_id
    if str(analysis_id[0]) == 't':
        analysis_id = int(analysis_id.replace('t', '-'))

    new_info = dict()
    new_info['comment'] = request.form.get('comentario')
    new_info['id_player'] = current_user.id
    new_info['id_replay'] = analysis_id

    databaseManager.add_replay_comment(new_info)
    return redirect('/analysis/'+str(actual_id), code=302)

@app.route('/training/<deck_id>', methods=['GET'])
@login_required
def view_training(deck_id):
    deck = get_deck_for_web(deck_id)
    all_cards = []
    for card in deck['all_cards']:
        for qty in range(card['qty']):
            all_cards.append(card['image'].replace('.webp', ''))
    return render_template('training.html', all_cards = all_cards)


@app.route('/tavern/game/<game_id>', methods=['GET'])
@login_required
def view_game(game_id):
    game = databaseTavernManager.get_game(game_id)
    return render_template('game.html', game=game, read_only=False, game_type = "game")


@app.route('/tavern/game-review/<game_id>', methods=['GET'])
@login_required
def view_game_review(game_id):
    since_scn = request.args.get("scn")
    if since_scn is None:
        since_scn = 0
    game = databaseTavernManager.get_game(game_id)
    all_users = databaseManager.get_all_players()
    return render_template('game.html', game=game, read_only=True, since_scn=since_scn, all_users=all_users, game_type = "review")


@app.route('/tavern/game/<game_id>/actions', methods=['GET'])
@login_required
def get_action_to_game(game_id):
    since_scn = request.args.get("scn")
    if since_scn is None:
        since_scn = 0
    all_actions = databaseTavernManager.get_actions(game_id, since_scn )
    return jsonify(all_actions)


@app.route('/tavern/game/<game_id>/actions', methods=['POST'])
@login_required
def add_action_to_game(game_id):

    data = request.get_json()
    new_action = dict()
    new_action['id_game'] = game_id
    new_action['scn'] = int(datetime.datetime.now().strftime("%Y%m%d%H%M%S%f")) // 10000
    new_action['id_user'] = data['user']
    if 'info' in data['payload']:
        new_action['info'] = data['payload']['info']
    else:
        new_action['info'] = None

    if 'base' in data['payload']:
        new_action['info'] = new_action['info'] + '|'+data['payload']['base']

    if 'seat' in data['payload']:
        new_action['seat'] = data['payload']['seat']
    else:
        new_action['seat'] = None

    id_action = -1
    if data['type'] == 'DRAW_CARD':
        id_action = 1
    elif data['type'] == 'SHUFFLE_DECK':
        id_action = 2
    elif data['type'] == 'INK':
        id_action = 3
    elif data['type'] == 'PLAY':
        id_action = 4
    elif data['type'] == 'DISCARD':
        id_action = 5
    elif data['type'] == 'BOTTOM':
        id_action = 6
    elif data['type'] == 'TOP':
        id_action = 7
    elif data['type'] == 'FACEDOWN':
        id_action = 8
    elif data['type'] == 'FACEUP':
        id_action = 9
    elif data['type'] == 'HAND':
        id_action = 10
    elif data['type'] == 'EXERT':
        id_action = 11
    elif data['type'] == 'PLUS_COUNTER':
        id_action = 12
    elif data['type'] == 'MINUS_COUNTER':
        id_action = 13
    elif data['type'] == 'DRAW7':
        id_action = 14
    elif data['type'] == 'DISCARD_HAND':
        id_action = 15
    elif data['type'] == 'BOOST':
        id_action = 16
    elif data['type'] == 'SHIFT':
        id_action = 17
    elif data['type'] == 'OPPONENT_MINUS_LORE':
        id_action = 18
    elif data['type'] == 'OPPONENT_PLUS_LORE':
        id_action = 19
    elif data['type'] == 'YOU_MINUS_LORE':
        id_action = 20
    elif data['type'] == 'YOU_PLUS_LORE':
        id_action = 21
    elif data['type'] == 'RETURN_HAND':
        id_action = 22
    elif data['type'] == 'RETURN_TOPDECK':
        id_action = 23
    elif data['type'] == 'RETURN_BOTTOM':
        id_action = 24
    elif data['type'] == 'GET_HAND':
        id_action = 25
    elif data['type'] == 'SEND_BOTTOM':
        id_action = 26
    elif data['type'] == 'LOCATION':
        id_action = 27
    elif data['type'] == 'FINISH_GAME':
        databaseTavernManager.finish_game(game_id)
        id_action = 28
    elif data['type'] == 'BOTTOM_MULLIGAN':
        id_action = 29

    new_action['id_action'] = id_action
    databaseTavernManager.add_new_action(new_action)
    return jsonify(None)


@app.route('/new-game', methods=['GET'])
@login_required
def view_new_game():
    all_decks = databaseManager.get_all_decks(team=current_user.team)
    all_users = databaseManager.get_all_players()
    return render_template('new-game.html', all_decks=all_decks, all_users = all_users)


def shuffled_images_from_deck(deck_dict, seed_text):
    # 1. Expandir las cartas según qty
    cards = []
    for entry in deck_dict["all_cards"]:
        cards.extend([entry["image"].replace('.webp', '')] * entry["qty"])

    # 2. Crear el seed numérico desde el texto
    seed = seed_from_text(seed_text)

    # 3. Crear RNG independiente y barajar
    rng = random.Random(seed)
    rng.shuffle(cards)

    return cards


@app.route('/create-new-game', methods=['POST'])
@login_required
def create_new_game():
    new_info = dict()
    new_info['game_set'] = request.form.get('set')
    new_info['id_user_main'] = current_user.id
    new_info['user_name_main'] = current_user.username
    my_deck_decklist = databaseManager.get_deck(int(request.form.get('my_deck')))['deck_list']
    new_info['deck_user_main'] = my_deck_decklist
    new_info['id_user_opponent'] = request.form.get('opponent')
    new_info['user_name_opponent'] = databaseManager.get_user(int(request.form.get('opponent')))['player_name']
    your_deck_decklist = databaseManager.get_deck(int(request.form.get('your_deck')))['deck_list']
    new_info['deck_user_opponent'] = your_deck_decklist
    new_info['seed'] = request.form.get('seed')
    new_info['name'] = request.form.get('nombre')

    my_deck = get_deck_for_web(request.form.get('my_deck'))
    my_deck_shuffled = str(shuffled_images_from_deck((my_deck), str(request.form.get('seed'))))

    your_deck = get_deck_for_web(request.form.get('your_deck'))
    your_deck_shuffled = str(shuffled_images_from_deck((your_deck), str(request.form.get('seed'))))

    new_info['deck_user_shuffled_main'] = my_deck_shuffled
    new_info['deck_user_shuffled_opponent'] = your_deck_shuffled

    databaseTavernManager.create_new_game(new_info)
    return redirect('/tavern', code=302)


@app.route('/save-checkpoint', methods=['POST'])
@login_required
def save_checkpoint():
    info = dict()
    info['id_game'] = request.get_json()['game-id']
    info['scn'] = request.get_json()['scn']
    info['id_user'] = current_user.id
    databaseTavernManager.save_checkpoint(info)
    return jsonify(None)


@app.route('/delete-checkpoint', methods=['POST'])
@login_required
def delete_checkpoint():
    info = dict()
    data = request.form
    info['id_game'] = data.get('game-id')
    info['scn'] = data.get('since-scn')
    info['id_user'] = current_user.id
    databaseTavernManager.delete_checkpoint(info)
    return redirect("/tavern", code=302)


@app.route('/create-game-from-checkpoint', methods=['POST'])
@login_required
def create_game_from_checkpoint():
    info = dict()

    info['id_game'] = request.get_json()['game-id']
    info['scn'] = request.get_json()['scn']
    info['id_user_main'] = current_user.id
    info['id_user_opponent'] = request.get_json()['id-opponent']
    info['game_name'] = request.get_json()['nombre']

    info['user_name_main'] = databaseManager.get_user(int(info['id_user_main']))['player_name']
    info['user_name_opponent'] = databaseManager.get_user(int(info['id_user_opponent']))['player_name']

    game_metadata = databaseTavernManager.get_game(info['id_game'])
    info['id_user_main_real'] = game_metadata['id_user_main']
    info['id_user_opponent_real'] = game_metadata['id_user_opponent']
    databaseTavernManager.duplicate_game(info)
    return redirect("/tavern", code=302)


@app.route('/calendar', methods=['GET'])
@login_required
def view_calendar():
    events = databaseManager.get_all_events_from_calendar()
    return render_template('calendar.html', events=events)


@login_required
@app.route("/calendar-action", methods=["POST"])
def event_action():
    data = request.json
    event_id = data.get("event_id")
    action = data.get("action")
    user = data.get("user")

    if action=="apuntarme":
        databaseManager.add_player_on_event(user,event_id)
    elif action=="desapuntarme":
        databaseManager.remove_player_on_event(user, event_id)

    return redirect("/calendar", code=302)


@login_required
@app.route("/add-new-event", methods=["POST"])
def add_new_event():
    data = request.form
    info = dict()
    info['day'] = data['calendar']
    info['title'] = data['nombre']
    info['description'] = data['description']
    databaseManager.add_events_on_calendar(info)

    return redirect("/calendar", code=302)


@app.route('/control-panel', methods=['GET'])
@login_required
def view_control_panel():
    if databaseManager.get_user(current_user.id)['is_admin'] == 0:
        return redirect("/home", code=302)
    all_users = databaseManager.get_all_players()
    return render_template('control-panel.html', all_users=all_users)


@app.route('/control-panel/<user_id>', methods=['GET'])
@login_required
def view_control_panel_user(user_id):
    user = databaseManager.get_user(user_id)
    return render_template('control-panel-edit.html', user=user)


@app.route('/save-user/<user_id>', methods=['POST'])
@login_required
def save_user_from_control_panel(user_id):
    all_info = dict()
    all_info['id_player'] = user_id
    all_info['team'] = request.form['team']
    if 'password' in request.form and request.form['password']!="":
        all_info['password'] = get_password_hash(request.form['password'])
    else:
        all_info['password'] = databaseManager.get_user(user_id)['player_password']

    if 'is_admin' in request.form:
        all_info['is_admin'] = 1
    else:
        all_info['is_admin'] = 0

    if 'is_inactive' in request.form:
        all_info['is_inactive'] = 1
    else:
        all_info['is_inactive'] = 0

    print(request.form)
    databaseManager.update_user(all_info)
    return redirect('/control-panel')
