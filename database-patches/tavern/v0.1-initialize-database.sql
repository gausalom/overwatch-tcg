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
);

create table if not exists ACTIONS (
    ID_GAME integer,
    scn integer,
    id_user integer,
    id_action integer,
    info text,
    DATE_CREATED date,
    ACTIONS text
);

create table if not exists CHECKPOINTS (
    ID_GAME integer,
    scn integer,
    id_user integer,
    DATE_CREATED date
);
