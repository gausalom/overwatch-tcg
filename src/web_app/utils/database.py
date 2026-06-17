import sqlite3
import os
from flask import g
from web_app.utils.utils import get_password_hash


class DatabaseManager:

    def __init__(self, database_name):
        # Obtener la ruta absoluta del archivo config.py
        current_dir = os.path.dirname(os.path.abspath(__file__))  # Directorio actual (utils)
        db_path = os.path.join(current_dir, '../../db')  # Regresa dos niveles para llegar a db

        # Si deseas acceder a un archivo dentro de la carpeta db
        self.database_file = os.path.join(db_path, database_name)
        self.initialize_web()

    def get_db(self):
        if "db" not in g:
            g.db = sqlite3.connect(self.database_file)
            g.db.execute('PRAGMA journal_mode = WAL;')
        return g.db

    def initialize_web(self):
        connection = sqlite3.connect(self.database_file, check_same_thread=False)
        cursor = connection.cursor()
        sql_query_initialization= [
            """
            """
        ]
        for sql in sql_query_initialization:
            cursor.execute(sql)
        connection.commit()

        select_query = """
                    SELECT ID_PLAYER FROM PLAYER WHERE PLAYER_NAME = ?
                """
        cursor.execute(select_query, ('GAS',))
        row = cursor.fetchone()
        if not row:
            insert_query = """
                                INSERT INTO PLAYER
                                (player_name, player_password, date_created, is_admin, is_inactive)
                                values (?, ?, datetime('now'), 1, 0)
                            """

            values = ("GAS", get_password_hash("simck55coM!"),)
            cursor.execute(insert_query, values)
            connection.commit()

        cursor.close()
        connection.close()

    def get_user(self, id: int):
        db = self.get_db()
        cursor = db.cursor()
        user = None
        query = """
            SELECT 
                ID_PLAYER, PLAYER_NAME, PLAYER_PASSWORD, DATE_CREATED, TEAM, IS_ADMIN, IS_INACTIVE
            FROM PLAYER 
            WHERE ID_PLAYER = ?
        """

        cursor.execute(query, (id,))
        row = cursor.fetchone()
        if row is not None:
            user = dict()
            user['id_player'] = row[0]
            user['player_name'] = row[1]
            user['player_password'] = row[2]
            user['date_created'] = row[3]
            user['team'] = row[4]
            user['is_admin'] = row[5]
            user['is_inactive'] = row[6]
        cursor.close()
        return user

    def get_user_by_name(self, player_name):
        db = self.get_db()
        cursor = db.cursor()
        user = None
        query = """
            SELECT 
                ID_PLAYER, PLAYER_NAME, PLAYER_PASSWORD, DATE_CREATED, TEAM, IS_ADMIN
            FROM PLAYER 
            WHERE PLAYER_NAME = ? and IS_INACTIVE=0
        """

        cursor.execute(query, (player_name,))
        row = cursor.fetchone()
        if row is not None:
            user = dict()
            user['id_player'] = row[0]
            user['player_name'] = row[1]
            user['player_password'] = row[2]
            user['date_created'] = row[3]
            user['team'] = row[4]
            user['is_admin'] = row[5]
        cursor.close()
        return user

    def alredy_exists_user(self, user_name):
        db = self.get_db()
        cursor = db.cursor()
        select_query = """
            SELECT ID_PLAYER FROM PLAYER WHERE PLAYER_NAME = ?
        """

        cursor.execute(select_query, (user_name,))
        row = cursor.fetchone()
        cursor.close()
        result = None
        if row is not None:
            result = row[0]
        cursor.close()
        return result

    def create_new_user(self, username, password):
        db = self.get_db()
        cursor = db.cursor()


        insert_query = """
                    INSERT INTO PLAYER
                    (player_name, player_password, date_created, is_admin, is_inactive)
                    values (?, ?, datetime('now'), 0, 0)
                """

        values = (
           username, password,
        )

        cursor.execute(insert_query, values)
        db.commit()
        last_row_id = cursor.lastrowid
        cursor.close()
        return last_row_id

    def create_new_deck(self, deck_info):
        db = self.get_db()
        cursor = db.cursor()


        insert_query = """
                    INSERT INTO DECK
                    (deck_name, id_player, faction, set_deck, image, is_active, date_created, status)
                    values (?, ?, ?, ?, ?, TRUE, datetime('now'), 'WIP')
                """

        values = (
           deck_info['deck_name'], deck_info['id_player'], deck_info['faction'], deck_info['set_deck'], deck_info['image'],
        )

        cursor.execute(insert_query, values)
        db.commit()
        last_row_id = cursor.lastrowid
        cursor.close()
        return last_row_id

    def create_new_tournament(self, tournament_info):
        db = self.get_db()
        cursor = db.cursor()

        insert_query = """
                       INSERT INTO TOURNAMENTS  
                       (tournament_name, image, set_tournament, is_active, date_created)
                       values (?, ?, ?, TRUE, datetime('now'))
                   """

        values = (
            tournament_info['name'], tournament_info['image'], tournament_info['set'],
        )

        cursor.execute(insert_query, values)
        db.commit()
        last_row_id = cursor.lastrowid
        cursor.close()
        return last_row_id

    def create_new_result_in_tournament(self, tournament_info):
        db = self.get_db()
        cursor = db.cursor()

        insert_query = """
                       INSERT INTO RESULTS_IN_TOURNAMENTS  
                       (id_tournament, id_player, id_deck, version, faction, is_otp, has_won_dice, win_first_game, win_second_game, win_third_game, comment, date_created, replay_link)
                       values (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), ?)
                   """

        values = (
            tournament_info['id_tournament'], tournament_info['id_player'], tournament_info['id_deck'],
            tournament_info['version'], tournament_info['faction'],
            tournament_info['is_otp'], tournament_info['has_won_dice'], tournament_info['win_first_game'],
            tournament_info['win_second_game'], tournament_info['win_third_game'], tournament_info['comment'],
            tournament_info['replay_link'],
        )

        cursor.execute(insert_query, values)
        db.commit()
        last_row_id = cursor.lastrowid
        cursor.close()
        return last_row_id

    def save_guide_deck_content(self, info):
        query = """
        INSERT OR REPLACE INTO GUIDE_DECKS_CONTENT (ID_DECK, INTRODUCTION, GENERAL_DESCRIPTION, CARD_ANALYSIS, MAIN_LINES, MULLIGAN, DATE_CREATED)
            VALUES (?,?,?,?,?,?,datetime('now'))
        """
        values = (
            info['id_deck'], info['introduction'], info['general_description'],
            info['card_analysis'],  info['main_lines'],  info['mulligan'],
        )
        self.run_update_query(query, values)

    def delete_all_matchups_from_deck(self, deck_id):
        query = """
        DELETE FROM GUIDE_DECKS_MATCHUPS WHERE ID_DECK = ?
        """
        values = (
            deck_id,
        )
        self.run_update_query(query, values)

    def add_matchups_to_deck(self, info):
        query = """
        INSERT INTO GUIDE_DECKS_MATCHUPS (ID_DECK, DECK_NAME, FACTION, CONTENT, DATE_CREATED)
        VALUES (?,?,?,?,?,datetime('now'))
        """
        values = (
            info['id_deck'],info['deck_name'],info['faction'],info['content'],
        )
        self.run_update_query(query, values)

    def update_result(self, result_info):
        query = """
        UPDATE RESULTS_IN_TOURNAMENTS
            SET ID_TOURNAMENT=?, ID_PLAYER=?, ID_DECK=?, VERSION=?, FACTION=?, IS_OTP=?, HAS_WON_DICE=?, win_first_game=?, win_second_game=?, win_third_game=?, COMMENT=?, REPLAY_LINK=?
            WHERE ID_RESULT=?;
        """
        values = (
            result_info['id_tournament'], result_info['id_player'], result_info['id_deck'],
            result_info['version'],  result_info['faction'],
            result_info['is_otp'],  result_info['has_won_dice'],  result_info['win_first_game'],
            result_info['win_second_game'],  result_info['win_third_game'],  result_info['comment'],
            result_info['replay_link'],result_info['id_result'],
        )
        self.run_update_query(query, values)

    def update_image_from_deck(self, id_deck, image):
        self.run_update_query("UPDATE DECK SET IMAGE = ? WHERE ID_DECK=?", (image,id_deck,))

    def update_name_from_deck(self, id_deck, deck_name):
        self.run_update_query("UPDATE DECK SET DECK_NAME = ? WHERE ID_DECK=?", (deck_name, id_deck,))

    def update_status_from_deck(self, id_deck, status):
        self.run_update_query("UPDATE DECK SET STATUS = ? WHERE ID_DECK=?", (status, id_deck,))

    def add_deck_list(self, deck_info):
        db = self.get_db()
        cursor = db.cursor()


        insert_query = """
                    INSERT INTO DECK_LIST
                    (id_deck, deck_list, version, date_created)
                    values (?, ?, ?, datetime('now'))
                """

        values = (
           deck_info['id_deck'], deck_info['deck_list'], deck_info['version'],
        )

        cursor.execute(insert_query, values)
        db.commit()
        cursor.close()

    def add_comment_to_deck(self, comment_info):
        db = self.get_db()
        cursor = db.cursor()

        insert_query = """
                    INSERT INTO COMMENT
                    (id_deck, id_player, comment, date_created)
                    values (?, ?, ?, datetime('now'))
                """

        values = (
           comment_info['id_deck'], comment_info['id_player'], comment_info['comment'],
        )

        cursor.execute(insert_query, values)
        db.commit()
        cursor.close()

    def run_select_query(self, query):
        db = self.get_db()
        cursor = db.cursor()
        res = cursor.execute(
            query
        )
        rows = res.fetchall()
        col_names = [desc[0].lower() for desc in cursor.description]  # obtiene los nombres de columna
        cursor.close()

        # convertir cada fila en un dict automáticamente
        rows_to_return = [dict(zip(col_names, row)) for row in rows]
        return rows_to_return

    def run_update_query(self, query, values):
        db = self.get_db()
        cursor = db.cursor()
        cursor.execute(query, values)
        db.commit()

    def delete_deck(self, deck_id):
        self.run_update_query("UPDATE DECK SET IS_ACTIVE = FALSE WHERE ID_DECK=?",(deck_id,) )

    def get_all_replays(self):
        query = """
                    select * From (
                        select a.ID_REPLAY, a.ID_PLAYER, b.PLAYER_NAME, a.REPLAY_NAME, a.REPLAY_LINK, a.DATE_CREATED
                        from REPLAYS a 
                        inner join PLAYER b on a.ID_PLAYER = b.ID_PLAYER
                        
                        union
                        
                        -- Añadimos las replays que se han subido a torneos
                        select 't' || a.ID_RESULT as ID_REPLAY, a.ID_PLAYER, 
                        b.PLAYER_NAME, 
                        c.DECK_NAME || ' vs ' || 
                            case when a.faction = 1 then 'Vanguard' 
                            when a.faction = 2 then 'Dominion'
                            when a.faction = 3 then 'Omnic'
                            when a.faction = 4 then 'Outlander'
                            when a.faction = 5 then 'Overwatch'
                            end
                            as REPLAY_NAME, 
                        a.REPLAY_LINK, a.DATE_CREATED
                        from RESULTS_IN_TOURNAMENTS a 
                        inner join PLAYER b on a.ID_PLAYER = b.ID_PLAYER
                        left join DECK c on a.ID_DECK = c.ID_DECK
                        where a.REPLAY_LINK is not NULL
                    ) order by DATE_CREATED desc
                """
        return self.run_select_query(query)

    def get_replay_from_id(self, id_replay):
        query = """
                    select a.ID_REPLAY, a.ID_PLAYER, b.PLAYER_NAME, a.REPLAY_NAME, a.REPLAY_LINK, a.DATE_CREATED
                    from REPLAYS a 
                    inner join PLAYER b on a.ID_PLAYER = b.ID_PLAYER
                    where a.ID_REPLAY = """+str(id_replay)+""" 
                """
        return self.run_select_query(query)[0]

    def get_replay_from_id_events(self, id_replay):
        id_replay *= -1
        query = """
                        select 't' || a.ID_RESULT as ID_REPLAY, a.ID_PLAYER, 
                b.PLAYER_NAME, 
                c.DECK_NAME || ' vs ' || 
                    case when a.faction = 1 then 'Vanguard' 
                            when a.faction = 2 then 'Dominion'
                            when a.faction = 3 then 'Omnic'
                            when a.faction = 4 then 'Outlander'
                            when a.faction = 5 then 'Overwatch'
                            end
                            as REPLAY_NAME, 
                a.REPLAY_LINK, a.DATE_CREATED
                from RESULTS_IN_TOURNAMENTS a 
                inner join PLAYER b on a.ID_PLAYER = b.ID_PLAYER
                left join DECK c on a.ID_DECK = c.ID_DECK
                where a.REPLAY_LINK is not NULL and a.ID_RESULT="""+str(id_replay)+"""
                        """
        return self.run_select_query(query)[0]

    def add_replay(self, data):
        query = """
        INSERT INTO REPLAYS (ID_PLAYER, REPLAY_NAME, REPLAY_LINK, DATE_CREATED)
        VALUES (?,?,?,datetime('now'))
        """
        values = (
            data['id_player'], data['name'], data['link'],
        )
        self.run_update_query(query, values)

    def add_replay_comment(self, data):
        query = """
        INSERT INTO REPLAYS_COMMENTS (ID_REPLAY, ID_PLAYER, COMMENT, DATE_CREATED)
        VALUES (?,?,?,datetime('now'))
        """
        values = (
            data['id_replay'], data['id_player'], data['comment'],
        )
        self.run_update_query(query, values)

    def get_all_comments_from_deck(self, id_deck):
        query = """select ID_COMMENT, ID_DECK, ID_PLAYER, COMMENT, DATE_CREATED, PLAYER_NAME, VERSION 
                    From (
                        select a.*, b.PLAYER_NAME , ROW_NUMBER() OVER (PARTITION BY a.COMMENT, b.PLAYER_NAME ORDER BY c.DATE_CREATED desc) as RN, c.VERSION
                        from COMMENT a  
                        left join PLAYER b on a.ID_PLAYER = b.ID_PLAYER
                        left join DECK_LIST c on a.ID_DECK = c.ID_DECK
                        where a.DATE_CREATED >= c.DATE_CREATED and a.ID_DECK="""+str(id_deck)+"""
                    )
                    where RN=1
                    order by DATE_CREATED asc"""
        return self.run_select_query(query)

    def get_all_comments_from_replay(self, id_replay):
        query = """
            select a.ID_PLAYER as ID_PLAYER, a.COMMENT, a.DATE_CREATED, b.PLAYER_NAME
            from REPLAYS_COMMENTS a 
            left join PLAYER b on a.ID_PLAYER = b.ID_PLAYER
            where a.ID_REPLAY = """+str(id_replay)+"""
        """
        return self.run_select_query(query)

    def get_all_decks(self, id_player_order = -1, set_to_filter=None, team = None):
        if set_to_filter is None:
            query = """select a.*, b.PLAYER_NAME from DECK a  left join PLAYER b on a.ID_PLAYER = b.ID_PLAYER 
                        WHERE (a.IS_ACTIVE = TRUE and (b.TEAM = '"""+str(team)+"""' or a.STATUS='Public') and b.IS_INACTIVE=0)
                        or a.ID_PLAYER="""+str(id_player_order)+"""
                        ORDER BY 
                            CASE WHEN a.ID_PLAYER = """+str(id_player_order)+""" then 0 else 1 end, a.ID_PLAYER"""

        else:
            query = """select a.*, b.PLAYER_NAME 
                        from DECK a  
                        left join PLAYER b on a.ID_PLAYER = b.ID_PLAYER 
                        WHERE a.IS_ACTIVE = TRUE and b.IS_INACTIVE=0 and a.SET_DECK = """+str(set_to_filter)+""" and 
                        (b.TEAM = '"""+str(team)+"""' or a.STATUS='Public')
                        ORDER BY 
                        CASE WHEN a.ID_PLAYER = """ + str(id_player_order) + """ then 0 else 1 end, a.ID_PLAYER"""
        return self.run_select_query(query)

    def get_all_players(self):
        query = """select id_player, player_name, date_created from PLAYER
            """
        return self.run_select_query(query)

    def get_all_players_on_event(self, id_tournament):
        query = """select distinct a.ID_PLAYER, a.PLAYER_NAME from PLAYER a inner join RESULTS_IN_TOURNAMENTS b on a.ID_PLAYER = b.ID_PLAYER
                    WHERE b.ID_TOURNAMENT="""+str(id_tournament)
        return self.run_select_query(query)

    def get_last_comments(self, team):
        query = """
            SELECT a.DATE_CREATED, a.ID_PLAYER, b.DECK_NAME, c.PLAYER_NAME, a.ID_DECK
            FROM COMMENT a 
            left join DECK b on a.ID_DECK = b.ID_DECK 
            left join PLAYER c on a.ID_PLAYER = c.ID_PLAYER 
            WHERE c.TEAM = '"""+str(team)+"""'
            order by a.DATE_CREATED desc limit 5;
        """
        return self.run_select_query(query)

    def get_last_updates_on_decks(self, team):
        query = """
            select b.ID_DECK , b.DECK_NAME , b.ID_PLAYER , b.FACTION , b.SET_DECK , b.IMAGE , c.PLAYER_NAME , a.DATE_CREATED, a.VERSION
            From DECK_LIST a
            inner join DECK b on a.ID_DECK = b.ID_DECK 
            inner join PLAYER c on b.ID_PLAYER = c.ID_PLAYER 
            where c.TEAM = '"""+str(team)+"""'
            order by a.DATE_CREATED desc
            limit 5;
        """
        return self.run_select_query(query)

    def get_last_results(self, team):
        query = """
            select (CASE WHEN a.WIN_FIRST_GAME=1 then 1 else 0 end + 
                    CASE WHEN a.WIN_SECOND_GAME=1 then 1 else 0 end + 
                    CASE WHEN a.WIN_THIRD_GAME=1 then 1 else 0 end) as result_win,
                    (CASE WHEN a.WIN_FIRST_GAME=1 then 0 else 1 end + 
                    CASE WHEN a.WIN_SECOND_GAME=0 then 1 else 0 end + 
                    CASE WHEN a.WIN_THIRD_GAME=0 and a.win_third_game is not null then 1 else 0 end) as result_loose,
                    b.PLAYER_NAME, c.TOURNAMENT_NAME, a.DATE_CREATED , a.ID_PLAYER, c.ID_TOURNAMENT
            from RESULTS_IN_TOURNAMENTS a 
            left join PLAYER b on a.ID_PLAYER = b.ID_PLAYER 
            left join TOURNAMENTS c on c.ID_TOURNAMENT = a.ID_TOURNAMENT 
            where b.TEAM = '"""+str(team)+"""'
            order by a.DATE_CREATED desc limit 5;
        """
        return self.run_select_query(query)

    def get_all_decks_from_user(self, player_id):
        query = """select a.*, b.PLAYER_NAME from DECK a  left join PLAYER b on a.ID_PLAYER = b.ID_PLAYER WHERE a.IS_ACTIVE = TRUE and a.ID_PLAYER="""+str(player_id)
        return self.run_select_query(query)

    def get_all_tournaments(self):
        query = """select * from TOURNAMENTS a WHERE a.IS_ACTIVE = TRUE"""
        return self.run_select_query(query)

    def get_guide_content_from_deck(self, deck_id):
        query = """select * from GUIDE_DECKS_CONTENT a WHERE a.ID_DECK = """+str(deck_id)
        result = self.run_select_query(query)
        if result is None or len(result)==0:
            return None
        else:
            return result[0]

    def get_guide_matchups_from_deck(self, deck_id):
        query = """select * from GUIDE_DECKS_MATCHUPS a WHERE a.ID_DECK = """+str(deck_id)
        result = self.run_select_query(query)
        return result

    def get_all_results_in_tournament_by_player(self, id_tournament, id_player):
        query = """select a.*, b.DECK_NAME, 
        (CASE WHEN WIN_FIRST_GAME=1 then 1 else 0 end + 
        CASE WHEN WIN_SECOND_GAME=1 then 1 else 0 end + 
        CASE WHEN WIN_THIRD_GAME=1 then 1 else 0 end) as result_win,
        (CASE WHEN WIN_FIRST_GAME=1 then 0 else 1 end + 
        CASE WHEN WIN_SECOND_GAME=0 then 1 else 0 end + 
        CASE WHEN WIN_THIRD_GAME=0 and win_third_game is not null then 1 else 0 end) as result_loose
        from RESULTS_IN_TOURNAMENTS a 
        left join DECK b on a.ID_DECK = b.ID_DECK
        WHERE a.ID_TOURNAMENT = """+str(id_tournament)+""" and a.ID_PLAYER = """+str(id_player)
        return self.run_select_query(query)

    def get_all_results_by_deck(self, id_deck):
        query = """select a.*, b.DECK_NAME, 
        (CASE WHEN WIN_FIRST_GAME=1 then 1 else 0 end + 
        CASE WHEN WIN_SECOND_GAME=1 then 1 else 0 end + 
        CASE WHEN WIN_THIRD_GAME=1 then 1 else 0 end) as result_win,
        (CASE WHEN WIN_FIRST_GAME=1 then 0 else 1 end + 
        CASE WHEN WIN_SECOND_GAME=0 then 1 else 0 end + 
        CASE WHEN WIN_THIRD_GAME=0 and win_third_game is not null then 1 else 0 end) as result_loose,
        c.TOURNAMENT_NAME, d.PLAYER_NAME, b.SET_DECK
        from RESULTS_IN_TOURNAMENTS a 
        left join DECK b on a.ID_DECK = b.ID_DECK
        left join TOURNAMENTS c on a.ID_TOURNAMENT = c.ID_TOURNAMENT
        left join PLAYER d on a.ID_PLAYER = d.ID_PLAYER
        WHERE b.IS_ACTIVE = 1 and a.ID_DECK = """+str(id_deck)
        return self.run_select_query(query)

    def get_all_results_by_player(self, id_player):
        query = """select a.*, b.DECK_NAME, 
        (CASE WHEN WIN_FIRST_GAME=1 then 1 else 0 end + 
        CASE WHEN WIN_SECOND_GAME=1 then 1 else 0 end + 
        CASE WHEN WIN_THIRD_GAME=1 then 1 else 0 end) as result_win,
        (CASE WHEN WIN_FIRST_GAME=1 then 0 else 1 end + 
        CASE WHEN WIN_SECOND_GAME=0 then 1 else 0 end + 
        CASE WHEN WIN_THIRD_GAME=0 and win_third_game is not null then 1 else 0 end) as result_loose,
        c.TOURNAMENT_NAME, d.PLAYER_NAME, b.SET_DECK
        from RESULTS_IN_TOURNAMENTS a 
        left join DECK b on a.ID_DECK = b.ID_DECK
        left join TOURNAMENTS c on a.ID_TOURNAMENT = c.ID_TOURNAMENT
        left join PLAYER d on a.ID_PLAYER = d.ID_PLAYER
        WHERE b.IS_ACTIVE = 1 and a.ID_PLAYER = """+str(id_player)
        return self.run_select_query(query)

    def get_all_results_for_dashboard(self, team):
        query = """select a.*, b.DECK_NAME, 
        (CASE WHEN WIN_FIRST_GAME=1 then 1 else 0 end + 
        CASE WHEN WIN_SECOND_GAME=1 then 1 else 0 end + 
        CASE WHEN WIN_THIRD_GAME=1 then 1 else 0 end) as result_win,
        (CASE WHEN WIN_FIRST_GAME=1 then 0 else 1 end + 
        CASE WHEN WIN_SECOND_GAME=0 then 1 else 0 end + 
        CASE WHEN WIN_THIRD_GAME=0 and win_third_game is not null then 1 else 0 end) as result_loose,
        c.TOURNAMENT_NAME, d.PLAYER_NAME, b.SET_DECK
        from RESULTS_IN_TOURNAMENTS a 
        inner join DECK b on a.ID_DECK = b.ID_DECK
        inner join TOURNAMENTS c on a.ID_TOURNAMENT = c.ID_TOURNAMENT
        inner join PLAYER d on a.ID_PLAYER = d.ID_PLAYER
        where b.IS_ACTIVE = 1 and d.TEAM='"""+str(team)+"""'"""
        return self.run_select_query(query)

    def get_tournament_by_id(self, id):
        query = """select * from TOURNAMENTS a WHERE ID_TOURNAMENT="""+(str(id))
        return self.run_select_query(query)[0]

    def get_result_in_tournament_by_id(self, id):
        query = """select * from RESULTS_IN_TOURNAMENTS a WHERE ID_RESULT="""+(str(id))
        return self.run_select_query(query)[0]

    def get_deck(self, id_deck):
        query = """select a.*, b.PLAYER_NAME, c.DECK_LIST, c.VERSION, d.VERSIONS, c.DATE_CREATED as DATE_UPDATE
                    from DECK a  
                    left join PLAYER b on a.ID_PLAYER = b.ID_PLAYER 
                    left join (select ID_DECK, GROUP_CONCAT(VERSION) as VERSIONS from DECK_LIST where ID_DECK = """+str(id_deck)+""") d on a.ID_DECK = d.ID_DECK
                    left join (
                        select ID_DECK, DECK_LIST, VERSION, DATE_CREATED
                        from (
                            select ROW_NUMBER() OVER (PARTITION BY ID_DECK ORDER BY VERSION DESC) as RN, *
                            From DECK_LIST
                        )
                        where RN= 1
                    ) c on a.ID_DECK = c.ID_DECK
                    WHERE a.ID_DECK="""+str(id_deck)
        return self.run_select_query(query)[0]

    def get_deck_by_version(self, id_deck, version):
        query = """select a.*, b.PLAYER_NAME, c.DECK_LIST, c.VERSION, d.VERSIONS, c.DATE_CREATED as DATE_UPDATE
                    from DECK a  
                    left join PLAYER b on a.ID_PLAYER = b.ID_PLAYER 
                    left join (select ID_DECK, GROUP_CONCAT(VERSION) as VERSIONS from DECK_LIST where ID_DECK = """+str(id_deck)+""") d on a.ID_DECK = d.ID_DECK
                    left join (
                        select ID_DECK, DECK_LIST, VERSION, DATE_CREATED
                        from (
                            select ROW_NUMBER() OVER (PARTITION BY ID_DECK ORDER BY VERSION DESC) as RN, *
                            From DECK_LIST
                        )
                        where VERSION = """+str(version)+"""
                    ) c on a.ID_DECK = c.ID_DECK
                    WHERE a.ID_DECK="""+str(id_deck)
        return self.run_select_query(query)[0]

    def get_signup_code(self):
        db = self.get_db()
        cursor = db.cursor()
        res = cursor.execute("SELECT VALUE FROM GLOBAL_SYSTEM WHERE GLOBAL_VAR = 'CODE_SIGNUP'")
        row = res.fetchone()
        cursor.close()
        result = None
        if row is not None:
            result = row[0]
        return result

    def delete_result_in_tournament(self, id_result):
        self.run_update_query("DELETE FROM RESULTS_IN_TOURNAMENTS WHERE ID_RESULT=?",(id_result,) )

    def get_all_events_from_calendar(self):
        query = """
            select * from CALENDAR
        """
        return self.run_select_query(query)

    def add_events_on_calendar(self, info):
        query = """
        INSERT INTO CALENDAR (DAY,TITLE,DESCRIPTION,DATE_CREATED)
        VALUES (?,?,?,datetime('now'))
        """
        values = (
            info['day'], info['title'], info['description'],
        )
        self.run_update_query(query, values)

    def add_player_on_event(self, player_name, id_event):
        query = """
            UPDATE CALENDAR SET PLAYERS = 
            CASE WHEN PLAYERS IS NULL OR PLAYERS == '' then ?
                ELSE PLAYERS || ', ' || ?
                end 
            where ID_EVENT = ?
        """
        self.run_update_query(query, (player_name, player_name, id_event,))

    def remove_player_on_event(self, player_name, id_event):
        query = """
                   UPDATE CALENDAR 
                    SET PLAYERS = REPLACE(REPLACE(REPLACE(PLAYERS, ', """+str(player_name)+"""', ''), '"""+str(player_name)+""", ', ''), '"""+str(player_name)+"""', '')
                    where ID_EVENT=?
                """
        self.run_update_query(query, (id_event,))

    def update_user(self, user_info):
        query = """
        UPDATE PLAYER
            SET TEAM=?, PLAYER_PASSWORD=?, IS_ADMIN = ?, IS_INACTIVE = ?
            WHERE ID_PLAYER=?;
        """
        values = (
            user_info['team'], user_info['password'], user_info['is_admin'], user_info['is_inactive'], user_info['id_player'],
        )
        self.run_update_query(query, values)
