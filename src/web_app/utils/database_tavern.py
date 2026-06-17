import sqlite3
import os
from flask import g
from web_app.utils.utils import get_password_hash


class DatabaseTavernManager:

    def __init__(self, database_name):
        # Obtener la ruta absoluta del archivo config.py
        current_dir = os.path.dirname(os.path.abspath(__file__))  # Directorio actual (utils)
        db_path = os.path.join(current_dir, '../../db')  # Regresa dos niveles para llegar a db

        # Si deseas acceder a un archivo dentro de la carpeta db
        self.database_file = os.path.join(db_path, database_name)
        self.initialize_web()

    def get_db(self):
        if "db_tavern" not in g:
            g.db_tavern = sqlite3.connect(self.database_file)
            g.db_tavern.execute('PRAGMA journal_mode = WAL;')
        return g.db_tavern

    def initialize_web(self):
        connection = sqlite3.connect(self.database_file, check_same_thread=False)
        cursor = connection.cursor()
        sql_query_initialization= [
            """
            create table if not exists GAMES (
                ID_GAME integer NOT NULL  PRIMARY KEY autoincrement ,
                game_name text,
                game_set integer,
                id_user_main integer,
                user_name_main integer,
                deck_user_main text,
                deck_user_shuffled_main text,
                id_user_opponent integer,
                user_name_opponent integer,
                deck_user_opponent text,
                deck_user_shuffled_opponent text,
                seed text,
                is_finished bool,
                DATE_CREATED date
            )
            """,
            """
            create table if not exists ACTIONS (
                ID_GAME integer,
                scn integer,
                id_user integer,
                id_action integer,
                info text,
                DATE_CREATED date
            )
            """,
            """
            create table if not exists CHECKPOINTS (
                ID_GAME integer,
                scn integer,
                id_user integer,
                DATE_CREATED date
            )
            """
        ]
        for sql in sql_query_initialization:
            cursor.execute(sql)
        connection.commit()

        cursor.close()
        connection.close()

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

    def run_dml_query(self, query, values):
        db = self.get_db()
        cursor = db.cursor()
        cursor.execute(query, values)
        db.commit()

    def create_new_game(self, game_info):
        db = self.get_db()
        cursor = db.cursor()

        insert_query = """
                               INSERT INTO GAMES  
                               (game_name, game_set, id_user_main, user_name_main, deck_user_main, deck_user_shuffled_main, id_user_opponent, 
                               user_name_opponent, deck_user_opponent, deck_user_shuffled_opponent, seed, is_finished, date_created)
                               values (?,?,?,?,?,?,?,?,?,?,?, false, datetime('now'))
                           """

        values = (
            game_info['name'], game_info['game_set'], game_info['id_user_main'], game_info['user_name_main'],
            game_info['deck_user_main'], game_info['deck_user_shuffled_main'], game_info['id_user_opponent'], game_info['user_name_opponent'],
            game_info['deck_user_opponent'], game_info['deck_user_shuffled_opponent'], game_info['seed'],
        )

        cursor.execute(insert_query, values)
        db.commit()
        last_row_id = cursor.lastrowid
        cursor.close()
        return last_row_id

    def save_checkpoint(self, checkpoint_info):
        db = self.get_db()
        cursor = db.cursor()

        insert_query = """
                               INSERT INTO CHECKPOINTS  
                               (ID_GAME, scn, id_user, date_created)
                               values (?,?,?, datetime('now'))
                           """

        values = (
            checkpoint_info['id_game'], checkpoint_info['scn'], checkpoint_info['id_user'],
        )

        cursor.execute(insert_query, values)
        db.commit()
        cursor.close()

    def add_new_action(self, action):
        db = self.get_db()
        cursor = db.cursor()

        insert_query = """
                               INSERT INTO ACTIONS  
                               (id_game, scn, id_user, id_action, info, date_created, seat)
                               values (?,?,?,?,?, datetime('now'), ?)
                           """

        values = (
            action['id_game'],action['scn'],action['id_user'],action['id_action'],action['info'], action['seat']
        )

        cursor.execute(insert_query, values)
        db.commit()
        last_row_id = cursor.lastrowid
        cursor.close()
        return last_row_id

    def get_all_games(self):
        query = """
            select * from GAMES WHERE DATE_CREATED > DATE(datetime('now'), '-14 days')
        """
        return self.run_select_query(query)

    def get_all_active_games(self):
        query = """
            select * from GAMES where is_finished is False and DATE_CREATED > DATE(datetime('now'), '-14 days')
        """
        return self.run_select_query(query)

    def get_all_checkpoints(self):
        query = """
                    select a.ID_GAME, a.scn, a.id_user, a.DATE_CREATED,
                     b.game_name, b.game_set, b.id_user_main, b.user_name_main, b.deck_user_main,
                     b.deck_user_shuffled_main, b.id_user_opponent, b.user_name_opponent, 
                     b.deck_user_opponent, b.deck_user_shuffled_opponent, b.seed,
                     b.is_finished
                     from CHECKPOINTS a left join GAMES b on a.ID_GAME = b.ID_GAME
                     WHERE a.DATE_CREATED > DATE(datetime('now'), '-14 days')
                """
        return self.run_select_query(query)

    def get_game(self, id_game):
        query = """
            select *, (select case when max(scn)=0 then 0 else max(scn) end from ACTIONS where ID_GAME="""+str(int(id_game))+""") as last_scn from GAMES where ID_GAME = """+str(int(id_game))+"""
        """
        return self.run_select_query(query)[0]

    def get_actions(self, id_game, scn=0):
        query = """
            select * from ACTIONS WHERE ID_GAME = """+str(id_game)+""" AND SCN > """+str(scn)+"""
        """
        return self.run_select_query(query)

    def finish_game(self, id_game):
        self.run_dml_query("UPDATE GAMES SET IS_FINISHED=TRUE where ID_GAME=?", (id_game,))

    def delete_checkpoint(self, checkpoint_info):
        query = """
            delete from CHECKPOINTS where ID_GAME=? and SCN=? and ID_USER=?
        """
        self.run_dml_query(query,(checkpoint_info['id_game'], checkpoint_info['scn'], checkpoint_info['id_user'],))


    def duplicate_game(self, info):
        db = self.get_db()
        cursor = db.cursor()

        insert_query = """
                           INSERT INTO GAMES (game_name, game_set, id_user_main, user_name_main, deck_user_main, deck_user_shuffled_main, 
            id_user_opponent, user_name_opponent, deck_user_opponent, deck_user_shuffled_opponent, seed, is_finished, date_created)
            select ? as game_name, game_set, ? as id_user_main, ? as user_name_main, deck_user_main, deck_user_shuffled_main, 
            ? as id_user_opponent, ? as user_name_opponent, deck_user_opponent, deck_user_shuffled_opponent, seed, 0 as is_finished, 
            datetime('now') as date_created
            from GAMES
            where id_game = ?
                                   """

        values = (
            info['game_name'], info['id_user_main'], info['user_name_main'], info['id_user_opponent'],
            info['user_name_opponent'], info['id_game'],
        )

        cursor.execute(insert_query, values)
        db.commit()
        last_row_id = cursor.lastrowid

        insert_query = """
                        INSERT INTO ACTIONS (
                            id_game,
                            scn,
                            id_user,
                            id_action,
                            info,
                            seat
                        )
                        SELECT
                            ? AS id_game,
                        
                            scn,
                        
                            CASE id_user
                                WHEN ? THEN ?   -- main_real → main
                                WHEN ? THEN ?   -- opponent_real → opponent
                                ELSE id_user
                            END AS id_user,
                        
                            id_action,
                        
                            CASE
                                -- SIN PIPE
                                WHEN instr(info, '|') = 0 THEN
                                    CASE
                                        WHEN substr(info, 1, instr(info, '-') - 1) = ? THEN
                                            ? || substr(info, instr(info, '-'))
                                        WHEN substr(info, 1, instr(info, '-') - 1) = ? THEN
                                            ? || substr(info, instr(info, '-'))
                                        ELSE info
                                    END
                        
                                -- CON PIPE
                                ELSE
                                    -- bloque 1
                                    (
                                        CASE
                                            WHEN substr(info, 1, instr(info, '-') - 1) = ? THEN
                                                ? || substr(info, instr(info, '-'), instr(info, '|') - instr(info, '-'))
                                            WHEN substr(info, 1, instr(info, '-') - 1) = ? THEN
                                                ? || substr(info, instr(info, '-'), instr(info, '|') - instr(info, '-'))
                                            ELSE substr(info, 1, instr(info, '|') - 1)
                                        END
                                    )
                                    || '|' ||
                                    -- bloque 2
                                    (
                                        CASE
                                            WHEN substr(info, instr(info, '|') + 1,
                                                        instr(substr(info, instr(info, '|') + 1), '-') - 1) = ? THEN
                                                ? || substr(info,
                                                            instr(info, '|') + instr(substr(info, instr(info, '|') + 1), '-'))
                                            WHEN substr(info, instr(info, '|') + 1,
                                                        instr(substr(info, instr(info, '|') + 1), '-') - 1) = ? THEN
                                                ? || substr(info,
                                                            instr(info, '|') + instr(substr(info, instr(info, '|') + 1), '-'))
                                            ELSE substr(info, instr(info, '|') + 1)
                                        END
                                    )
                            END AS info, seat
                        
                        FROM ACTIONS
                        WHERE scn <= ? and id_game = ?;

                                           """

        values = (
            last_row_id,
            info['id_user_main_real'], info['id_user_main'],
            info['id_user_opponent_real'], info['id_user_opponent'],

            str(info['id_user_main_real']), str(info['id_user_main']),
            str(info['id_user_opponent_real']), str(info['id_user_opponent']),

            str(info['id_user_main_real']), str(info['id_user_main']),
            str(info['id_user_opponent_real']), str(info['id_user_opponent']),

            str(info['id_user_main_real']), str(info['id_user_main']),
            str(info['id_user_opponent_real']), str(info['id_user_opponent']),

            info['scn'],
            info['id_game'],
        )

        cursor.execute(insert_query, values)
        db.commit()
        cursor.close()