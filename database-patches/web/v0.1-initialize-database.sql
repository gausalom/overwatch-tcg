
CREATE TABLE COMMENT (
ID_COMMENT integer NOT NULL  PRIMARY KEY autoincrement ,
ID_DECK integer,
ID_PLAYER integer,
COMMENT text,
DATE_CREATED
);

CREATE TABLE DECK (
ID_DECK integer NOT NULL  PRIMARY KEY autoincrement ,
DECK_NAME text,
ID_PLAYER integer,
FACTION integer,
SET_DECK integer,
IMAGE text,
IS_ACTIVE bool,
DATE_CREATED date,
STATUS TEXT)
;

CREATE TABLE DECK_LIST (
ID_DECK integer,
DECK_LIST text,
VERSION integer,
DATE_CREATED date
);

CREATE TABLE GLOBAL_SYSTEM  (
global_var text,
value text,
UNIQUE(global_var)
);

insert or ignore into GLOBAL_SYSTEM(global_var, value)
    values ('CODE_SIGNUP', 'Somos Inkreibles');

CREATE TABLE PLAYER (
ID_PLAYER             integer NOT NULL  PRIMARY KEY autoincrement ,
PLAYER_NAME           text     ,
PLAYER_PASSWORD       text     ,
DATE_CREATED         date
, TEAM TEXT, IS_ADMIN BOOL, IS_INACTIVE BOOL);

-- RESULTS_IN_TOURNAMENTS definition

CREATE TABLE "RESULTS_IN_TOURNAMENTS" (
ID_RESULT integer NOT NULL  PRIMARY KEY autoincrement ,
ID_TOURNAMENT integer,
ID_PLAYER integer,
ID_DECK integer,
VERSION integer,
faction integer,
IS_OTP bool,
HAS_WON_DICE bool,
win_first_game bool,
win_second_game bool,
win_third_game bool,
COMMENT text,
DATE_CREATED date
, REPLAY_LINK TEXT);

-- TOURNAMENTS definition

CREATE TABLE TOURNAMENTS (
ID_TOURNAMENT integer NOT NULL  PRIMARY KEY autoincrement ,
TOURNAMENT_NAME text,
IMAGE text,
SET_TOURNAMENT integer,
IS_ACTIVE bool,
DATE_CREATED date
);

-- GUIDE_DECKS_CONTENT definition

CREATE TABLE GUIDE_DECKS_CONTENT (
ID_DECK integer NOT NULL PRIMARY KEY,
INTRODUCTION text,
GENERAL_DESCRIPTION text,
CARD_ANALYSIS text,
MAIN_LINES text,
MULLIGAN text,
DATE_CREATED date
);

-- GUIDE_DECKS_MATCHUPS definition

CREATE TABLE GUIDE_DECKS_MATCHUPS (
ID_DECK integer,
DECK_NAME text,
FIRST_INK integer,
SECOND_INK integer,
CONTENT text,
DATE_CREATED date
);

-- REPLAYS definition

CREATE TABLE REPLAYS(
ID_REPLAY integer NOT NULL  PRIMARY KEY autoincrement ,
ID_PLAYER INTEGER,
REPLAY_NAME text,
REPLAY_LINK text,
DATE_CREATED date
);

-- REPLAYS_COMMENTS definition

CREATE TABLE REPLAYS_COMMENTS (
ID_COMMENT integer NOT NULL  PRIMARY KEY autoincrement,
ID_REPLAY integer,
ID_PLAYER integer,
COMMENT text,
DATE_CREATED date
);

CREATE TABLE CALENDAR (
    ID_EVENT integer NOT NULL PRIMARY KEY,
    DAY text,
    TITLE text,
    DESCRIPTION text,
    PLAYERS text,
    DATE_CREATED date
);